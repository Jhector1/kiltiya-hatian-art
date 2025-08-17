// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCustomerIdFromRequest } from "@/utils/guest";

export const runtime = "nodejs";
const db = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productId = url.pathname.split("/").pop()!;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true } }, // 👈 join category
      reviews: true,
      variants: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // cart lookup unchanged...
  let cartVariantIds: string[] = [];
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const cart = await db.cart.findFirst({
    where: {
      OR: [{ userId: userId ?? undefined }, { guestId: guestId ?? undefined }],
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

  const result = {
    id: product.id,
    category: product.category?.name ?? null, // 👈 name instead of id
    // If you want to keep the old field temporarily: categoryId: product.categoryId,
    title: product.title,
    description: product.description,
    price: product.price,
    imageUrl: product.thumbnails[0] ?? "/placeholder.png",
    thumbnails: product.thumbnails,
    formats: product.formats,
    svgPreview: product.svgPreview,
    variants: product.variants.map((v) => ({
      ...v,
      inUserCart: cartVariantIds.includes(v.id),
    })),
    reviews: product.reviews,
    salePercent: product.salePercent,
    salePrice: product.salePrice,
    saleStartsAt: product.saleStartsAt,
    saleEndsAt: product.saleEndsAt,
    sizes: product.sizes,
  };
  // console.log(99999999,result)

  return NextResponse.json(result);
}
