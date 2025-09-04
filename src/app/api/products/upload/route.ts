// File: src/app/api/products/upload/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import slugify from "slugify";
import crypto from "crypto";
import {
  upsertProductAsset,
  extFromUrl,
  mimeFromExt,
  isVectorExt,
} from "@/lib/productAssets";

export const runtime = "nodejs";
export const config = { api: { bodyParser: false } };

const db = new PrismaClient();
const env = process.env.NEXT_ENV ?? process.env.NODE_ENV ?? "dev";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function fileToDataUri(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const categoryName = formData.get("category")?.toString().trim();
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const price = parseFloat(formData.get("price")?.toString() || "0");
    const mainFile = formData.get("main");
    const svgFile = formData.get("svg");

    if (!categoryName || !mainFile || !(mainFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const safeCategory = slugify(categoryName, { lower: true, strict: true });
    const myUUID = `${title}-${crypto.randomUUID()}`;

    // 1) MAIN (watermarked preview)
    const mainUri = await fileToDataUri(mainFile);
    const mainRes = await cloudinary.uploader.upload(mainUri, {
      folder: `products-${env}/${safeCategory}/${myUUID}/main`,
      public_id: "original",
      resource_type: "image",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        {
          overlay: { public_id: "watermark" },
          width: "1.0",
          height: "1.0",
          crop: "fill",
          gravity: "center",
          opacity: 10,
          flags: ["relative"],
        },
      ],
    });

    // 2) THUMBNAILS
    const thumbFiles = formData
      .getAll("thumbnails")
      .filter((f): f is File => f instanceof File);
    const thumbRes = await Promise.all(
      thumbFiles.map(async (file) => {
        const uri = await fileToDataUri(file);
        return cloudinary.uploader.upload(uri, {
          folder: `products-${env}/${safeCategory}/${myUUID}/thumbnails`,
          use_filename: true,
          unique_filename: true,
          resource_type: "image",
          transformation: [{ fetch_format: "auto", quality: "auto" }],
        });
      })
    );

    // 3) SVG (deliverable raw + simple preview upload)
    let rawSvg: any | null = null;
    let svgFormatUrl: string | null = null;
    let svgPreviewUrl: string | null = null;

    if (svgFile && svgFile instanceof File) {
      const baseName = svgFile.name.replace(/\.[^/.]+$/, "");
      const svgUri = await fileToDataUri(svgFile);

      rawSvg = await cloudinary.uploader.upload(svgUri, {
        folder: `products-${env}/${safeCategory}/${myUUID}/svg`,
        use_filename: true,
        unique_filename: true,
        resource_type: "raw",
      });
      svgFormatUrl = rawSvg.secure_url;

      const previewSvg = await cloudinary.uploader.upload(svgUri, {
        folder: `products-${env}/${safeCategory}/${myUUID}/svg-preview`,
        public_id: baseName + "_preview",
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
      });
      svgPreviewUrl = previewSvg.secure_url;
    }

    // 4) OTHER FORMATS
    const formatFiles = formData
      .getAll("formats")
      .filter((f): f is File => f instanceof File);
    const otherFormats = formatFiles.filter((f) => f.type !== "image/svg+xml");

    type Uploaded = {
      secure_url: string;
      public_id: string;
      resource_type: "image" | "raw" | string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
    };

    const formatUploads: Uploaded[] = await Promise.all(
      otherFormats.map(async (file) => {
        const uri = await fileToDataUri(file);
        const isPdf = file.type === "application/pdf";
        const up = await cloudinary.uploader.upload(uri, {
          folder: `products-${env}/${safeCategory}/${myUUID}/formats`,
          use_filename: true,
          unique_filename: true,
          resource_type: isPdf ? "raw" : "auto",
        });
        return up as unknown as Uploaded;
      })
    );

    // sizes
    const sizes = formData
      .getAll("sizes")
      .map((s) => s.toString())
      .filter(Boolean);

    // 5) Category upsert
    const category = await db.category.upsert({
      where: { name: categoryName },
      create: { name: categoryName },
      update: {},
    });

    // 6) Create Product (keep legacy arrays for back-compat)
    const product = await db.product.create({
      data: {
        title,
        description,
        price,
        publicId: mainRes.public_id,
        thumbnails: [mainRes.secure_url, ...thumbRes.map((r) => r.secure_url)],
        formats: formatUploads.map((u) => u.secure_url),
        svgFormat: svgFormatUrl,
        svgPreview: svgPreviewUrl,
        sizes,
        category: { connect: { id: category.id } },
      },
    });

    // 7) ProductAsset rows (via helper)
    const preview = product.thumbnails?.[0] || svgPreviewUrl || null;

    await db.$transaction(async (tx) => {
      // SVG deliverable
      // if (rawSvg) {
      //   await upsertProductAsset(tx, {
      //     productId: product.id,
      //     url: rawSvg.secure_url,
      //     storageKey: rawSvg.public_id,
      //     previewUrl: preview,
      //     ext: "svg",
      //     mimeType: "image/svg+xml",
      //     isVector: true,
      //     sizeBytes: rawSvg.bytes ?? undefined,

      //     // NEW ↓↓↓
      //     resourceType: rawSvg.resource_type as "raw" | "image" | "video",
      //     deliveryType: rawSvg.type as "upload" | "authenticated" | "private",
      //   });
      // }

      // Other deliverables
      for (const up of formatUploads) {
        const ext = (up.format || extFromUrl(up.secure_url)).toLowerCase();
        await upsertProductAsset(tx, {
          productId: product.id,
          url: up.secure_url,
          storageKey: up.public_id,
          previewUrl: preview,
          ext,
          mimeType: mimeFromExt(ext),
          isVector: isVectorExt(ext),
          sizeBytes: up.bytes ?? undefined,
          width: up.width ?? undefined,
          height: up.height ?? undefined,

          // NEW ↓↓↓
          resourceType: up.resource_type as "raw" | "image" | "video",
          deliveryType: (up as any).type as
            | "upload"
            | "authenticated"
            | "private",
        });
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/products/upload error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { error: "General Error", details: message },
      { status: 500 }
    );
  }
}
