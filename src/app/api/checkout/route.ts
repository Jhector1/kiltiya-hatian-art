// File: src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { OrderList, OrderProductItem } from "@/types";
import { getCustomerIdFromRequest } from "@/utils/guest";

export async function POST(req: NextRequest) {
  try {
    // ─── 0️⃣ Authenticate or get guest ID ──────
    const { userId, guestId } = await getCustomerIdFromRequest(req);

    // ─── 1️⃣ Parse & validate body ─────────────
    const body = (await req.json()) as OrderList;
    if (!Array.isArray(body.cartProductList)) {
      return NextResponse.json(
        { error: "Malformed request: cartProductList missing or invalid" },
        { status: 400 }
      );
    }

    // Gather the purchased cart item IDs for a session-level fallback
    const purchasedCartItemIds = body.cartProductList
      .map((item: OrderProductItem) => String(item.cartItemId).trim())
      .filter(Boolean);

    // ─── 2️⃣ Build Stripe line items ───────────
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      await Promise.all(
        body.cartProductList.map(async (item: OrderProductItem) => {
          const p = item.myProduct;
          

          // Ensure we have a per-item cartItemId (used by webhook to delete only purchased cart rows)
          const cartItemId = String(item.cartItemId);


          // NOTE: Stripe metadata values must be strings
          const baseMeta: Stripe.MetadataParam = {
            productId: p.id,
            ...(userId && { userId }),
            ...(guestId && { guestId }),
            ...(cartItemId && { cartItemId }),           // ← NEW: key piece
            variantType: p.digital ? "DIGITAL" : "PRINT" // helpful in webhook
          };

          const digitalMeta: Stripe.MetadataParam = p.digital
            ? {
                digitalVariantId: p.digital.id,
                digitalFormat: p.digital.format ?? ""
              }
            : {};

          const printMeta: Stripe.MetadataParam = p.print
            ? {
                printVariantId: p.print.id,
                printFormat: p.print.format ?? "",
                ...(p.print.size && { printSize: String(p.print.size) }),
                ...(p.print.material && { printMaterial: String(p.print.material) }),
                ...(p.print.frame && { printFrame: String(p.print.frame) })
              }
            : {};

          // Create a lightweight product & price carrying metadata
          const stripeProduct = await stripe.products.create({
            name: p.title,
            images: [p.imageUrl],
            metadata: {
              ...baseMeta,
              ...digitalMeta,
              ...printMeta
            },
          });

          const price = await stripe.prices.create({
            unit_amount: Math.round(Number(p.price) * 100),
            currency: "usd",
            product: stripeProduct.id,
            metadata: {
              ...baseMeta,     // ← NEW: duplicate on price for easier access from line items
              ...digitalMeta,
              ...printMeta
            },
          });

          return {
            price: price.id,
            quantity: item.quantity,
          };
        })
      );

    // ─── 3️⃣ Create Stripe Checkout Session ─────
    const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL!;
    const sessionObj = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${CLIENT_URL}/cart/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cart`,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "FR"] },
      consent_collection: { terms_of_service: "required" },
      automatic_tax: { enabled: true },
      line_items,
      metadata: {
        ...(userId && { userId }),
        ...(guestId && { guestId }),
        ...(purchasedCartItemIds.length && {
          cartItemIds: purchasedCartItemIds.join(",") // ← NEW: CSV fallback
        }),
      },
    });

    return NextResponse.json({ sessionId: sessionObj.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[CHECKOUT_ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
