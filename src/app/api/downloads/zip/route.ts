import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import archiver from "archiver";
import stream from "stream";

const prisma = new PrismaClient();
export const runtime = "nodejs";

// TEMP AUTH: Replace with real auth logic


import { stripe } from "@/lib/stripe"; // Make sure this is already imported

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.metadata?.customerId;
    return customerId || null;
  } catch (err) {
    console.error("❌ Failed to retrieve Stripe session:", err);
    return null;
  }
}



// Fetch all purchased digital product files for the user
async function getUserDigitalDownloads(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        where: { type: "DIGITAL" },
        include: {
          product: true,
        },
      },
    },
  });

  const downloads: { url: string; name: string }[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      const product = item.product;
      if (!product) continue;

      for (const formatUrl of product.formats) {
        const extension = formatUrl.split(".").pop() || "jpg";
        const titleSanitized = product.title.replace(/\s+/g, "_").toLowerCase();
        downloads.push({
          url: formatUrl,
          name: `${titleSanitized}_${extension}.${extension}`,
        });
      }
    }
  }

  return downloads;
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const files = await getUserDigitalDownloads(userId);

  if (!files.length) {
    return NextResponse.json({ error: "No digital downloads found." }, { status: 404 });
  }

  try {
    const archive = archiver("zip");
    const zipStream = new stream.PassThrough();

    archive.pipe(zipStream);

    for (const file of files) {
      try {
        const res = await fetch(file.url);
        if (!res.ok || !res.body) continue;
        archive.append(res.body, { name: file.name });
      } catch (err) {
        console.error(`❌ Failed to fetch ${file.url}:`, err);
      }
    }

    archive.finalize();

    return new Response(zipStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=downloads.zip",
      },
    });
  } catch (err) {
    console.error("❌ Failed to create ZIP archive:", err);
    return NextResponse.json({ error: "Failed to create download package." }, { status: 500 });
  }
}
