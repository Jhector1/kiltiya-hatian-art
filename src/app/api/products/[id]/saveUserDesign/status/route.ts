// File: src/app/api/products/[id]/saveUserDesign/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerIdFromRequest } from "@/utils/guest";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try user or guest — do NOT throw if missing
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const signedIn = !!userId;

  // Look up design either by user or guest
  let design = null as
    | {
        purchased: boolean;
        exportQuota: number;
        exportsUsed: number;
      }
    | null;

  if (userId) {
    design = await prisma.userDesign.findUnique({
      where: { userId_productId: { userId, productId: id } },
      select: { purchased: true, exportQuota: true, exportsUsed: true },
    });
  } else if (guestId) {
    design = await prisma.userDesign.findUnique({
      where: { guestId_productId: { guestId, productId: id } },
      select: { purchased: true, exportQuota: true, exportsUsed: true },
    });
  }

  if (!design) {
    // No saved design yet
    return NextResponse.json({
      signedIn,
      purchased: false,
      canExport: false,
      reason: signedIn ? "not_purchased" : "signin_required",
      exportQuota: 0,
      exportsUsed: 0,
      exportsLeft: 0,
    });
  }

  const exportQuota = design.exportQuota ?? 0;
  const exportsUsed = design.exportsUsed ?? 0;
  const exportsLeft = Math.max(0, exportQuota - exportsUsed);
  const canExport = signedIn && !!design.purchased && exportsLeft > 0;

  return NextResponse.json({
    signedIn,
    purchased: !!design.purchased,
    canExport,
    reason: canExport
      ? null
      : !signedIn
      ? "signin_required"
      : !design.purchased
      ? "not_purchased"
      : exportsLeft <= 0
      ? "quota_exhausted"
      : null,
    exportQuota,
    exportsUsed,
    exportsLeft,
  });
}
