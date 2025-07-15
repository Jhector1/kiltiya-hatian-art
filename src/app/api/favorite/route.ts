import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all favorites for the user// src/app/api/favorite/route.ts
// import { NextResponse, NextRequest } from "next/server";
import {  productListSelect, ProductListItem } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { product: { select: productListSelect } },
  });

  // unwrap and return exactly the ProductListItem[] shape
  const products: ProductListItem[] = favorites.map((f) => f.product);
  return NextResponse.json(products);
}

// POST → Add to favorites
export async function POST(request: NextRequest) {
  const { userId, productId } = await request.json();

  if (!userId || !productId) {
    return NextResponse.json(
      { error: "Missing userId or productId" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already favorited" },
        { status: 200 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: { userId, productId },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE → Remove from favorites
export async function DELETE(request: NextRequest) {
  const { userId, productId } = await request.json();

  if (!userId || !productId) {
    return NextResponse.json(
      { error: "Missing userId or productId" },
      { status: 400 }
    );
  }

  try {
    await prisma.favorite.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return NextResponse.json(
      { message: "Removed from favorites" },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
