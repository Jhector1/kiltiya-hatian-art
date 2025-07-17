// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma, productListSelect } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  // 1. pull in your normal product fields…
  // 2. …and ask Prisma to count related orderItems
  const products = await prisma.product.findMany({
    select: {
      ...productListSelect,
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // rename for frontend convenience
  const payload = products.map(p => ({
    ...p,
    purchaseCount: p._count.orderItems,
  }));
console.log(payload)
  return NextResponse.json(payload);
}
