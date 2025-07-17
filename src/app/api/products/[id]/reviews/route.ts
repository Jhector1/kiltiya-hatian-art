// File: src/app/api/products/[id]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }        from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient }            from "@prisma/client";
import { ProductReview }           from "@/types";

const prisma = new PrismaClient();

// ─── Helper: require a valid session and return userId ────────────────
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

// ─── GET /api/products/[id]/reviews ───────────────────────────────────
// Public: fetch reviews for a given product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const reviews: ProductReview[] = await prisma.review.findMany({
    where: { productId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reviews);
}

// ─── POST /api/products/[id]/reviews ──────────────────────────────────
// Authenticated: add a review for the signed-in user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId    = await requireUser();
  const productId = params.id;
  const { rating, text } = await req.json();

  if (typeof rating !== "number" || !text) {
    return NextResponse.json(
      { error: "Missing rating or comment text" },
      { status: 400 }
    );
  }

  const newReview = await prisma.review.create({
    data: {
      productId,
      userId,
      rating,
      comment: text,
    },
    include: { user: true },
  });

  return NextResponse.json({
    id:     newReview.id,
    userId: newReview.userId,
    user:   newReview.user.name ?? newReview.user.email,
    rating: newReview.rating,
    text:   newReview.comment ?? "",
    date:   newReview.createdAt.toISOString().split("T")[0],
  });
}

// ─── DELETE /api/products/[id]/reviews ────────────────────────────────
// Authenticated: delete the signed-in user’s own review
export async function DELETE(
  req: NextRequest
) {
  const userId = await requireUser();
  const { reviewId } = await req.json();

  if (!reviewId) {
    return NextResponse.json(
      { error: "Missing reviewId" },
      { status: 400 }
    );
  }

  // Ensure review belongs to this user
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review || review.userId !== userId) {
    return NextResponse.json(
      { error: "Unauthorized or review not found" },
      { status: 403 }
    );
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ success: true });
}
