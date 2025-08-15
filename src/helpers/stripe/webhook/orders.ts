// src/server/stripe/webhook/orders.ts
import { prisma } from "@/lib/prisma";
import { VariantType } from "@prisma/client";
import Stripe from "stripe";
import { canonLineItems, listSessionLineItems } from "./utils";
import { createPurchaseWebP } from "./cloudinaryHelper";

export async function handleOrderFulfillment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? null;
  const guestId = session.metadata?.guestId ?? null;
  if (!userId && !guestId) throw new Error("Missing customer identity");

  // idempotency for orders via Order.stripeSessionId unique index
  const exists = await prisma.order.findFirst({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (exists) return;

  const items = await listSessionLineItems(session.id);
  const canonical = canonLineItems(items);

  // collect cartItemIds to clear
  const purchasedCartItemIds = canonical.map((c) => c.cartItemId).filter(Boolean) as string[];

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

    for (const c of canonical) {
      if (!c.productId) continue;

      const type: VariantType =
        c.variantType === "DIGITAL" ? VariantType.DIGITAL :
        c.variantType === "PRINT"   ? VariantType.PRINT   :
        c.digitalVariantId ? VariantType.DIGITAL :
        c.printVariantId   ? VariantType.PRINT   :
        VariantType.DIGITAL;

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: c.productId,
          type,
          price: c.unitAmountCents / 100,
          quantity: c.quantity,
          digitalVariantId: c.digitalVariantId || null,
          printVariantId: c.printVariantId || null,
        },
        select: { id: true, productId: true },
      });

      // ----- DESIGN PRECEDENCE -----
      // prefer explicit designId; else fallback to user's latest for that product
      const explicitDesignId = c.designId || null;

      let design = null as null | {
        id: string; style: any; defs: string | null; previewUrl: string | null; previewPublicId: string | null; productId: string;
      };

      if (explicitDesignId) {
        design = await tx.userDesign.findUnique({
          where: { id: explicitDesignId },
          select: { id: true, style: true, defs: true, previewUrl: true, previewPublicId: true, productId: true },
        });
      }
      if (!design) {
        const fallback = await tx.userDesign.findFirst({
          where: userId ? { userId, productId: c.productId } : { guestId: guestId!, productId: c.productId },
          orderBy: { updatedAt: "desc" },
          select: { id: true, style: true, defs: true, previewUrl: true, previewPublicId: true, productId: true },
        });
        if (fallback) design = fallback as any;
      }

      if (design) {
        // mark purchased
        await tx.userDesign.update({ where: { id: design.id }, data: { purchased: true, exportQuota:5 } });

        // make a purchase-specific Cloudinary WebP
        let purchasePreviewUrl: string | null = null;
        try {
          const { url } = await createPurchaseWebP({
            orderId: order.id,
            orderItemId: orderItem.id,
            userId,
            guestId,
            design: {
              previewPublicId: design.previewPublicId,
              previewUrl: design.previewUrl,
              style: design.style,
              defs: design.defs,
            },
          });
          purchasePreviewUrl = url;
        } catch (e: any) {
          console.error("Cloudinary upload failed:", e?.message || e);
        }

        // snapshot row
        await tx.purchasedDesign.create({
          data: {
            userId: userId ?? undefined,
            guestId: userId ? undefined : guestId ?? undefined,
            orderId: order.id,
            orderItemId: orderItem.id,
            productId: design.productId,
            style: design.style,
            defs: design.defs,
            svg: null,
            previewUrl: purchasePreviewUrl ?? design.previewUrl ?? null,
          },
        });

        // optional: store snapshot on the line (if you added the column)
        try {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { previewUrlSnapshot: purchasePreviewUrl ?? design.previewUrl ?? null },
          });
        } catch {}
      }
    }

    // clear purchased cart items
    if (purchasedCartItemIds.length) {
      await tx.cartItem.deleteMany({ where: { id: { in: purchasedCartItemIds } } });
    }

    // (optional) create download tokens for DIGITAL items
    const digitalItems = await tx.orderItem.findMany({
      where: { orderId: order.id, type: "DIGITAL" },
      include: { product: { include: { assets: true } }, digitalVariant: { select: { license: true } } },
    });
    const now = Date.now();
    const guestExpiryMs = 7 * 24 * 60 * 60 * 1000;
    const userExpiryMs  = 365 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now + (userId ? userExpiryMs : guestExpiryMs));

    for (const item of digitalItems) {
      const assets = item.product?.assets ?? [];
      const license = (item as any).digitalVariant?.license ?? "Personal";
      for (const asset of assets) {
        await tx.downloadToken.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            assetId: asset.id,
            userId: userId ?? undefined,
            guestId: userId ? undefined : guestId ?? undefined,
            signedUrl: asset.url, // TODO: sign it
            expiresAt,
            remainingUses: null,
            licenseSnapshot: license,
          },
        });
      }
    }
  });
}
