// File: src/app/api/checkout/success/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, VariantType } from "@prisma/client";
import { getCustomerIdFromRequest } from "@/utils/guest";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  if (!userId && !guestId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ digitalDownloads: [] });

  const orClauses: Prisma.OrderWhereInput[] = [
    ...(userId  ? [{ userId }]  : []),
    ...(guestId ? [{ guestId }] : []),
  ];

  const order = await prisma.order.findFirst({
    where: {
      stripeSessionId: sessionId,
      ...(orClauses.length ? { OR: orClauses } : {}),
    },
    include: {
      items: {
        where: { type: VariantType.DIGITAL },
        include: {
          product: { select: { title: true, assets: true } },
          digitalVariant: { select: { license: true } },
        },
      },
      downloadTokens: {
        include: { asset: true },
      },
    },
  });

  if (!order) return NextResponse.json({ digitalDownloads: [] });

  // Map (assetId -> title/license) for quick lookups
  const titleByAsset = new Map<string, string>();
  const licenseByAsset = new Map<string, string>();
  for (const it of order.items) {
    const title = it.product?.title ?? "Artwork";
    const license = it.digitalVariant?.license ?? "Personal";
    for (const a of it.product?.assets ?? []) {
      titleByAsset.set(a.id, title);
      licenseByAsset.set(a.id, license);
    }
  }

  const digitalDownloads = (order.downloadTokens ?? []).map((t) => {
    const asset = t.asset!;
    const title = titleByAsset.get(asset.id) ?? "Artwork";
    const license = licenseByAsset.get(asset.id) ?? t.licenseSnapshot ?? "Personal";
    return {
      id: asset.id,
      title,
      format: asset.ext,
      downloadUrl: t.signedUrl,
      previewUrl: asset.previewUrl ?? undefined,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      dpi: asset.dpi ?? undefined,
      colorProfile: asset.colorProfile ?? undefined,
      sizeBytes: asset.sizeBytes ?? undefined,
      license,
      isVector: asset.isVector,
      checksum: asset.checksum ?? undefined,
      expiresAt: t.expiresAt.toISOString(),
      remainingUses: t.remainingUses ?? null,
    };
  });

  return NextResponse.json({ digitalDownloads });
}
