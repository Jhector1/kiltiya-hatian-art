// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const db = new PrismaClient();

export async function GET() {
  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const withUrls = products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category.name,
    image: p.thumbnails[0] || "/placeholder.png",
    rawPublicId: p.publicId,
  }));

  return NextResponse.json(withUrls);
}
