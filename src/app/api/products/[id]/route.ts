// File: src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }        from "next-auth/next";
import { PrismaClient }            from "@prisma/client";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
const db = new PrismaClient();

/** Try to get a signed-in user’s ID, or return null if unauthenticated */
async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  // 1️⃣ Extract product ID from the pathname
  const url      = new URL(req.url);
  const segments = url.pathname.split("/");
  const productId = segments[segments.length - 1];

  // 2️⃣ Fetch the product
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      reviews:  true,
      variants: true,
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3️⃣ Determine which variants the signed-in user has in their cart
  let cartVariantIds: string[] = [];
  const userId = await getUserId();
  if (userId) {
    const cart = await db.cart.findFirst({
      where: { userId },
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
        if (item.printVariant)   ids.push(item.printVariant.id);
        return ids;
      });
    }
  }

  // 4️⃣ Build the response
  const result = {
    id:          product.id,
    category:    product.categoryId,
    title:       product.title,
    description: product.description,
    price:       product.price,
    imageUrl:    product.thumbnails[0] ?? "/placeholder.png",
    thumbnails:  product.thumbnails,
    formats:     product.formats,
    variants:    product.variants.map((v) => ({
      ...v,
      inUserCart: cartVariantIds.includes(v.id),
    })),
    reviews:     product.reviews,
  };

  return NextResponse.json(result);
}
