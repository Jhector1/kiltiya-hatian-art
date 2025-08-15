// File: src/app/api/cart/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { AddToCartBody, CartSelectedItem, productListSelect } from "@/types";
import { getCustomerIdFromRequest } from "@/utils/guest";
// import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─── GET /api/cart ───────────────────────────────────────────────────
// ─── GET /api/cart ───────────────────────────────────────────────────
// top of file:
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ...inside GET:
export async function GET(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const digitalVariantId = url.searchParams.get("digitalVariantId");
  const printVariantId = url.searchParams.get("printVariantId");
  const live = url.searchParams.get("liveDesignPreview") === "1"; // 👈

  const cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
    select: { id: true },
  });
  if (!cart) {
    return NextResponse.json([] as CartSelectedItem[], {
      headers: { "Cache-Control": "no-store" }, // 👈
    });
  }

  if (productId && (digitalVariantId || printVariantId)) {
    const where: Record<string, string> = { cartId: cart.id, productId };
    if (digitalVariantId) where.digitalVariantId = digitalVariantId;
    if (printVariantId) where.printVariantId = printVariantId;
    const item = await prisma.cartItem.findFirst({ where });
    return NextResponse.json(
      { inCart: Boolean(item) },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    select: {
      id: true,
      price: true,
      quantity: true,
      printVariant: true,
      digitalVariant: true,
      product: { select: productListSelect },
      designId: true,
      previewUrlSnapshot: true,
      styleSnapshot: true,
      // 👇 bring live design preview
      design: { select: { previewUrl: true, previewUpdatedAt: true } },
    },
  });

  const products: CartSelectedItem[] = items.map((ci) => {
    // build a cache-busted URL if we have a design preview
    const livePreview = ci.design?.previewUrl
      ? `${ci.design.previewUrl}${
          ci.design.previewUpdatedAt
            ? `?v=${ci.design.previewUpdatedAt.getTime()}`
            : ""
        }`
      : null;

    // If live=true prefer the *current* design preview; otherwise prefer the frozen snapshot
    const previewUrl = live
      ? livePreview ??
        ci.previewUrlSnapshot ??
        ci.product.thumbnails?.[0] ??
        null
      : ci.previewUrlSnapshot ??
        livePreview ??
        ci.product.thumbnails?.[0] ??
        null;

    return {
      cartItemId: ci.id,
      cartPrice: ci.price,
      cartQuantity: ci.quantity,
      digital: ci.digitalVariant,
      print: ci.printVariant,
      ...ci.product,
      price: ci.price,
      designId: ci.designId,
      previewUrl, // 👈 what Gallery will render
      isUserDesign: !!ci.designId,
    };
  });

  return NextResponse.json(products, {
    headers: { "Cache-Control": "no-store" },
  });
}

