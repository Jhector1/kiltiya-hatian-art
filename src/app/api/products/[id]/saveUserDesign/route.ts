import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/utils/requireUser";
import { getCustomerIdFromRequest } from "@/utils/guest";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type StylePayload = Record<string, any>;
type Body = {
  style: StylePayload;            // REQUIRED
  // optional preview upload
  previewDataUrl?: string;        // data:image/...;base64,...
  width?: number;                 // default 800
  quality?: number;               // default 70
};

export async function POST(req: NextRequest,   {params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {id: productId} = await params;

  // Accept both signed-in and guest
  let userId: string | null = null;
  let guestId: string | null = null;
  try {
    const u = await requireUser();
    userId = u.id;
  } catch {
    const ids = await getCustomerIdFromRequest(req);
    guestId = ids.guestId ?? null;
  }

  if (!userId && !guestId) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const style = body?.style;
  if (!style) return NextResponse.json({ error: "Missing style" }, { status: 400 });

  const defs = typeof style.defs === "string" ? style.defs : undefined;

  // Upsert the design first
  const design = await prisma.userDesign.upsert({
    where: userId
      ? { userId_productId: { userId, productId } }
      : { guestId_productId: { guestId: guestId!, productId } },
    update: { style, defs },
    create: { userId: userId ?? undefined, guestId: guestId ?? undefined, productId, style, defs },
  });

  let previewUrl: string | null = design.previewUrl;

  // Optional: upload/overwrite preview to Cloudinary when provided
  if (body.previewDataUrl?.startsWith("data:image/")) {
    const base64 = body.previewDataUrl.split(",")[1];
    const input = Buffer.from(base64, "base64");

    const w = Math.max(64, Math.min(2000, Number(body.width) || 800));
    const q = Math.max(1, Math.min(100, Number(body.quality) || 70));

    const webp = await sharp(input)
      .resize({ width: w, withoutEnlargement: true, fit: "inside", background: { r:255,g:255,b:255,alpha:0 } })
      .webp({ quality: q })
      .toBuffer();

    const publicId = `products/designs/previews/design_${design.id}`;
    const uploaded = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { public_id: publicId, resource_type: "image", type: "upload", overwrite: true, format: "webp", invalidate: true },
          (err, res) => (err ? reject(err) : resolve(res))
        )
        .end(webp);
    });

    previewUrl = uploaded.secure_url as string;

    await prisma.userDesign.update({
      where: { id: design.id },
      data: {
        previewPublicId: uploaded.public_id,
        previewUrl,
        previewUpdatedAt: new Date(),
      },
    });
  }

  const refreshed = await prisma.userDesign.findUnique({
    where: { id: design.id },
    select: {
      id: true, purchased: true, exportQuota: true, exportsUsed: true,
      previewUrl: true, previewUpdatedAt: true,
    },
  });

  const exportsLeft = Math.max(0, (refreshed?.exportQuota ?? 0) - (refreshed?.exportsUsed ?? 0));
  const canExport = !!refreshed?.purchased && exportsLeft > 0;

  return NextResponse.json({
    ok: true,
    designId: design.id,
    previewUrl: refreshed?.previewUrl ?? null,
    previewUpdatedAt: refreshed?.previewUpdatedAt ?? null,
    purchased: refreshed?.purchased ?? false,
    exportsLeft,
    canExport,
  });
}

export async function GET(req: NextRequest, {params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {id: productId} = await params;
  const { userId, guestId } = await getCustomerIdFromRequest(req);

  let design = null as any;

  if (userId) {
    design = await prisma.userDesign.findUnique({
      where: { userId_productId: { userId, productId } },
      select: {
        style: true, defs: true, purchased: true, exportQuota: true, exportsUsed: true,
        updatedAt: true, previewUrl: true, previewUpdatedAt: true, id: true,
      },
    });
  } else if (guestId) {
    design = await prisma.userDesign.findUnique({
      where: { guestId_productId: { guestId, productId } },
      select: {
        style: true, defs: true, purchased: true, exportQuota: true, exportsUsed: true,
        updatedAt: true, previewUrl: true, previewUpdatedAt: true, id: true,
      },
    });
  }

  if (!design) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    designId: design.id,
    style: design.style ?? {},
    defs: design.defs ?? "",
    previewUrl: design.previewUrl ?? null,
    meta: {
      purchased: design.purchased,
      exportQuota: design.exportQuota,
      exportsUsed: design.exportsUsed,
      exportsLeft: Math.max(0, (design.exportQuota ?? 0) - (design.exportsUsed ?? 0)),
      updatedAt: design.updatedAt,
      previewUpdatedAt: design.previewUpdatedAt ?? null,
    },
  });
}
