import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const db = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1];
  const userId = url.searchParams.get("userId");

  const product = await db.product.findUnique({
    where: { id },
    include: {
      reviews: true,
      variants: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let cartVariantIds: string[] = [];

  if (userId) {
    const cart = await db.cart.findFirst({
      where: { userId },
      include: {
        items: {
          where: { productId: id },
          include: {
            digitalVariant: true,
            printVariant: true,
          },
        },
      },
    });

    if (cart) {
      cartVariantIds = cart.items.flatMap((item) => {
        const ids: string[] = [];
        if (item.digitalVariant?.productId === id) {
          ids.push(item.digitalVariant.id);
        }
        if (item.printVariant?.productId === id) {
          ids.push(item.printVariant.id);
        }
        return ids;
      });
    }
  }

  const result = {
    id: product.id,
    category: product.categoryId,
    title: product.title,
    description: product.description,
    price: product.price,
    imageUrl: product.thumbnails[0] || "/placeholder.png",
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
