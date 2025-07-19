import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const config = { api: { bodyParser: false } };

const db = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function fileToDataUri(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // 1. Parse & validate inputs
    const categoryName = formData.get("category")?.toString().trim();
    const title        = formData.get("title")?.toString().trim() || "";
    const description  = formData.get("description")?.toString().trim() || "";
    const price        = parseFloat(formData.get("price")?.toString() || "0");
    const mainFile     = formData.get("main");

    if (!categoryName || !mainFile || !(mainFile instanceof File)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const thumbFiles  = formData.getAll("thumbnails").filter((f): f is File => f instanceof File);
    const formatFiles = formData.getAll("formats").filter((f): f is File => f instanceof File);

    // 2. Upload main image with watermark
    let mainRes;
    try {
      const mainUri = await fileToDataUri(mainFile);
      mainRes = await cloudinary.uploader.upload(mainUri, {
        folder:        `temp_uploads/main`,
        public_id:     "original",
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          {
            overlay: { public_id: "watermark" },
            width: "1.0",
            gravity: "center",
            crop: "fill",
            opacity: 10,
            flags: ["relative"],
          },
        ],
      });
    } catch (err) {
      console.error("Main upload failed:", err);
      return NextResponse.json({ error: "Main image upload failed", details: err }, { status: 500 });
    }

    // 3. Upload thumbnails
    let thumbRes = [];
    try {
      thumbRes = await Promise.all(
        thumbFiles.map(async (file, i) => {
          const uri = await fileToDataUri(file);
          return cloudinary.uploader.upload(uri, {
            folder:        `temp_uploads/thumbnails`,
            public_id:     `thumb_${i + 1}`,
            resource_type: "image",
          });
        })
      );
    } catch (err) {
      console.error("Thumbnail upload failed:", err);
      return NextResponse.json({ error: "Thumbnails upload failed", details: err }, { status: 500 });
    }

    // 4. Upload format files
    let formatRes = [];
    try {
      formatRes = await Promise.all(
        formatFiles.map(async (file) => {
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const uri = await fileToDataUri(file);
          const uploaded = await cloudinary.uploader.upload(uri, {
            folder:        `temp_uploads/formats`,
            public_id:     baseName,
            resource_type: "auto",
          });
          return { ...uploaded, formatName: baseName };
        })
      );
    } catch (err) {
      console.error("Format upload failed:", err);
      return NextResponse.json({ error: "Format upload failed", details: err }, { status: 500 });
    }

    // 5. Upsert category
    const category = await db.category.upsert({
      where:  { name: categoryName },
      create: { name: categoryName },
      update: {},
    });

    // 6. Create product only after uploads succeed
    const product = await db.product.create({
      data: {
        title,
        description,
        price,
        publicId:   mainRes.public_id,
        thumbnails: [mainRes.secure_url, ...thumbRes.map(r => r.secure_url)],
        formats:    formatRes.map(r => r.secure_url),
        category:   { connect: { id: category.id } },
      },
    });

    return NextResponse.json(product, { status: 201 });

  } catch (err) {
    console.error("POST /api/products/upload general error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: "General Error", details: message }, { status: 500 });
  }
}
