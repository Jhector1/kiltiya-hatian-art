import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.metadata?.customerId;

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer metadata' }, { status: 400 });
    }

    // Get the most recent order by user
    const order = await prisma.order.findFirst({
      where: { userId: customerId },
      orderBy: { placedAt: 'desc' },
      include: {
        items: {
          where: { type: 'DIGITAL' },
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ digitalDownloads: [] }, { status: 200 });
    }

const digitalDownloads = order.items.flatMap((item) => {
  const product = item.product;
  if (!product || !product.formats) return [];

  return product.formats.map((url) => {
    const extension = url.split(".").pop() || "jpg";
    // const filename = product.title.replace(/\s+/g, "_").toLowerCase();

    return {
      id: `${item.id}-${extension}`,
      title: product.title,
      format: extension,
      downloadUrl: url,
    };
  });
});


    return NextResponse.json({ digitalDownloads });
} catch (error: unknown) {
  // start with a default
  let message = "Unexpected error";

  // narrow to Error and read .message safely
  if (error instanceof Error) {
    message = error.message;
  }
    console.error('❌ Failed to fetch checkout success data:', message);
    return NextResponse.json({ error: 'Failed to fetch purchased digital items.' }, { status: 500 });
  }
}
