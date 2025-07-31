// File: src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, VariantType } from "@prisma/client";
import { getCustomerIdFromRequest } from "@/utils/guest";
// import { getCustomerId } from "@/utils/guest";

const prisma = new PrismaClient();

/** Ensure the request is authenticated and return the user’s ID, or throw a 401 response */
export async function GET(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);

  const url = new URL(req.url);
  const typeParam = (url.searchParams.get("type") ?? "ALL") as VariantType;

  const filter =
    typeParam === VariantType.DIGITAL || typeParam === VariantType.PRINT
      ? { type: typeParam }
      : {};

  const items = await prisma.orderItem.findMany({
    where: {
      ...filter,
      order: {
        ...(userId ? { userId } : {}),
        ...(guestId ? { guestId } : {}),
      },
    },
    include: {
      order:          { select: { placedAt: true, stripeSessionId: true } },
      product:        { select: { title: true, thumbnails: true } },
      digitalVariant: true,
      printVariant:   true,
    },
    orderBy: { order: { placedAt: "desc" } },
  });

  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const date = item.order.placedAt.toISOString().slice(0, 10);
    (grouped[date] ??= []).push(item);
  }

  return NextResponse.json(grouped);
}
