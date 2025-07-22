// ✅ Step 2: Create `sitemap.xml` handler in App Router
// File: src/app/sitemap.xml/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Update the path to your Prisma client

export const runtime = "edge"; // Optional for better performance
export async function GET() {
  try {
    const baseUrl = "https://ziledigital.com";

    const products = await prisma.product.findMany({
      select: {
        id: true,
        createdAt: true,
      },
    });

    const staticPages = ["", "/about", "/contact", "/store"];

    const staticUrls = staticPages.map(
      (path) => `
      <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>1.0</priority>
      </url>`
    );

    const productUrls = products.map(
      (product) => `
      <url>
        <loc>${baseUrl}/store/${product.id}</loc>
        <lastmod>${product.createdAt.toISOString()}</lastmod>
        <priority>0.9</priority>
      </url>`
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${[...staticUrls, ...productUrls].join("\n")}  
    </urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("❌ Sitemap generation failed:", error);
    return new NextResponse("Sitemap error", { status: 500 });
  }
}
