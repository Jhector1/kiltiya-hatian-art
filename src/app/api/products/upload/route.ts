// Refactored POST handler for /api/products/upload
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import slugify from "slugify";

export const runtime = "nodejs";
export const config = { api: { bodyParser: false } };

const db = new PrismaClient();
const env = process.env.NEXT_ENV;

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
    const myUUID = crypto.randomUUID();

    // Upload main image with watermark
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

    // Upload thumbnails
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
          transformation: [
            // ← auto-format + auto-quality
            { fetch_format: "auto", quality: "auto" },
          ],
        });
      })
    );

    // Upload SVG (raw + preview)
    let svgFormatUrl: string | null = null;
    let svgPreviewUrl: string | null = null;

    if (svgFile && svgFile instanceof File) {
      const baseName = svgFile.name.replace(/\.[^/.]+$/, "");
      const svgUri = await fileToDataUri(svgFile);

      // Upload raw SVG
      const rawSvg = await cloudinary.uploader.upload(svgUri, {
        folder: `products-${env}/${safeCategory}/${myUUID}/svg`,
        use_filename: true,
        unique_filename: true,
        resource_type: "raw", // ✅ CORRECT
      });
      svgFormatUrl = rawSvg.secure_url;

      // Upload preview as PNG (with watermark)
      // const previewSvg = await cloudinary.uploader.upload(svgUri, {
      //   folder: `products-${env}/${safeCategory}/${myUUID}/svg-preview`,
      //   public_id: baseName + "_preview",
      //   resource_type: "image", // ✅ PREVIEW = image
      //   transformation: [
      //     { quality: "auto", fetch_format: "auto" },
      //     {
      //       overlay: { public_id: "watermark" },
      //       width: "1.0",
      //       height: "1.0",
      //       crop: "fill",
      //       gravity: "center",
      //       opacity: 10,
      //       flags: ["relative"],
      //     },
      //   ],
      // });
      const previewSvg = await cloudinary.uploader.upload(svgUri, {
        folder: `products-${env}/${safeCategory}/${myUUID}/svg-preview`,
        public_id: baseName + "_preview",
        resource_type: "raw", // ✅ Uploads actual SVG, not image
        use_filename: true,
        unique_filename: true,
      });

      svgPreviewUrl = previewSvg.secure_url;
    }

    // Upload other formats
    const formatFiles = formData
      .getAll("formats")
      .filter((f): f is File => f instanceof File);
    const otherFormats = formatFiles.filter((f) => f.type !== "image/svg+xml");
    const formatRes = await Promise.all(
      otherFormats.map(async (file) => {
        const uri = await fileToDataUri(file);
        const isPdf = file.type === "application/pdf";
        const uploaded = await cloudinary.uploader.upload(uri, {
          folder: `products-${env}/${safeCategory}/${myUUID}/formats`,
          use_filename: true,
          unique_filename: true,
          resource_type: isPdf ? "raw" : "auto",
        });
        return uploaded.secure_url;
      })
    );

    // **NEW**: collect sizes
    const sizes = formData
      .getAll("sizes") // all of the appended "sizes"
      .map((s) => s.toString()) // cast each to string
      .filter((s) => s.length); // drop any empty ones, if you like

    // Create category if needed
    const category = await db.category.upsert({
      where: { name: categoryName },
      create: { name: categoryName },
      update: {},
    });

    // Save to DB
    const product = await db.product.create({
      data: {
        title,
        description,
        price,
        publicId: mainRes.public_id,
        thumbnails: [mainRes.secure_url, ...thumbRes.map((r) => r.secure_url)],
        formats: formatRes,
        svgFormat: svgFormatUrl,
        svgPreview: svgPreviewUrl,
        sizes,
        category: { connect: { id: category.id } },
      },
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
