// File: src/app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { OrderList, OrderProductItem } from "@/types";
import { getCustomerIdFromRequest } from "@/utils/guest";

// helper: latest design (if any) for this user/guest+product
async function findDesign(productId: string, userId: string | null, guestId: string | null) {
  if (!userId && !guestId) return null;
  return prisma.userDesign.findFirst({
    where: userId ? { userId, productId } : { guestId: guestId!, productId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, previewUrl: true, previewPublicId: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, guestId } = await getCustomerIdFromRequest(req);

    const body = (await req.json()) as OrderList;
    if (!Array.isArray(body.cartProductList)) {
      return NextResponse.json({ error: "cartProductList missing/invalid" }, { status: 400 });
    }

    // build line items once, and detect if any line is customized
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const purchasedCartItemIds: string[] = [];
    let requiresShipping = false;
    let hasAnyDesign = false;

    for (const item of body.cartProductList) {
      const p = item.myProduct;
      const cartItemId = String(item.cartItemId ?? "");
      if (cartItemId) purchasedCartItemIds.push(cartItemId);

      // design precedence: if exists, use it and tag designId
      const design = await findDesign(p.id, userId ?? null, guestId ?? null);
      if (design) hasAnyDesign = true;

      const imageUrl = design?.previewUrl || p.imageUrl || undefined;

      const baseMeta: Stripe.MetadataParam = {
        productId: p.id,
        variantType: p.digital ? "DIGITAL" : "PRINT",
        ...(userId && { userId }),
        ...(guestId && { guestId }),
        ...(cartItemId && { cartItemId }),
        designId: design?.id ?? "",
      };

      const digitalMeta: Stripe.MetadataParam = p.digital
        ? { digitalVariantId: p.digital.id, digitalFormat: p.digital.format ?? "" }
        : {};

      const printMeta: Stripe.MetadataParam = p.print
        ? {
            printVariantId: p.print.id,
            printFormat: p.print.format ?? "",
            ...(p.print.size && { printSize: String(p.print.size) }),
            ...(p.print.material && { printMaterial: String(p.print.material) }),
            ...(p.print.frame && { printFrame: String(p.print.frame) }),
          }
        : {};

      if (p.print) requiresShipping = true;

      // programmatic price so we can set product_data.images + metadata
      line_items.push({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(p.price) * 100),
          product_data: {
            name: p.title,
            ...(imageUrl ? { images: [imageUrl] } : {}),
            metadata: { ...baseMeta, ...digitalMeta, ...printMeta },
          },
        },
        quantity: item.quantity,
      });
    }

    const sessionMetadata: Stripe.MetadataParam = {
      kind: "order",
      ...(userId && { userId }),
      ...(guestId && { guestId }),
      ...(purchasedCartItemIds.length && { cartItemIds: purchasedCartItemIds.join(",") }),
    };

    // decide flow
    if (hasAnyDesign) {
      // EMBEDDED CHECKOUT
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded",
        redirect_on_completion: "never",
        line_items,
        ...(requiresShipping
          ? { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "FR"] } }
          : {}),
        consent_collection: { terms_of_service: "required" },
        automatic_tax: { enabled: true },
        metadata: sessionMetadata,
        client_reference_id: `order:${userId ?? guestId ?? "guest"}`,
      });

      return NextResponse.json({
        flow: "embedded",
        clientSecret: session.client_secret,
        sessionId: session.id,
      });
    } else {
      // HOSTED (REDIRECT) CHECKOUT
      const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL!;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        success_url: `${CLIENT_URL}/cart/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${CLIENT_URL}/cart`,
        line_items,
        ...(requiresShipping
          ? { shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "FR"] } }
          : {}),
        consent_collection: { terms_of_service: "required" },
        automatic_tax: { enabled: true },
        metadata: sessionMetadata,
        client_reference_id: `order:${userId ?? guestId ?? "guest"}`,
      });

      return NextResponse.json({
        flow: "redirect",
        url: session.url,
        sessionId: session.id,
      });
    }
  } catch (err: any) {
    console.error("[CHECKOUT_ROUTE_ERROR]", err?.message || err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
