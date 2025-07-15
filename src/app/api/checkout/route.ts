// src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { OrderList } from "@/types";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Parse & validate body
    const body = (await req.json()) as OrderList;
    console.log("[checkout] received body:", JSON.stringify(body, null, 2));

    if (!Array.isArray(body.cartProductList)) {
      console.error("[checkout] cartProductList is not an array");
      return NextResponse.json(
        { error: "Malformed request: cartProductList missing or invalid" },
        { status: 400 }
      );
    }
    if (typeof body.customerId !== "string") {
      console.error("[checkout] customerId missing or invalid");
      return NextResponse.json(
        { error: "Malformed request: customerId missing or invalid" },
        { status: 400 }
      );
    }

    // 2️⃣ Build Stripe line items with per-item error logging
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      await Promise.all(
        body.cartProductList.map(async (item, idx) => {
          try {
            const p = item.myProduct;
            const metadata: Stripe.MetadataParam = {
              productId: p.id,
              customerId: body.customerId,
            };
            if (p.digital) {
              metadata.digitalVariantId = p.digital.id;
              metadata.digitalFormat = p.digital.format;
            }
            if (p.print) {
              metadata.printVariantId = p.print.id;
              metadata.printFormat = p.print.format;
              if (p.print.size) metadata.printSize = p.print.size;
              if (p.print.material) metadata.printMaterial = p.print.material;
              if (p.print.frame) metadata.printFrame = p.print.frame;
            }

            // Create a Stripe Product
            const stripeProduct = await stripe.products.create({
              name: p.title,
              images: [p.imageUrl],
              metadata,
            });

            // Create a Price for that product
            const price = await stripe.prices.create({
              unit_amount: Math.round(Number(p.price) * 100),
              currency: "usd",
              product: stripeProduct.id,
            });

            return {
              price: price.id,
              quantity: item.quantity,
            };
          } catch (itemErr) {
            console.error(`[checkout] failed on item index ${idx}`, itemErr);
            throw itemErr;
          }
        })
      );

    // 3️⃣ Log environment / config sanity checks
    const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL;
    console.log("[checkout] CLIENT_URL:", CLIENT_URL);

    // 4️⃣ Create the Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${CLIENT_URL}/cart/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cart`,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "FR"] },
      consent_collection: { terms_of_service: "required" },
      automatic_tax: { enabled: true },
      line_items,
      metadata: { customerId: body.customerId },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[CHECKOUT_ERROR]", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
