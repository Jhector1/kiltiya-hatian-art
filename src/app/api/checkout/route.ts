import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { OrderList } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderList;

    const line_items = await Promise.all(
      body.cartProductList.map(async (item) => {
        const p = item.myProduct;
        // Create a Price each time (or look one up if you cache/manage them)
        const variantMetadata: Stripe.MetadataParam = {
          productId: p.id,
          customerId: body.customerId,
        };

        if (p.digital) {
          variantMetadata.digitalVariantId = p.digital.id;
          variantMetadata.digitalFormat = p.digital.format;
        }
        if (p.print) {
          variantMetadata.printVariantId = p.print.id;
          variantMetadata.printFormat = p.print.format;
          if (p.print.size) variantMetadata.printSize = p.print.size;
          if (p.print.material)
            variantMetadata.printMaterial = p.print.material;
          if (p.print.frame) variantMetadata.printFrame = p.print.frame;
        }

        const stripeProduct = await stripe.products.create({
          name: p.title,
          images: [p.imageUrl],
          metadata: variantMetadata,
        });

        const price = await stripe.prices.create({
          unit_amount: Math.round(Number(p.price) * 100),
          currency: "usd",
          product: stripeProduct.id,
        });

        return {
          price: price.id,
          quantity: item.quantity,
        } as Stripe.Checkout.SessionCreateParams.LineItem;
      })
    );

    const { NEXT_PUBLIC_CLIENT_URL: CLIENT_URL } = process.env;

    const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  success_url: `${CLIENT_URL}/cart/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${CLIENT_URL}/cart`,
  shipping_address_collection: {
    allowed_countries: ["US", "CA", "GB", "FR"],
  },
  consent_collection: { terms_of_service: "required" },
  automatic_tax: { enabled: true },
  line_items,
  metadata: {
    customerId: body.customerId, // ✅ Required for webhook & success page
  },
});


    return NextResponse.json({ sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[CHECKOUT_ERROR]", err);
    return NextResponse.json(
      { error: message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
