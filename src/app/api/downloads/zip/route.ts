// src/app/api/downloads/zip/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();
export const runtime = "nodejs";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:     process.env.CLOUDINARY_API_KEY!,
  api_secret:  process.env.CLOUDINARY_API_SECRET!,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // ————————————————
  // 1️⃣  Fetch the one Order by its stripeSessionId
  // ————————————————
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      items: {
        where: { type: "DIGITAL" },
        include: { product: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "No order found for that session." },
      { status: 404 }
    );
  }

  // ————————————————
  // 2️⃣  Build a list of { url, name } from that single order
  // ————————————————
  const files = order.items.flatMap((item) => {
    const safeTitle = item.product?.title.replace(/\W+/g, "_");
    return item.product?.formats.map((fmt) => {
      const ext = fmt.split(".").pop()!;
      return { url: fmt, name: `${safeTitle}.${ext}` };
    });
  });

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No digital items in this order." },
      { status: 404 }
    );
  }

  // ————————————————
  // 3️⃣  Extract, decode, and dedupe the Cloudinary public IDs
  // ————————————————
  const publicIds = Array.from(
    new Set(
      files
        .map((f) => {
          const m = f?.url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/]+$/i);
          return m ? decodeURIComponent(m[1]) : null;
        })
        .filter((id): id is string => Boolean(id))
    )
  );

  if (publicIds.length === 0) {
    return NextResponse.json(
      { error: "Could not determine Cloudinary public IDs." },
      { status: 500 }
    );
  }

  // ————————————————
  // 4️⃣  Generate the signed ZIP URL & redirect (307)
  // ————————————————
  try {
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids:            publicIds,
      resource_type:         "image",
      use_original_filename: true,
    });
    return NextResponse.redirect(zipUrl);
  } catch (err) {
    console.error("Cloudinary ZIP error:", err);
    return NextResponse.json(
      { error: "Failed to generate download URL." },
      { status: 500 }
    );
  }
}



