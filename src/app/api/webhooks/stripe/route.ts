// File: src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe }                  from "@/lib/stripe";
import { PrismaClient, VariantType } from "@prisma/client";
import Stripe                      from "stripe";

export const runtime = "nodejs";

// You can also hoist this to a global to reuse across invocations
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // 1️⃣ Verify Stripe signature
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
    console.error("❌ Webhook signature verification failed:", signature, (err as Error).message);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // 2️⃣ Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = session.metadata?.customerId;
  if (!customerId) {
    console.error("🚨 Missing customerId in session.metadata");
    return new NextResponse("Missing customerId", { status: 400 });
  }
  console.log("✅ Stripe Checkout Completed for customerId:", customerId);

  // 3️⃣ Process the order in your database
  try {
    const user = await prisma.user.findUnique({ where: { id: customerId } });
    if (!user) throw new Error(`User not found: ${customerId}`);

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            digitalVariant: true,
            printVariant:   true,
          },
        },
      },
    });
    if (!cart) throw new Error(`Cart not found for user: ${user.id}`);

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId:          user.id,
        total:           (session.amount_total ?? 0) / 100,
        status:          "COMPLETED",
        stripeSessionId: session.id,
      },
    });

    // Move each cart item → order item
    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId:          order.id,
          productId:        item.productId,
          type:             item.digitalVariant ? VariantType.DIGITAL : VariantType.PRINT,
          price:            item.price,
          quantity:         item.quantity,
          digitalVariantId: item.digitalVariantId,
          printVariantId:   item.printVariantId,
        },
      });
    }

    // Clear out the user’s cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    console.log("✅ Order created and cart cleared for user:", user.id);

  } catch (err) {
    console.error("❌ Webhook processing error:", (err as Error).message);
    return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }

  // 4️⃣ Acknowledge receipt to Stripe
  return NextResponse.json({ received: true }, { status: 200 });
}
