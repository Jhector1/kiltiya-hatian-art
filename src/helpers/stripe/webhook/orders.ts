// src/server/stripe/webhook/orders.ts
import { prisma } from "@/lib/prisma";
import { VariantType } from "@prisma/client";
import Stripe from "stripe";
import { canonLineItems, listSessionLineItems } from "./utils";
import { createPurchaseWebP } from "./cloudinaryHelper";
import { EntitlementSource } from "@prisma/client";

const PURCHASE_EXPORT_CREDITS = 5; // same as before

export async function handleOrderFulfillment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? null;
  const guestId = session.metadata?.guestId ?? null;
  if (!userId && !guestId) throw new Error("Missing customer identity");

  // idempotency via unique stripeSessionId on Order
  const exists = await prisma.order.findFirst({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (exists) return;

  const items = await listSessionLineItems(session.id);
  const canonical = canonLineItems(items);

  const purchasedCartItemIds = canonical
    .map((c) => c.cartItemId)
    .filter(Boolean) as string[];

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
      const explicitDesignId = c.designId || null;

      let design = null as null | {
        id: string;
        style: any;
        defs: string | null;
        previewUrl: string | null;
        previewPublicId: string | null;
        productId: string;
      };

      if (explicitDesignId) {
        design = await tx.userDesign.findUnique({
          where: { id: explicitDesignId },
          select: {
            id: true, style: true, defs: true,
            previewUrl: true, previewPublicId: true, productId: true,
          },
        });
      }
      if (!design) {
        const fallback = await tx.userDesign.findFirst({
          where: userId
            ? { userId, productId: c.productId }
            : { guestId: guestId!, productId: c.productId },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true, style: true, defs: true,
            previewUrl: true, previewPublicId: true, productId: true,
          },
        });
        if (fallback) design = fallback as any;
      }

      let purchasedDesignId: string | null = null;
      let purchasePreviewUrl: string | null = null;

      if (design) {
        // Create a purchase-specific Cloudinary preview (best-effort)
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

        // Snapshot the purchased design
        const snap = await tx.purchasedDesign.create({
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
          select: { id: true },
        });
        purchasedDesignId = snap.id;

        // Optional: store snapshot URL on the line
        try {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { previewUrlSnapshot: purchasePreviewUrl ?? design.previewUrl ?? null },
          });
        } catch {}
      }

      // ---- Grant export/edit entitlements for this purchase
      await tx.designEntitlement.create({
        data: {
          userId: userId ?? undefined,
          guestId: userId ? undefined : guestId ?? undefined,
          productId: c.productId,
          userDesignId: design?.id ?? null,
          purchasedDesignId,
          source: EntitlementSource.PURCHASE,
          orderId: order.id,
          orderItemId: orderItem.id,
          exportQuota: PURCHASE_EXPORT_CREDITS, // used to be set on UserDesign
          editQuota: 0,
          exportsUsed: 0,
          editsUsed: 0,
          expiresAt: null, // keep unlimited unless you want guest expiry here
        },
      });
    }

    // Clear purchased cart items
    if (purchasedCartItemIds.length) {
      await tx.cartItem.deleteMany({ where: { id: { in: purchasedCartItemIds } } });
    }

    // Create download tokens for DIGITAL items
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
            signedUrl: asset.url, // TODO: sign
            expiresAt,
            remainingUses: null,
            licenseSnapshot: license,
          },
        });
      }
    }
  });
}
