import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient, VariantType } from "@prisma/client";
import Stripe from "stripe";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.NEXT_STRIPE_WEBHOOK_SECRET!;
  const bodyBuffer = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(bodyBuffer),
      signature!,
      webhookSecret
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", (err as Error).message);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
const userId = session.metadata?.userId ?? null;
const guestId = session.metadata?.guestId ?? null;
const customerId = userId ?? guestId;

if (!customerId) {
  console.error("🚨 Missing both userId and guestId in session.metadata");
  return new NextResponse("Missing customer identity", { status: 400 });
}

  try {
    // 1️⃣ Try to find a user by customerId
    const user = await prisma.user.findUnique({ where: { id: customerId } });

    // 2️⃣ Try to find a guest cart if no user found
    let cart = null;
    if (user) {
      cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              digitalVariant: true,
              printVariant: true,
            },
          },
        },
      });
    } else {
      cart = await prisma.cart.findUnique({
        where: { guestId: customerId },
        include: {
          items: {
            include: {
              digitalVariant: true,
              printVariant: true,
            },
          },
        },
      });
    }

    if (!cart) throw new Error(`Cart not found for ID: ${customerId}`);

    // 3️⃣ Create the order with either userId or guestId
    const order = await prisma.order.create({
      data: {
        userId: user?.id ?? undefined,
        guestId: user ? undefined : customerId,
        total: (session.amount_total ?? 0) / 100,
        status: "COMPLETED",
        stripeSessionId: session.id,
      },
    });

    // 4️⃣ Move cart items to order items
    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          type: item.digitalVariant ? VariantType.DIGITAL : VariantType.PRINT,
          price: item.price,
          quantity: item.quantity,
          digitalVariantId: item.digitalVariantId,
          printVariantId: item.printVariantId,
        },
      });
    }

    // 5️⃣ Clear the cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  } catch (err) {
    console.error("❌ Webhook processing error:", (err as Error).message);
    return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
