// File: src/app/api/favorite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }        from "next-auth/next";
import { PrismaClient }            from "@prisma/client";
import { productListSelect, ProductListItem } from "@/types";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
const prisma = new PrismaClient();

/** Helper: ensure the user is signed in and return their ID or throw a 401 */
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

// ─── GET /api/favorite ────────────────────────────────────────────────
// Returns the list of products the signed-in user has favorited
export async function GET() {
  const userId = await requireUser();

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { product: { select: productListSelect } },
  });

  const products: ProductListItem[] = favorites.map(f => f.product);
   const payload = products.map(p => ({
    ...p,
    purchaseCount: 0,
  }));
  return NextResponse.json(payload);
}

// ─── POST /api/favorite ───────────────────────────────────────────────
// Body: { productId: string }
export async function POST(req: NextRequest) {
  const userId    = await requireUser();
  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json(
      { error: "Missing productId" },
      { status: 400 }
    );
  }

  const exists = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (exists) {
    return NextResponse.json(
      { message: "Already favorited" },
      { status: 200 }
    );
  }

  const favorite = await prisma.favorite.create({
    data: { userId, productId },
  });
  return NextResponse.json(favorite, { status: 201 });
}

// ─── DELETE /api/favorite ────────────────────────────────────────────
// Body: { productId: string }
export async function DELETE(req: NextRequest) {
  const userId    = await requireUser();
  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json(
      { error: "Missing productId" },
      { status: 400 }
    );
  }

  await prisma.favorite.delete({
    where: { userId_productId: { userId, productId } },
  });
  return NextResponse.json(
    { message: "Removed from favorites" },
    { status: 200 }
  );
}
