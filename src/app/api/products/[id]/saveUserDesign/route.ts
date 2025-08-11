// src/app/api/products/[id]/save/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/utils/requireUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StylePayload = {
  fillColor: string;
  fillOpacity?: number;
  strokeColor: string;
  strokeOpacity?: number;
  strokeWidth: number;
  backgroundColor: string;
  backgroundOpacity?: number;
  defs?: string;
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await ctx.params;
    const {id: userId} = await requireUser();

    const body = await req.json();
    const style: StylePayload = body?.style;
    if (!style) return NextResponse.json({ error: "Missing style" }, { status: 400 });

    const defs = typeof style.defs === "string" ? style.defs : undefined;

    const design = await prisma.userDesign.upsert({
      where: { userId_productId: { userId, productId } },
      update: { style, defs },
      create: { userId, productId, style, defs },
    });

    const exportsLeft = Math.max(0, design.exportQuota - design.exportsUsed);
    const canExport = !!design.purchased && exportsLeft > 0;

    return NextResponse.json({ ok: true, canExport, exportsLeft, purchased: design.purchased });
  } catch (e: any) {
    if (e?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("SAVE_ERROR", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}




import { getCustomerIdFromRequest } from "@/utils/guest";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, guestId } = await getCustomerIdFromRequest(req);

  let design = null as
    | {
        style: any;
        defs: string | null;
        purchased: boolean;
        exportQuota: number;
        exportsUsed: number;
        updatedAt: Date;
      }
    | null;

  if (userId) {
    design = await prisma.userDesign.findUnique({
      where: { userId_productId: { userId, productId: id } },
      select: {
        style: true,
        defs: true,
        purchased: true,
        exportQuota: true,
        exportsUsed: true,
        updatedAt: true,
      },
    });
  } else if (guestId) {
    design = await prisma.userDesign.findUnique({
      where: { guestId_productId: { guestId, productId: id } },
      select: {
        style: true,
        defs: true,
        purchased: true,
        exportQuota: true,
        exportsUsed: true,
        updatedAt: true,
      },
    });
  }

  if (!design) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    style: design.style ?? {},
    defs: design.defs ?? "",
    meta: {
      purchased: design.purchased,
      exportQuota: design.exportQuota,
      exportsUsed: design.exportsUsed,
      exportsLeft: Math.max(0, (design.exportQuota ?? 0) - (design.exportsUsed ?? 0)),
      updatedAt: design.updatedAt,
    },
  });
}
