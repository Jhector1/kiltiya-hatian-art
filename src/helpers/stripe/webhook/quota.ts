// import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { QuotaKind } from "./types";
import { listSessionLineItems, tryClaimIdempotencyTx } from "./utils";
import Stripe from "stripe";

// unchanged
export function isQuotaTopup(session: Stripe.Checkout.Session) {
  return (
    session?.metadata?.kind === "quota_topup" &&
    (session?.metadata?.quota === "edit" || session?.metadata?.quota === "export")
  );
}

async function getQuotaUnits(sessionId: string, quota: QuotaKind) {
  const items = await listSessionLineItems(sessionId);
  const key = quota === "export" ? "exports_per_unit" : "edits_per_unit";
  return items.data.reduce((sum, li) => {
    const price = li.price as any;
    const prod  = price?.product as any;
    const fromPrice   = Number.parseInt(price?.metadata?.[key] ?? "0", 10);
    const fromProduct = Number.parseInt(prod?.metadata?.[key] ?? "0", 10);
    const per = Number.isFinite(fromPrice) && fromPrice > 0 ? fromPrice
            : Number.isFinite(fromProduct) ? fromProduct : 0;
    return sum + per * (li.quantity ?? 1);
  }, 0);
}

export async function handleQuotaTopup(session: Stripe.Checkout.Session) {
  const quota: QuotaKind = (session.metadata?.quota as QuotaKind) || "edit";
  const userId  = session.metadata?.userId || null;
  const guestId = session.metadata?.guestId || null;
  const productId = session.metadata?.productId || null;

  if (!productId || (!userId && !guestId)) return;
  if (session.payment_status !== "paid") return;

  const units = await getQuotaUnits(session.id, quota);
  if (units <= 0) return; // nothing to do

    const idemKey = `topup:${session.id}`;

  await prisma.$transaction(async (tx) => {
    const claimed = await tryClaimIdempotencyTx(tx, idemKey);
    if (!claimed) return; // someone else already applied it — clean no-op

    const where = userId
      ? { userId_productId: { userId, productId } }
      : ({ guestId_productId: { guestId: guestId!, productId } } as any);

    const baseCreate = {
      userId, guestId, productId,
      style: {},
      purchased: false,
      exportsUsed: 0,
      editsUsed: 0,
    };

    if (quota === "export") {
      await tx.userDesign.upsert({
        where,
        create: { ...baseCreate, exportQuota: units, editQuota: 0 },
        update: { exportQuota: { increment: units } },
      });
    } else {
      await tx.userDesign.upsert({
        where,
        create: { ...baseCreate, editQuota: units, exportQuota: 0 },
        update: { editQuota: { increment: units } },
      });
    }
  });
}

