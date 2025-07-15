// File: src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma, productListSelect, ProductListItem } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const products: ProductListItem[] = await prisma.product.findMany({
    select: productListSelect,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}
