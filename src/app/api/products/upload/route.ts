// src/app/api/products/upload/route.ts
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

    // 1) Validate inputs
    const categoryName = formData.get("category")?.toString().trim();
    if (!categoryName) {
      return NextResponse.json({ error: "Missing 'category'" }, { status: 400 });
    }
    const title       = formData.get("title")?.toString().trim()       || "";
    const description = formData.get("description")?.toString().trim() || "";
    const price       = parseFloat(formData.get("price")?.toString()   || "0");

    // 2) Upsert Category
    const category = await db.category.upsert({
      where:  { name: categoryName },
      create: { name: categoryName },
      update: {},
    });
    async function listWatermarks() {
  const res = await cloudinary.api.resources({
    resource_type: "image",
    type:          "upload",
    prefix:        "watermark",   // list everything whose ID starts with this
    max_results:   100,
  });
  console.log(JSON.stringify(res.resources.map((r ) => r.public_id), null, 2));
}

listWatermarks().catch(console.error);

    // 3) Placeholder Product
    const placeholder = await db.product.create({
      data: {
        title,
        description,
        price,
        publicId:   "",
        thumbnails: [],
        formats:    [],
        category:   { connect: { id: category.id } },
      },
    });
    const productId = placeholder.id;

    // 4) Main image upload
    const mainFile = formData.get("main");
    if (!(mainFile instanceof File)) {
      return NextResponse.json({ error: "Missing 'main' file" }, { status: 400 });
    }
    const mainUri = await fileToDataUri(mainFile);
  // 4) Main image upload (with watermark)
  const mainRes = await cloudinary.uploader.upload(mainUri, {
  folder:        `products/${categoryName}/${productId}/main`,
  public_id:     "original",
  resource_type: "image",
   transformation: [
        // 1) Auto-optimize
        { quality: "auto", fetch_format: "auto" },
        // 2) Watermark overlay
        {
          overlay: { public_id: "watermark" }, // full folder/name
          width: "1.0", // 30% of the image width
          gravity: "center", // bottom-right
          // x: 20, // px from the edge
          // y: 20,
          crop: "fill",
          opacity: 10, // half-transparent
          flags: ["relative"], // MUST be array
        },
      ],
//  transformation: [
//     // 1) Auto‐optimize your main image
//     { quality: "auto", fetch_format: "auto" },

//     // 2) Place watermark *behind* the main image
//     {
//       underlay: { public_id: "watermark" }, // your watermark asset
//       width:    "0.3",           // scale to 30% of image width
//       gravity:  "south_east",    // position bottom-right
//       x:        20,
//       y:        20,
//       opacity:  50,              // 50% transparent
//       flags:   ["relative"],     // interpret sizing/positioning relative to image
//     },

//     // 3) Finally, layer the main upload (default layer)
//     //    By default the uploaded image sits on top of any underlay.
//   ],
});
//  transformation: [
//         // 1) Auto-optimize
//         { quality: "auto", fetch_format: "auto" },
//         // 2) Watermark overlay
//         {
//           overlay: { public_id: "watermark" }, // full folder/name
//           width: "1.0", // 30% of the image width
//           gravity: "center", // bottom-right
//           // x: 20, // px from the edge
//           // y: 20,
//           crop: "fill",
//           opacity: 20, // half-transparent
//           flags: ["relative"], // MUST be array
//         },
//       ],
// const mainRes = await cloudinary.uploader.upload(mainUri, {
//   folder:        `products/${categoryName}/${productId}/main`,
//   public_id:     "original",
//   resource_type: "image",
//   transformation: [
//     // (Optional) basic auto-quality/limit step
//     { quality: "auto", fetch_format: "auto" },
//     // Watermark overlay step
//     {
//       // Option A: use an existing image asset as watermark
//       overlay: "watermark/watermark",     // <— your watermark’s public_id
//       width: "0.3",                  // 30% of main image width
//       gravity: "south_east",         // bottom-right corner
//       x: 20,                         // 20px from right edge
//       y: 20,                         // 20px from bottom edge
//       opacity: 50,                   // 50% opacity
//       flags: "relative",             // interpret width/opac/position relative to image size
//     },
//     // Option B: OR use text as watermark instead:
//     // {
//     //   overlay: {
//     //     font_family: "Arial",
//     //     font_size: 24,
//     //     text: "Haitian Art Store",
//     //   },
//     //   color: "#FFFFFF",
//     //   gravity: "south_east",
//     //   x: 20,
//     //   y: 20,
//     //   opacity: 40,
//     //   flags: "relative",
//     // }
//   ],
// });

    // 5) Thumbnails upload
    const thumbFiles = formData.getAll("thumbnails").filter((v): v is File => v instanceof File);
    const thumbRes = await Promise.all(
      thumbFiles.map((file, i) =>
        fileToDataUri(file).then((uri) =>
          cloudinary.uploader.upload(uri, {
            folder:        `products/${categoryName}/${productId}/thumbnails`,
            public_id:     `thumb_${i+1}`,
            resource_type: "image",
          })
        )
      )
    );

    // 6) Format files upload
    const formatFiles = formData.getAll("formats").filter((v): v is File => v instanceof File);
    const formatRes = await Promise.all(
      formatFiles.map((file) => {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        return fileToDataUri(file).then((uri) =>
          cloudinary.uploader.upload(uri, {
            folder:        `products/${categoryName}/${productId}/formats`,
            public_id:     baseName,
            resource_type: "auto",
          }).then((r) => ({ ...r, formatName: baseName }))
        );
      })
    );

    // 7) Update the Product record
    const updated = await db.product.update({
      where: { id: productId },
      data: {
        publicId:   mainRes.public_id,
        thumbnails: [mainRes.secure_url, ...thumbRes.map((r) => r.secure_url)],
        formats:    formatRes.map((r) => r.secure_url),
      },
    });

    // 8) Create one ProductVariant per uploaded format
    // await db.productVariant.createMany({
    //   data: formatRes.map((r) => ({
    //     productId,
    //     type:      "DIGITAL",
    //     format:    r.formatName,   // e.g. "jpg", "png" (from file name)
    //     size:      null,
    //     material:  null,
    //     frame:     null,
    //   })),
    // });

    return NextResponse.json(updated, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/products/upload error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



// // src/app/api/products/upload/route.ts
// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import { v2 as cloudinary } from "cloudinary";

// export const runtime = "nodejs";
// export const config = { api: { bodyParser: false } };

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
//   api_key: process.env.CLOUDINARY_API_KEY!,
//   api_secret: process.env.CLOUDINARY_API_SECRET!,
// });

// const db = new PrismaClient();

// async function fileToDataUri(file: File) {
//   const buf = Buffer.from(await file.arrayBuffer());
//   return `data:${file.type};base64,${buf.toString("base64")}`;
// }

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData();

//     // 1) Parse & validate
//     const categoryName = formData.get("category")?.toString().trim();
//     if (!categoryName)
//       return NextResponse.json(
//         { error: "Missing 'category'" },
//         { status: 400 }
//       );
//     const title = formData.get("title")?.toString().trim() || "";
//     const description = formData.get("description")?.toString().trim() || "";
//     const price = parseFloat(formData.get("price")?.toString() || "0");

//     // 2) Upsert Category
//     const category = await db.category.upsert({
//       where: { name: categoryName },
//       create: { name: categoryName },
//       update: {},
//     });

//     // 3) Create placeholder Product
//     const placeholder = await db.product.create({
//       data: {
//         title,
//         description,
//         price,
//         publicId: "",
//         thumbnails: [],
//         formats: [],
//         category: { connect: { id: category.id } },
//       },
//     });
//     const productId = placeholder.id;

//     // 4) Upload main image
//     const mainFile = formData.get("main");
//     if (!(mainFile instanceof File))
//       return NextResponse.json(
//         { error: "Missing 'main' file" },
//         { status: 400 }
//       );
//     const mainUri = await fileToDataUri(mainFile);
//     const mainRes = await cloudinary.uploader.upload(mainUri, {
//       folder: `products/${categoryName}/${productId}/main`,
//       public_id: "original",
//       resource_type: "image",
//     });

//     // 5) Upload thumbnails
//     const thumbFiles = formData
//       .getAll("thumbnails")
//       .filter((v): v is File => v instanceof File);
//     const thumbRes = await Promise.all(
//       thumbFiles.map((file, i) =>
//         fileToDataUri(file).then((uri) =>
//           cloudinary.uploader.upload(uri, {
//             folder: `products/${categoryName}/${productId}/thumbnails`,
//             public_id: `thumb_${i + 1}`,
//             resource_type: "image",
//           })
//         )
//       )
//     );

//     // 6) Upload formats
//     const formatFiles = formData
//       .getAll("formats")
//       .filter((v): v is File => v instanceof File);
//     const formatRes = await Promise.all(
//       formatFiles.map((file) => {
//         const name = file.name.replace(/\.[^/.]+$/, "");
//         return fileToDataUri(file).then((uri) =>
//           cloudinary.uploader.upload(uri, {
//             folder: `products/${categoryName}/${productId}/formats`,
//             public_id: name,
//             resource_type: "auto",
//           })
//         );
//       })
//     );

//     // 7) Update Product with secure URLs
//     const updated = await db.product.update({
//       where: { id: productId },
//       data: {
//         publicId: mainRes.public_id,
//         thumbnails: [mainRes.secure_url, ...thumbRes.map((r) => r.secure_url)],
//         formats: formatRes.map((r) => r.secure_url),
//       },
//     });

//     return NextResponse.json(updated, { status: 201 });
//   } catch (err: unknown) {
//     console.error("POST /api/products/upload error:", err);
//     // Narrow to Error to safely read .message
//     const message =
//       err instanceof Error ? err.message : "An unexpected error occurred";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
