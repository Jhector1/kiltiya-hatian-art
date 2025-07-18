// File: src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe }                  from "@/lib/stripe";
import { getServerSession }        from "next-auth/next";
import type { OrderList }          from "@/types";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // ─── 0️⃣ Authenticate ──────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }
  const customerId = session.user.id;

  try {
    // ─── 1️⃣ Parse & validate body ───────────────────────────────
    const body = (await req.json()) as OrderList;
    if (!Array.isArray(body.cartProductList)) {
      return NextResponse.json(
        { error: "Malformed request: cartProductList missing or invalid" },
        { status: 400 }
      );
    }

    // ─── 2️⃣ Build Stripe line items ─────────────────────────────
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      await Promise.all(
        body.cartProductList.map(async (item) => {
          const p = item.myProduct;
          const metadata: Stripe.MetadataParam = { 
            productId: p.id,
            customerId,                  // use session-derived user ID
          };
          if (p.digital) {
            metadata.digitalVariantId = p.digital.id;
            metadata.digitalFormat    = p.digital.format;
          }
          if (p.print) {
            metadata.printVariantId   = p.print.id;
            metadata.printFormat      = p.print.format;
            if (p.print.size)     metadata.printSize     = p.print.size;
            if (p.print.material) metadata.printMaterial = p.print.material;
            if (p.print.frame)    metadata.printFrame    = p.print.frame;
          }

          // Create Stripe Product
          const stripeProduct = await stripe.products.create({
            name:     p.title,
            images:   [p.imageUrl],
            metadata,
          });

          // Create Stripe Price
          const price = await stripe.prices.create({
            unit_amount: Math.round(Number(p.price) * 100),
            currency:    "usd",
            product:     stripeProduct.id,
          });

          return {
            price:    price.id,
            quantity: item.quantity,
          };
        })
      );

    // ─── 3️⃣ Create the Stripe session ────────────────────────────
    const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL!;
    const sessionObj = await stripe.checkout.sessions.create({
      payment_method_types:      ["card"],
      mode:                      "payment",
      success_url:               `${CLIENT_URL}/cart/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:                `${CLIENT_URL}/cart`,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "FR"] },
      consent_collection:          { terms_of_service: "required" },
      automatic_tax:               { enabled: true },
      line_items,
      metadata: { customerId }, // again, your userId
    });

    return NextResponse.json({ sessionId: sessionObj.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[CHECKOUT_ERROR]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
