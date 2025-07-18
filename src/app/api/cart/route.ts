// File: src/app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth/next";
import { PrismaClient }             from "@prisma/client";
import { v2 as cloudinary }         from "cloudinary";
import { CartSelectedItem, productListSelect } from "@/types";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─── Helper: require auth and return userId or throw 401 ─────────────
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401 }
    );
  }
  return session.user.id;
}

// ─── GET /api/cart?productId=&digitalVariantId=&printVariantId= ─────
export async function GET(req: NextRequest) {
  const userId = await requireUser();
  const url    = new URL(req.url);
  const productId        = url.searchParams.get("productId");
  const digitalVariantId = url.searchParams.get("digitalVariantId");
  const printVariantId   = url.searchParams.get("printVariantId");

  // 1️⃣ existence-check mode
  if (productId && (digitalVariantId || printVariantId)) {
    const cart = await prisma.cart.findUnique({
      where:  { userId },
      select: { id: true },
    });
    if (!cart) {
      return NextResponse.json({ inCart: false });
    }
    const where: Record<string,string> = { cartId: cart.id, productId };
    if (digitalVariantId) where.digitalVariantId = digitalVariantId;
    if (printVariantId)   where.printVariantId   = printVariantId;
    const item = await prisma.cartItem.findFirst({ where });
    return NextResponse.json({ inCart: Boolean(item) });
  }

  // 2️⃣ full-cart fetch
  const cart = await prisma.cart.findUnique({
    where:  { userId },
    select: { id: true },
  });
  if (!cart) {
    return NextResponse.json([] as CartSelectedItem[]);
  }
  const items = await prisma.cartItem.findMany({
    where:  { cartId: cart.id },
    select: {
      id:             true,
      price:          true,
      quantity:       true,
      printVariant:   true,
      digitalVariant: true,
      product:        { select: productListSelect },
    },
  });
  const products: CartSelectedItem[] = items.map(ci => ({
    cartItemId:      ci.id,
    cartPrice:       ci.price,
    cartQuantity:    ci.quantity,
    digital:         ci.digitalVariant,
    print:           ci.printVariant,
    productListItem: ci.product,
  }));
  return NextResponse.json(products);
}

// ─── POST /api/cart ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = await requireUser();
  const {
    productId,
    digitalType, // 'Digital' or 'Print'
    printType,
    price,
    quantity  = 1,
    format='png',
    size     = null,
    material = null,
    frame    = null,
  } = await req.json();

  console.log(productId, digitalType, printType, price, format)

  if (!productId || (!digitalType && !printType) || price == null) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  // ensure cart exists
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  const cartId = cart.id;

  // create variants on-the-fly
  let digitalVariant = null;
  if (digitalType) {
    digitalVariant = await prisma.productVariant.create({
      data: {
        productId,
        type:   digitalType.toUpperCase() as "DIGITAL" | "PRINT",
        format,
      },
    });
  }
  let printVariant = null;
  if (printType) {
    printVariant = await prisma.productVariant.create({
      data: {
        productId,
        type:     printType.toUpperCase() as "DIGITAL" | "PRINT",
        format,
        size:     printType === "Print" ? size : null,
        material: printType === "Print" ? material : null,
        frame:    printType === "Print" ? frame : null,
      },
    });
  }

  // add to cart
  const data = {
    cartId,
    productId,
    digitalVariantId: digitalVariant?.id,
    printVariantId:   printVariant?.id,
    price:            parseFloat(price),
    quantity,
  };
  await prisma.cartItem.create({ data });

  return NextResponse.json({
    message: "Item added with new variant.",
    result:  data,
  });
}

// ─── DELETE /api/cart ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const userId    = await requireUser();
  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json(
      { error: "Missing required field: productId." },
      { status: 400 }
    );
  }

  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return NextResponse.json({ error: "Cart not found." }, { status: 404 });
  }
  const cartId = cart.id;

  // find & delete items and any created variants
  const items = await prisma.cartItem.findMany({ where: { cartId, productId } });
  const variantIds = items.flatMap(i =>
    [i.digitalVariantId, i.printVariantId].filter((v): v is string => Boolean(v))
  );
  await prisma.cartItem.deleteMany({ where: { cartId, productId } });
  if (variantIds.length) {
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  }

  return NextResponse.json({
    message: `Removed ${items.length} item(s) and ${variantIds.length} variant(s).`,
  });
}

// ─── PATCH /api/cart ────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const userId = await requireUser();
  const {
    productId,
    digitalVariantId = null,
    printVariantId   = null,
    updates          = {},
  } = await req.json();

  if (!productId || (!digitalVariantId && !printVariantId)) {
    return NextResponse.json(
      { error: "Missing required fields or no variant to update." },
      { status: 400 }
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { where: { productId } } },
  });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { error: "Product not found in user's cart." },
      { status: 404 }
    );
  }
  const cartItem = cart.items[0];

  // digital variant logic
if (typeof digitalVariantId === "string" && digitalVariantId.toUpperCase() === "ADD") {
    const newDigital = await prisma.productVariant.create({
      data: {
        productId,
        type:   "DIGITAL",
        format: updates.format ?? "jpg",
      },
    });
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data:  { digitalVariantId: newDigital.id },
    });
} else if (typeof digitalVariantId === "string") {
    const variant = await prisma.productVariant.findUnique({ where: { id: digitalVariantId } });
    if (!variant || variant.productId !== productId) {
      return NextResponse.json({ error: "Invalid digital variant." }, { status: 403 });
    }
    await prisma.productVariant.update({
      where: { id: digitalVariantId },
      data:  { format: updates.format ?? undefined },
    });
  }

  // print variant logic
if (typeof printVariantId === "string" && printVariantId.toUpperCase() === "ADD") {
    const newPrint = await prisma.productVariant.create({
      data: {
        productId,
        type:     "PRINT",
        format:   updates.format ?? "jpg",
        size:     updates.size ?? undefined,
        material: updates.material ?? undefined,
        frame:    updates.frame ?? undefined,
      },
    });
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data:  { printVariantId: newPrint.id },
    });
} else if (typeof printVariantId === "string") {
    const variant = await prisma.productVariant.findUnique({ where: { id: printVariantId } });
    if (!variant || variant.productId !== productId) {
      return NextResponse.json({ error: "Invalid print variant." }, { status: 403 });
    }
    await prisma.productVariant.update({
      where: { id: printVariantId },
      data:  {
        format:   updates.format ?? undefined,
        size:     updates.size   ?? undefined,
        material: updates.material ?? undefined,
        frame:    updates.frame  ?? undefined,
      },
    });
  }

  return NextResponse.json({ message: "Variant(s) updated or created and linked to cart." });
}
