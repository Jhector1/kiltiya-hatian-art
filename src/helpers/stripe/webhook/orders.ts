// src/server/stripe/webhook/orders.ts
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { canonLineItems, listSessionLineItems } from "./utils";
import { createPurchaseWebP } from "./cloudinaryHelper";
import { EntitlementSource, Prisma, VariantType } from "@prisma/client";

const PURCHASE_EXPORT_CREDITS = 5;

type CanonicalLine = {
  productId: string;
  quantity: number;
  unitAmountCents: number;
  cartItemId?: string;
  variantType?: "DIGITAL" | "PRINT" | "BUNDLE";
  digitalVariantId?: string | null;
  printVariantId?: string | null;
  digitalUnitCents?: number; // optional precise split from metadata
  printUnitCents?: number; // optional precise split from metadata
  designId?: string | null;
};

export async function handleOrderFulfillment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? null;
  const guestId = session.metadata?.guestId ?? null;
  if (!userId && !guestId) throw new Error("Missing customer identity");

  const toJsonInput = (
    v: Prisma.JsonValue | null | undefined
  ): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =>
    v === null || v === undefined
      ? Prisma.JsonNull
      : (v as Prisma.InputJsonValue);

  // idempotency by stripeSessionId
  const exists = await prisma.order.findFirst({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (exists) return;

  const items = await listSessionLineItems(session.id);
  const canonical = canonLineItems(items) as CanonicalLine[];

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

    // Reusable helper: get a sensible fallback preview if no design
    const getProductFallbackPreview = async (productId: string) => {
      const p = await tx.product.findUnique({
        where: { id: productId },
        select: {
          thumbnails: true,
          assets: {
            select: { previewUrl: true, url: true },
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return (
        p?.thumbnails?.[0] ??
        p?.assets?.[0]?.previewUrl ??
        p?.assets?.[0]?.url ??
        null
      );
    };

    for (const c of canonical) {
      if (!c.productId) continue;

      const hasDigital = Boolean(c.digitalVariantId);
      const hasPrint = Boolean(c.printVariantId);
      const unitCents = c.unitAmountCents;

      // Compute price split (precise if provided; else 50/50; else single-variant)
      const split = (() => {
        if (hasDigital && hasPrint) {
          if (
            typeof c.digitalUnitCents === "number" &&
            typeof c.printUnitCents === "number"
          ) {
            return { digital: c.digitalUnitCents, print: c.printUnitCents };
          }
          const half = Math.floor(unitCents / 2);
          return { digital: half, print: unitCents - half };
        }
        return {
          digital: hasDigital ? unitCents : 0,
          print: hasPrint ? unitCents : 0,
        };
      })();

      // Get design once (use tx)
      const explicitDesignId = c.designId || null;
      const design = explicitDesignId
        ? await tx.userDesign.findUnique({
            where: { id: explicitDesignId },
            select: {
              id: true,
              style: true,
              defs: true,
              previewUrl: true,
              previewPublicId: true,
              productId: true,
            },
          })
        : await tx.userDesign.findFirst({
            where: userId
              ? { userId, productId: c.productId }
              : { guestId: guestId!, productId: c.productId },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              style: true,
              defs: true,
              previewUrl: true,
              previewPublicId: true,
              productId: true,
            },
          });

      // All writes must use tx.* inside the transaction
      const createLine = async (
        variant: "DIGITAL" | "PRINT",
        cents: number
      ) => {
        if (!cents) return;

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: c.productId!,
            type: variant as VariantType,
            price: cents / 100,
            quantity: c.quantity,
            digitalVariantId:
              variant === "DIGITAL" ? c.digitalVariantId || null : null,
            printVariantId:
              variant === "PRINT" ? c.printVariantId || null : null,
          },
          select: { id: true },
        });

        // Preferred image: purchase-specific webp (from design), else design preview, else product fallback
        let previewForLine: string | null = null;

        // If we have a design, try to render a purchase-specific preview
        if (design) {
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
            previewForLine = url ?? design.previewUrl ?? null;
          } catch (e: any) {
            console.error("Cloudinary upload failed:", e?.message || e);
            previewForLine = design.previewUrl ?? null;
          }

          // Snapshot purchased design (so the order keeps its own copy)
          const snap = await tx.purchasedDesign.create({
            data: {
              userId: userId ?? undefined,
              guestId: userId ? undefined : guestId ?? undefined,
              orderId: order.id,
              orderItemId: orderItem.id,
              productId: design.productId,
              style: toJsonInput(design.style),
              defs: design.defs,
              svg: null,
              previewUrl: previewForLine,
            },
            select: { id: true },
          });

          // Save the preview URL on the line for order UIs
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { previewUrlSnapshot: previewForLine },
          });

          // Entitlements per line
          await tx.designEntitlement.create({
            data: {
              userId: userId ?? undefined,
              guestId: userId ? undefined : guestId ?? undefined,
              productId: c.productId!,
              userDesignId: design?.id ?? null,
              purchasedDesignId: snap.id,
              source: EntitlementSource.PURCHASE,
              orderId: order.id,
              orderItemId: orderItem.id,
              exportQuota: variant === "DIGITAL" ? PURCHASE_EXPORT_CREDITS : 0,
              editQuota: 0,
              exportsUsed: 0,
              editsUsed: 0,
              expiresAt: null,
            },
          });
        } else {
          // No design: still ensure previewUrlSnapshot is useful for order displays
          const fallback = await getProductFallbackPreview(c.productId!);
          previewForLine = fallback;

          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { previewUrlSnapshot: previewForLine },
          });

          await tx.designEntitlement.create({
            data: {
              userId: userId ?? undefined,
              guestId: userId ? undefined : guestId ?? undefined,
              productId: c.productId!,
              userDesignId: null,
              purchasedDesignId: null,
              source: EntitlementSource.PURCHASE,
              orderId: order.id,
              orderItemId: orderItem.id,
              exportQuota: variant === "DIGITAL" ? PURCHASE_EXPORT_CREDITS : 0,
              editQuota: 0,
              exportsUsed: 0,
              editsUsed: 0,
              expiresAt: null,
            },
          });
        }
      };

      if (hasDigital && hasPrint) {
        await createLine("DIGITAL", split.digital);
        await createLine("PRINT", split.print);
      } else if (hasDigital) {
        await createLine("DIGITAL", split.digital);
      } else if (hasPrint) {
        await createLine("PRINT", split.print);
      } else {
        // No variant ids, treat as PRINT by default
        await createLine("PRINT", unitCents);
      }
    }

    // Clear purchased cart items
    if (purchasedCartItemIds.length) {
      await tx.cartItem.deleteMany({
        where: { id: { in: purchasedCartItemIds } },
      });
    }

    // Create download tokens for DIGITAL items
    const digitalItems = await tx.orderItem.findMany({
      where: { orderId: order.id, type: "DIGITAL" },
      include: {
        product: { include: { assets: true } },
        digitalVariant: { select: { license: true } },
      },
    });

    const now = Date.now();
    const guestExpiryMs = 7 * 24 * 60 * 60 * 1000;
    const userExpiryMs = 365 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now + (userId ? userExpiryMs : guestExpiryMs));

    for (const item of digitalItems) {
      const assets = item.product?.assets ?? [];
      const license = item.digitalVariant?.license ?? "Personal";
      for (const asset of assets) {
        await tx.downloadToken.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            assetId: asset.id,
            userId: userId ?? undefined,
            guestId: userId ? undefined : guestId ?? undefined,
            signedUrl: asset.url, // TODO: replace with signed URL
            expiresAt,
            remainingUses: null,
            licenseSnapshot: license,
          },
        });
      }
    }
  });
}
