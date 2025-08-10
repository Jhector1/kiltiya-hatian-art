// File: src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient, VariantType } from "@prisma/client";
import Stripe from "stripe";

export const runtime = "nodejs";
const prisma = new PrismaClient();

// TODO: replace with your real signer (S3/Cloudinary/R2, etc.)
async function signAssetUrl(asset: { url: string }) {
  // Return short-lived signed URL here. For now, just return the canonical URL.
  return asset.url;
}

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

  // Identity you stashed in session.metadata at checkout
  const userId  = session.metadata?.userId ?? null;
  const guestId = session.metadata?.guestId ?? null;
  if (!userId && !guestId) {
    console.error("🚨 Missing both userId and guestId in session.metadata");
    return new NextResponse("Missing customer identity", { status: 400 });
  }

  try {
    // Idempotency: bail if we've already created this order
    const already = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      select: { id: true },
    });
    if (already) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Pull line items (with product expansion for metadata)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
      limit: 100,
    });

    // Collect cartItemIds we put into price/product metadata
    const fromLineItems = lineItems.data
      .map((li) => {
        const price = li.price as Stripe.Price | null;
        const priceMeta = price?.metadata ?? {};
        const product = price?.product as Stripe.Product | string | undefined;
        const productMeta =
          product && typeof product !== "string" ? product.metadata ?? {} : {};
        return (priceMeta.cartItemId as string) || (productMeta.cartItemId as string) || null;
      })
      .filter(Boolean) as string[];

    const fromSessionCsv =
      session.metadata?.cartItemIds
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    const purchasedCartItemIds = Array.from(new Set([...fromLineItems, ...fromSessionCsv]));

    // Load purchased cart items for this customer
    const purchasedCartItems = purchasedCartItemIds.length
      ? await prisma.cartItem.findMany({
          where: {
            id: { in: purchasedCartItemIds },
            cart: userId ? { userId } : { guestId },
          },
          include: {
            digitalVariant: true,
            printVariant: true,
          },
        })
      : [];

    // Build "Buy Now" items (those without cartItemId metadata)
    type BuiltOrderItem = {
      productId: string;
      type: VariantType;
      price: number;
      quantity: number;
      digitalVariantId?: string | null;
      printVariantId?: string | null;
    };

    const purchasedSet = new Set(purchasedCartItemIds);
    const buyNowOrderItems: BuiltOrderItem[] = [];

    for (const li of lineItems.data) {
      const qty = li.quantity ?? 1;
      const amountSubtotal = li.amount_subtotal ?? li.amount_total ?? 0; // cents
      const unitAmount = qty > 0 ? amountSubtotal / qty : amountSubtotal;
      const price = li.price as Stripe.Price | null;

      const pMeta = price?.metadata ?? {};
      const prod = price?.product as Stripe.Product | string | undefined;
      const prodMeta =
        prod && typeof prod !== "string" ? (prod.metadata ?? {}) : {};
      const meta = { ...prodMeta, ...pMeta } as Record<string, string>;

      if (meta.cartItemId && purchasedSet.has(meta.cartItemId)) continue;

      const productId   = meta.productId;
      const variantType = (meta.variantType as "DIGITAL" | "PRINT") ??
        (meta.digitalVariantId ? "DIGITAL" : meta.printVariantId ? "PRINT" : undefined);

      if (!productId || !variantType) {
        console.warn("⚠️ Missing productId/variantType for Buy Now line item; skipping.");
        continue;
      }

      buyNowOrderItems.push({
        productId,
        type: variantType === "DIGITAL" ? VariantType.DIGITAL : VariantType.PRINT,
        price: Math.round(unitAmount) / 100,
        quantity: qty,
        digitalVariantId: meta.digitalVariantId ?? null,
        printVariantId: meta.printVariantId ?? null,
      });
    }

    // Create the order, items, and tokens
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: userId ?? undefined,
          guestId: userId ? undefined : guestId!,
          total: (session.amount_total ?? 0) / 100,
          status: "COMPLETED",
          stripeSessionId: session.id,
        },
      });

      // Persist order items (cart-based)
      for (const ci of purchasedCartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: ci.productId,
            type: ci.digitalVariant ? VariantType.DIGITAL : VariantType.PRINT,
            price: ci.price,
            quantity: ci.quantity,
            digitalVariantId: ci.digitalVariantId,
            printVariantId: ci.printVariantId,
          },
        });
      }

      // Persist order items (buy-now)
      for (const bi of buyNowOrderItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: bi.productId,
            type: bi.type,
            price: bi.price,
            quantity: bi.quantity,
            digitalVariantId: bi.digitalVariantId ?? undefined,
            printVariantId: bi.printVariantId ?? undefined,
          },
        });
      }

      // Clear purchased cart items
      if (purchasedCartItems.length) {
        await tx.cartItem.deleteMany({
          where: { id: { in: purchasedCartItems.map((x) => x.id) } },
        });
      }

      // ---- Create DownloadTokens for DIGITAL order items ----
      // Reload DIGITAL items with product.assets + license
      const digitalItems = await tx.orderItem.findMany({
        where: { orderId: order.id, type: VariantType.DIGITAL },
        include: {
          product: { include: { assets: true } },
          digitalVariant: { select: { license: true } },
        },
      });

      // Expiry policy (tweak as you like)
      const now = Date.now();
      const guestExpiryMs = 7 * 24 * 60 * 60 * 1000;   // 7d
      const userExpiryMs  = 365 * 24 * 60 * 60 * 1000; // 365d
      const expiresAt = new Date(now + (userId ? userExpiryMs : guestExpiryMs));

      for (const item of digitalItems) {
        const assets = item.product?.assets ?? [];
        const license = item.digitalVariant?.license ?? "Personal";
        for (const asset of assets) {
          const signedUrl = await signAssetUrl(asset);
          await tx.downloadToken.create({
            data: {
              orderId: order.id,
              orderItemId: item.id,
              assetId: asset.id,
              userId: userId ?? undefined,
              guestId: userId ? undefined : guestId ?? undefined,
              signedUrl,
              expiresAt,
              remainingUses: null,
              licenseSnapshot: license,
            },
          });
        }
      }
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook processing error:", (err as Error).message);
    return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
