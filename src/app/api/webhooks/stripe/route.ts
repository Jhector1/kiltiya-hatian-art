// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { isSessionCompleted } from "@/helpers/stripe/webhook/utils";
import { isQuotaTopup, handleQuotaTopup } from "@/helpers/stripe/webhook/quota";
import { handleOrderFulfillment } from "@/helpers/stripe/webhook/orders";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.NEXT_STRIPE_WEBHOOK_SECRET!;
  const raw = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(raw), signature!, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (!isSessionCompleted(event)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    if (isQuotaTopup(session)) {
      await handleQuotaTopup(session);
      return NextResponse.json({ received: true });
    }

    await handleOrderFulfillment(session);
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("❌ Webhook processing error:", e?.message || e);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