// ─── POST /api/cart ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  // inside POST /api/cart

  const {
    productId,
    digitalType,
    printType,
    price,
    license = "personal",
    quantity = 1,
    format = "png",
    size = null,
    material = null,
    frame = null,
    design, // 👈 NEW
    snapshot = true, // 👈 NEW
  } = (await req.json()) as AddToCartBody;
  

  if (!productId || (!digitalType && !printType) || price == null) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  // ensure cart exists (unchanged) …
  let cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
  });
  if (!cart) cart = await prisma.cart.create({ data: { userId, guestId } });

  // 2️⃣ (NEW) — validate/prepare design if provided
  let designId: string | null = null;
  let previewUrlSnapshot: string | null = null;
  let styleSnapshot: any = null;

  if (design) {
    // find the design & enforce ownership
    const found = await prisma.userDesign.findFirst({
      where: {
        productId,
        ...(design.id ? { id: design.id } : {}),
        OR: [{ userId: userId ?? "" }, { guestId: guestId ?? "" }],
      },
    });
    if (!found) {
      return NextResponse.json(
        { error: "Design not found or not owned by user." },
        { status: 403 }
      );
    }

    // optional update of style/defs while adding to cart
    if (design.style || typeof design.defs !== "undefined") {
      await prisma.userDesign.update({
        where: { id: found.id },
        data: {
          ...(design.style ? { style: design.style } : {}),
          ...(typeof design.defs !== "undefined" ? { defs: design.defs } : {}),
        },
      });
    }

    designId = found.id;

    // optional preview upload if dataURL provided
    if (design.previewDataUrl?.startsWith("data:")) {
      const base64 = design.previewDataUrl.split(",")[1];
      const input = Buffer.from(base64, "base64");
      // encode webp in-place (you can also call your /api/designs/[id]/preview route instead)
      const sharp = (await import("sharp")).default;
      const webp = await sharp(input)
        .resize({ width: 800, withoutEnlargement: true, fit: "inside" })
        .webp({ quality: 70 })
        .toBuffer();

      const publicId = `products/designs/previews/design_${found.id}`;
      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              public_id: publicId,
              resource_type: "image",
              type: "upload",
              overwrite: true,
              format: "webp",
              invalidate: true,
            },
            (err, result) => (err ? reject(err) : resolve(result))
          )
          .end(webp);
      });

      previewUrlSnapshot = upload.secure_url as string;

      // persist the canonical preview on the design as well (nice to have)
      await prisma.userDesign.update({
        where: { id: found.id },
        data: {
          previewPublicId: upload.public_id,
          previewUrl: previewUrlSnapshot,
          previewUpdatedAt: new Date(),
        },
      });
    }

    // snapshot the current style to freeze the cart line (optional)
    if (snapshot && design.style) {
      styleSnapshot = design.style;
    }
  }

  // 3️⃣ create variants (unchanged)
  const digitalVariant = digitalType
    ? await prisma.productVariant.create({
        data: { productId, type: "DIGITAL", format, license },
      })
    : null;

  const printVariant = printType
    ? await prisma.productVariant.create({
        data: { productId, type: "PRINT", format, size, material, frame },
      })
    : null;

  // 4️⃣ create cart item with design markers (NEW fields)
  const r = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      digitalVariantId: digitalVariant?.id,
      printVariantId: printVariant?.id,
      price: parseFloat(String(price)),
      quantity,
      designId, // 👈 tells your app this is a user design line
      previewUrlSnapshot, // 👈 frozen image for the cart/checkout
      styleSnapshot, // 👈 frozen style JSON (optional)
    },
  });
  

  // response (add the 3 new fields if you like)
  return NextResponse.json({
    message: "Item added with new variant.",
    result: {
      cartItemId: r.id,
      cartId: cart.id,
      productId,
      digitalVariantId: digitalVariant?.id ?? null,
      printVariantId: printVariant?.id ?? null,
      price: r.price,
      quantity: r.quantity,
      designId,
      previewUrlSnapshot,
      styleSnapshot: !!styleSnapshot, // boolean is enough for clients
    },
  });
}

// ─── DELETE /api/cart ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  }

  const cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
  });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found." }, { status: 404 });
  }

  const cartId = cart.id;

  const items = await prisma.cartItem.findMany({
    where: { cartId, productId },
  });

  const variantIds = items.flatMap((i) =>
    [i.digitalVariantId, i.printVariantId].filter((v): v is string =>
      Boolean(v)
    )
  );

  await prisma.cartItem.deleteMany({ where: { cartId, productId } });

  if (variantIds.length) {
    await prisma.productVariant.deleteMany({
      where: { id: { in: variantIds } },
    });
  }

  return NextResponse.json({
    message: `Removed ${items.length} item(s) and ${variantIds.length} variant(s).`,
  });
}

