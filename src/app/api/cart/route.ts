// File: src/app/api/cart/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { CartSelectedItem, productListSelect } from "@/types";
import {  getCustomerIdFromRequest } from "@/utils/guest";
// import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─── GET /api/cart ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const digitalVariantId = url.searchParams.get("digitalVariantId");
  const printVariantId = url.searchParams.get("printVariantId");

  const cart = await prisma.cart.findFirst({
    where: {
      OR: [{ userId }, { guestId }],
    },
    select: { id: true },
  });
  if (!cart) return NextResponse.json([] as CartSelectedItem[]);

  // 1️⃣ existence check mode
  if (productId && (digitalVariantId || printVariantId)) {
    const where: Record<string, string> = { cartId: cart.id, productId };
    if (digitalVariantId) where.digitalVariantId = digitalVariantId;
    if (printVariantId) where.printVariantId = printVariantId;
    const item = await prisma.cartItem.findFirst({ where });
    return NextResponse.json({ inCart: Boolean(item) });
  }

  // 2️⃣ full-cart fetch
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    select: {
      id: true,
      price: true,
      quantity: true,
      printVariant: true,
      digitalVariant: true,
      product: { select: productListSelect },
    },
  });

  const products: CartSelectedItem[] = items.map((ci) => ({
    cartItemId: ci.id,
    cartPrice: ci.price,
    cartQuantity: ci.quantity,
    digital: ci.digitalVariant,
    print: ci.printVariant,
    ...ci.product,
    price: ci.price,
  }));

  return NextResponse.json(products);
}

// ─── POST /api/cart ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  const {
    productId,
    digitalType,
    printType,
    price,
    license = 'personal',
    quantity = 1,
    format = "png",
    size = null,
    material = null,
    frame = null,
    
  } = await req.json();

  if (!productId || (!digitalType && !printType) || price == null) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // ensure cart exists
  let cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
  });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId, guestId } });
  }
  const cartId = cart.id;

  // create variants
  const digitalVariant = digitalType
    ? await prisma.productVariant.create({
        data: {
          productId,
          type: "DIGITAL",
          format,
          license,
        },
      })
    : null;

  const printVariant = printType
    ? await prisma.productVariant.create({
        data: {
          productId,
          type: "PRINT",
          format,
          size,
          material,
          frame,
        },
      })
    : null;

  const r = await prisma.cartItem.create({
    data: {
      cartId,
      productId,
      digitalVariantId: digitalVariant?.id,
      printVariantId: printVariant?.id,
      price: parseFloat(price),
      quantity,
    },
  });

  return NextResponse.json({
    message: "Item added with new variant.",
    result: {
      cartItemId: r.id,
      cartId,
      productId,
      digitalVariantId: digitalVariant?.id || null,
      printVariantId: printVariant?.id || null,
      price: parseFloat(price),
      quantity,
      digital: digitalVariant
        ? { id: digitalVariant.id, format: digitalVariant.format, license: digitalVariant.license }
        : null,
      print: printVariant
        ? {
            id: printVariant.id,
            format: printVariant.format,
            size: printVariant.size,
            material: printVariant.material,
            frame: printVariant.frame,
          }
        : null,
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
    [i.digitalVariantId, i.printVariantId].filter((v): v is string => Boolean(v))
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
    digitalVariantId = null,   // "ADD" | "REMOVE" | existing ID | null
    printVariantId   = null,   // "ADD" | "REMOVE" | existing ID | null
    updates = {},
  } = await req.json();

  /* 1️⃣  Guard clauses */
  if (!productId || (!digitalVariantId && !printVariantId)) {
    return NextResponse.json(
      { error: "Missing required fields or no variant to update." },
      { status: 400 }
    );
  }
  const fullPrice = parseFloat(updates.price);
  if (!Number.isFinite(fullPrice)) {
    return NextResponse.json(
      { error: "`updates.price` must be a valid number." },
      { status: 400 }
    );
  }

  /* 2️⃣  Locate the cart & item */
  const cart = await prisma.cart.findFirst({
    where: { OR: [{ userId }, { guestId }] },
    include: { items: { where: { productId } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Product not found in cart." }, { status: 404 });
  }

  const cartItem    = cart.items[0];
  const cartItemId  = cartItem.id;

  /* 3️⃣  Helper for later — always set the new full price */
  const setNewPrice = () =>
    prisma.cartItem.update({
      where: { id: cartItemId },
      data: { price: fullPrice },
    });

  /* 4️⃣  DIGITAL variant ops  -------------------------------------- */
  if (digitalVariantId === "REMOVE") {
    const oldId = cartItem.digitalVariantId;
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { digitalVariantId: null },
    });
    if (oldId) {
      const count = await prisma.cartItem.count({ where: { digitalVariantId: oldId } });
      if (count === 0) await prisma.productVariant.delete({ where: { id: oldId } });
    }
    await setNewPrice();
  } else if (digitalVariantId === "ADD") {
    const newDigital = await prisma.productVariant.create({
      data: {
        productId,
        type: "DIGITAL",
        format: updates.format ?? "jpg",
        license: updates.license 

      },
    });
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { digitalVariantId: newDigital.id },
    });
    await setNewPrice();
  } else if (typeof digitalVariantId === "string") {
    await prisma.productVariant.update({
      where: { id: digitalVariantId },
      data: { format: updates.format ?? undefined,license: updates.license  },
    });
    await setNewPrice();
  }

  /* 5️⃣  PRINT variant ops  ---------------------------------------- */
  if (printVariantId === "REMOVE") {
    const oldId = cartItem.printVariantId;
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { printVariantId: null },
    });
    if (oldId) {
      const count = await prisma.cartItem.count({ where: { printVariantId: oldId } });
      if (count === 0) await prisma.productVariant.delete({ where: { id: oldId } });
    }
    await setNewPrice();
  } else if (printVariantId === "ADD") {
    const newPrint = await prisma.productVariant.create({
      data: {
        productId,
        type: "PRINT",
        format:   updates.format   ?? "jpg",
        size:     updates.size     ?? undefined,
        material: updates.material ?? undefined,
        frame:    updates.frame    ?? undefined,
      },
    });
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { printVariantId: newPrint.id },
    });
    await setNewPrice();
  } else if (typeof printVariantId === "string") {
    await prisma.productVariant.update({
      where: { id: printVariantId },
      data: {
        format:   updates.format   ?? undefined,
        size:     updates.size     ?? undefined,
        material: updates.material ?? undefined,
        frame:    updates.frame    ?? undefined,
      },
    });
    await setNewPrice();
  }

  /* 6️⃣  If all variants were removed, delete the cart item */
  const finalState = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { digitalVariantId: true, printVariantId: true },
  });
  if (!finalState?.digitalVariantId && !finalState?.printVariantId) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return NextResponse.json({
      message: "Cart item removed because both variants were removed.",
    });
  }

  /* 7️⃣  Done */
  return NextResponse.json({ message: "Cart item updated successfully.", price: fullPrice });
}

