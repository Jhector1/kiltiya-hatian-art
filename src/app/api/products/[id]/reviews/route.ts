import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ProductReview } from "@/types";

const prisma = new PrismaClient();
export async function GET(
  req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  // ✅ Await the promise, then pull out `id`
  const { id: productId } = await params;

  // this returns RawReview[]
  const reviews: ProductReview[] = await prisma.review.findMany({
    where: { productId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id; // ← Use `id` instead of `productId`

  const body = await req.json();
  const { userId, rating, text } = body;

  if (!productId || !userId || typeof rating !== "number" || !text) {
    return NextResponse.json(
      { error: "Missing required fields" },
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
    include: {
      user: true,
    },
  });

  return NextResponse.json({
    id: newReview.id,
    userId: newReview.userId,
    user: newReview.user.name ?? newReview.user.email,
    rating: newReview.rating,
    text: newReview.comment ?? "",
    date: newReview.createdAt.toISOString().split("T")[0],
  });
}

export async function DELETE(
  req: NextRequest
  //   { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { reviewId, userId } = body;

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: "Missing reviewId or userId" },
        { status: 400 }
      );
    }

    // First ensure the review exists and belongs to the user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized or review not found" },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /reviews error:", err);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