// ─── PATCH /api/cart ────────────────────────────────────────────────
// ─── PATCH /api/cart ────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const {
    productId,
    digitalVariantId = null, // "ADD" | "REMOVE" | string | null
    printVariantId = null,   // "ADD" | "REMOVE" | string | null
    updates = {},
  } = await req.json();

  /* 1) Guards */
  if (!productId || (!digitalVariantId && !printVariantId)) {
    return NextResponse.json(
      { error: "Missing required fields or no variant to update." },
      { status: 400 }
    );
  }

  const fullPrice = parseFloat(String(updates.price));
  if (!Number.isFinite(fullPrice)) {
    return NextResponse.json(
      { error: "`updates.price` must be a valid number." },
      { status: 400 }
    );
  }

  /* 2) Get cart & existing item for this product */
  const cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
    include: { items: { where: { productId } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { error: "Product not found in cart." },
      { status: 404 }
    );
  }
  const cartItem = cart.items[0];

  /* Helpers to shape variant data */
  const asDigitalData = (u: any) => ({
    productId,
    type: "DIGITAL" as const,
    format: u.format ?? 'jpg',
    license: u.license ?? undefined,
  });
  const asPrintData = (u: any) => ({
    productId,
    type: "PRINT" as const,
    format: u.format ?? 'jpg',
    size: u.size ?? undefined,
    material: u.material ?? undefined,
    frame: u.frame ?? undefined,
  });

  /* Track new ids & possible orphan ids to clean up after tx */
  let nextDigitalId: string | null | undefined = cartItem.digitalVariantId ?? null;
  let nextPrintId: string | null | undefined = cartItem.printVariantId ?? null;
  const maybeDeleteDigitalIds: string[] = [];
  const maybeDeletePrintIds: string[] = [];

  /* 3) Do all writes inside one interactive transaction */
  await prisma.$transaction(async (tx) => {
    // DIGITAL
    if (digitalVariantId === "REMOVE") {
      if (nextDigitalId) maybeDeleteDigitalIds.push(nextDigitalId);
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { digitalVariantId: null },
      });
      nextDigitalId = null;
    } else if (digitalVariantId === "ADD") {
      const created = await tx.productVariant.create({
        data: asDigitalData(updates),
        select: { id: true },
      });
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { digitalVariantId: created.id },
      });
      nextDigitalId = created.id;
    } else if (typeof digitalVariantId === "string") {
      const updated = await tx.productVariant.updateMany({
        where: { id: digitalVariantId },
        data: asDigitalData(updates),
      });
      if (updated.count === 0) {
        const created = await tx.productVariant.create({
          data: asDigitalData(updates),
          select: { id: true },
        });
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: { digitalVariantId: created.id },
        });
        nextDigitalId = created.id;
      } else {
        nextDigitalId = digitalVariantId;
      }
    }

    // PRINT
    if (printVariantId === "REMOVE") {
      if (nextPrintId) maybeDeletePrintIds.push(nextPrintId);
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { printVariantId: null },
      });
      nextPrintId = null;
    } else if (printVariantId === "ADD") {
      const created = await tx.productVariant.create({
        data: asPrintData(updates),
        select: { id: true },
      });
      await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { printVariantId: created.id },
      });
      nextPrintId = created.id;
    } else if (typeof printVariantId === "string") {
      const updated = await tx.productVariant.updateMany({
        where: { id: printVariantId },
        data: asPrintData(updates),
      });
      if (updated.count === 0) {
        const created = await tx.productVariant.create({
          data: asPrintData(updates),
          select: { id: true },
        });
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: { printVariantId: created.id },
        });
        nextPrintId = created.id;
      } else {
        nextPrintId = printVariantId;
      }
    }

    // Set the line price ONCE (via tx!)
    await tx.cartItem.update({
      where: { id: cartItem.id },
      data: { price: fullPrice },
    });
  }, { timeout: 15000, maxWait: 5000 }); // ↑ increase timeout & maxWait as needed

  /* 4) Clean up orphans & apply final checks OUTSIDE the transaction */

  // delete old DIGITAL variant if no longer referenced
  for (const id of maybeDeleteDigitalIds) {
    const stillRef = await prisma.cartItem.count({ where: { digitalVariantId: id } });
    if (stillRef === 0) {
      await prisma.productVariant.delete({ where: { id } }).catch(() => {});
    }
  }
  // delete old PRINT variant if no longer referenced
  for (const id of maybeDeletePrintIds) {
    const stillRef = await prisma.cartItem.count({ where: { printVariantId: id } });
    if (stillRef === 0) {
      await prisma.productVariant.delete({ where: { id } }).catch(() => {});
    }
  }

  // If both variants were removed, delete the cart item now
  const finalState = await prisma.cartItem.findUnique({
    where: { id: cartItem.id },
    select: { digitalVariantId: true, printVariantId: true },
  });
  if (!finalState?.digitalVariantId && !finalState?.printVariantId) {
    await prisma.cartItem.delete({ where: { id: cartItem.id } });
    return NextResponse.json({
      message: "Cart item removed because both variants were removed.",
      digitalVariantId: null,
      printVariantId: null,
      price: fullPrice,
    });
  }

  /* 5) Success (return fresh IDs so client can sync) */
  return NextResponse.json({
    message: "Cart item updated successfully.",
    digitalVariantId: nextDigitalId ?? null,
    printVariantId: nextPrintId ?? null,
    price: fullPrice,
  });
}

