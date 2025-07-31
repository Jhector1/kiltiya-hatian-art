// File: src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {  getCustomerIdFromRequest } from "@/utils/guest";


export const runtime = "nodejs";
const db = new PrismaClient();

export async function GET(req: NextRequest) {
  // 1️⃣ Extract product ID from the URL
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const productId = segments[segments.length - 1];

  // 2️⃣ Fetch the product
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      reviews: true,
      variants: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3️⃣ Check if the variant is in the user's or guest's cart
  let cartVariantIds: string[] = [];
  const { userId, guestId } = await getCustomerIdFromRequest(req);

  const cart = await db.cart.findFirst({
    where: {
      OR: [
        { userId: userId ?? undefined },
        { guestId: guestId ?? undefined },
      ],
    },
    include: {
      items: {
        where: { productId },
        include: { digitalVariant: true, printVariant: true },
      },
    },
  });

  if (cart) {
    cartVariantIds = cart.items.flatMap((item) => {
      const ids: string[] = [];
      if (item.digitalVariant) ids.push(item.digitalVariant.id);
      if (item.printVariant) ids.push(item.printVariant.id);
      return ids;
    });
  }

  // 4️⃣ Build and return the result
  const result = {
    id: product.id,
    category: product.categoryId,
    title: product.title,
    description: product.description,
    price: product.price,
    imageUrl: product.thumbnails[0] ?? "/placeholder.png",
    thumbnails: product.thumbnails,
    formats: product.formats,
    variants: product.variants.map((v) => ({
      ...v,
      inUserCart: cartVariantIds.includes(v.id),
    })),
    reviews: product.reviews,
  };

  return NextResponse.json(result);
}
