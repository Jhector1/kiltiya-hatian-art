// File: src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth/next";
import { PrismaClient, VariantType } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

/** Ensure the request is authenticated and return the user’s ID, or throw a 401 response */
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401 }
    );
  }
  return session.user.id;
}

export async function GET(req: NextRequest) {
  // 1) Authenticate
  const userId = await requireUser();

  // 2) Parse & validate query params
  const url  = new URL(req.url);
  const typeParam = (url.searchParams.get("type") ?? "ALL") as VariantType;

  // 3) Build filter for variant type
  const filter =
    typeParam === VariantType.DIGITAL || typeParam === VariantType.PRINT
      ? { type: typeParam }
      : {};

  // 4) Fetch the user's order items
  const items = await prisma.orderItem.findMany({
    where: { order: { userId }, ...filter },
    include: {
      order:          { select: { placedAt: true, stripeSessionId: true } },
      product:        { select: { title: true, thumbnails: true } },
      digitalVariant: true,
      printVariant:   true,
    },
    orderBy: { order: { placedAt: "desc" } },
  });

  // 5) Group by order date (YYYY-MM-DD)
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const date = item.order.placedAt.toISOString().slice(0, 10);
    ;(grouped[date] ??= []).push(item);
  }

  // 6) Return grouped orders
  return NextResponse.json(grouped);
}
