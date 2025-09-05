// File: src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, productListSelect } from "@/types";
import { getCustomerIdFromRequest } from "@/utils/guest"; // ✅ your helper

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // 1. get current user or guest ID
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const orConditions: any[] = [];
if (userId) orConditions.push({ userId });
if (guestId) orConditions.push({ guestId });


  // 2. fetch products and also pull in designs for this user/guest
  const products = await prisma.product.findMany({
    select: {
      ...productListSelect,
      _count: { select: { orderItems: true } },
      designs: {
        select: {
          previewUrl: true,
          userId: true,
          guestId: true,
        },
        where: {
          OR: orConditions,

        },
        take: 1, // at most one design per user+product
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. map + replace thumbnail if design exists
  const payload = products.map((p) => {
    let isUserDesignApplied = false;
    const thumbnails = [...p.thumbnails];

    if (p.designs.length > 0 && p.designs[0].previewUrl) {
      isUserDesignApplied = true;
      // replace first thumbnail
      thumbnails[0] = p.designs[0].previewUrl!;
    }

    return {
      ...p,
      thumbnails,
      purchaseCount: p._count.orderItems,
      isUserDesignApplied,
    };
  });

  return NextResponse.json(payload);
}
