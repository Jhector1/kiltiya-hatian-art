// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { CartSelectedItem, productListSelect } from "@/types";

export const runtime = "nodejs";
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// src/app/api/cart/route.ts
// import { NextResponse, NextRequest } from "next/server";
// import { CartSelectedItem, productListSelect, type ProductListItem } from "@/types";

// export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  const digitalVariantId = searchParams.get("digitalVariantId");
  const printVariantId = searchParams.get("printVariantId");

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  // ─── 1️⃣ Existence‐check mode ─────────────────────────────────────
  if (productId && (digitalVariantId || printVariantId)) {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!cart) {
        return NextResponse.json({ inCart: false });
      }

      const where: Record<string, string> = { cartId: cart.id, productId };
      if (digitalVariantId) where.digitalVariantId = digitalVariantId;
      if (printVariantId) where.printVariantId = printVariantId;

      const item = await prisma.cartItem.findFirst({ where });
      return NextResponse.json({ inCart: Boolean(item) });
    } catch {
      return NextResponse.json({ inCart: false });
    }
  }

  // ─── 2️⃣ Full‐cart fetch (for Gallery) ──────────────────────────
  try {
    // ensure the cart exists
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) {
      // If no cart yet, nothing to show
      return NextResponse.json([] as CartSelectedItem[]);
    }

    // fetch only the products in the cart, using the same select you use elsewhere
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

    // unwrap to ProductListItem[]
    const products: CartSelectedItem[] = items.map((ci) => ({
      cartItemId: ci.id,
      cartPrice: ci.price,
      cartQuantity: ci.quantity,
      digital: ci.digitalVariant,
      print: ci.printVariant,
      productListItem: ci.product,
    }));
    console.log("produuu", products);
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/cart full-fetch failed:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const userId = searchParams.get("userId");
//   const productId = searchParams.get("productId");
//   const digitalVariantId = searchParams.get("digitalVariantId");
//   const printVariantId = searchParams.get("printVariantId");

//   if (!userId) {
//     return NextResponse.json(
//       { error: "User ID is required." },
//       { status: 400 }
//     );
//   }

//   // ─── 1️⃣ Existence check ─────────────────────────────────────────────────────
//   if (productId && (digitalVariantId || printVariantId)) {
//     try {
//       const cart = await prisma.cart.findUnique({ where: { userId } });
//       if (!cart) {
//         return NextResponse.json({ inCart: false });
//       }

//       const where: Record<string, string> = {
//         cartId: cart.id,
//         productId,
//       };
//       if (digitalVariantId) where.digitalVariantId = digitalVariantId;
//       if (printVariantId) where.printVariantId = printVariantId;

//       const item = await prisma.cartItem.findFirst({ where });

//       return NextResponse.json({ inCart: Boolean(item) });
//     } catch (err) {
//       console.error("GET /api/cart existence-check failed:", err);
//       return NextResponse.json({ inCart: false });
//     }
//   }

//   // ─── 2️⃣ Fetch full cart ────────────────────────────────────────────────────
//   try {
//     const cart = await prisma.cart.findUnique({
//       where: { userId },
//       include: {
//         items: {
//           include: {
//             product: true,
//             digitalVariant: true,
//             printVariant: true,
//           },
//         },
//       },
//     });

//     if (!cart) {
//       return NextResponse.json({ items: [] });
//     }

//     const items = cart.items.map((item) => ({
//       id: item.id,
//       productId: item.productId,
//       title: item.product?.title,
//       //  category: item.product.,
//       image: item.product?.publicId
//         ? cloudinary.url(item.product.publicId, { secure: true })
//         : "/placeholder.png",
//       description: item.product?.description,
//       price: item.price,
//       quantity: item.quantity,
//       digital: item.digitalVariant
//         ? {
//             id: item.digitalVariant.id,
//             format: item.digitalVariant.format,
//           }
//         : null,
//       print: item.printVariant
//         ? {
//             id: item.printVariant.id,
//             format: item.printVariant.format,
//             size: item.printVariant.size,
//             material: item.printVariant.material,
//             frame: item.printVariant.frame,
//           }
//         : null,
//     }));
//     console.log(items)
//     return NextResponse.json({ items });
//   } catch (err) {
//     console.error("GET /api/cart full-fetch failed:", err);
//     return NextResponse.json(
//       { error: "Internal server error." },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/cart/route.ts
export async function POST(request: NextRequest) {
  const {
    userId,
    productId,
    digitalType, // 'Digital' or 'Print'
    printType,
    price,
    quantity = 1,
    format, // e.g. 'jpg' or 'png'
    size = null, // e.g. '11x14 in'
    material = null,
    frame = null,
  } = await request.json();

  if (
    !userId ||
    !productId ||
    (printType == null && digitalType == null) || // both undefined or null
    price == null ||
    format == null
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    // 1) ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    const cartId = cart.id;
    // 2) create a new variant ON THE FLY
    let digitalVariant = null;
    // 2) create a new variant ON THE FLY
    let printVariant = null;

    if (digitalType) {
      digitalVariant = await prisma.productVariant.create({
        data: {
          productId,
          type: digitalType.toUpperCase() as "DIGITAL" | "PRINT",
          format,
        },
      });
    }
    // 2) create a new variant ON THE FLY
    if (printType) {
      printVariant = await prisma.productVariant.create({
        data: {
          productId,
          type: printType.toUpperCase() as "DIGITAL" | "PRINT",
          format,
          size: printType === "Print" ? size : null,
          material: printType === "Print" ? material : null,
          frame: printType === "Print" ? frame : null,
        },
      });
    }
    // 3) create the cart-item pointing to that variant
    const data = {
      cartId,
      productId,
      digitalVariantId: digitalVariant?.id,
      printVariantId: printVariant?.id,
      price: parseFloat(price),
      quantity,
    };
    await prisma.cartItem.create({
      data: data,
    });

    return NextResponse.json({
      message: "Item added with new variant.",
      result: data,
    });
  } catch (err) {
    console.error("POST /api/cart failed:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const {
    userId,
    productId,
    digitalVariantId = null,
    printVariantId = null,
  } = await request.json();
  console.log(userId, productId, digitalVariantId, printVariantId);

  if (!userId || !productId || (!digitalVariantId && !printVariantId)) {
    return NextResponse.json(
      { error: "Missing required fields or no variant selected." },
      { status: 400 }
    );
  }

  try {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    console.log(cart);
    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }
    const cartId = cart.id;

    const where: Record<string, string> = { cartId, productId };
    if (digitalVariantId) where.digitalVariantId = digitalVariantId;
    if (printVariantId) where.printVariantId = printVariantId;

    const item = await prisma.cartItem.findFirst({ where });
    console.log("item", item, where);
    if (!item) {
      return NextResponse.json({ message: "Item not in cart." });
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
    if (digitalVariantId)
      await prisma.productVariant.delete({ where: { id: digitalVariantId } });
    if (printVariantId)
      await prisma.productVariant.delete({ where: { id: printVariantId } });

    return NextResponse.json({ message: "Item removed from cart." });
  } catch (err) {
    console.error("DELETE /api/cart failed:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// PATCH /api/cart

export async function PATCH(request: NextRequest) {
  const {
    userId,
    productId,
    digitalVariantId = null,
    printVariantId = null,
    updates = {},
  } = await request.json();

  if (!userId || !productId || (!digitalVariantId && !printVariantId)) {
    return NextResponse.json(
      { error: "Missing required fields or no variant to update." },
      { status: 400 }
    );
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    const cartItem = cart.items.find((item) => item.productId === productId);
    if (!cartItem) {
      return NextResponse.json(
        { error: "Product not found in user's cart." },
        { status: 403 }
      );
    }

    // === DIGITAL VARIANT ===
    if (
      typeof digitalVariantId === "string" &&
      digitalVariantId.toUpperCase() === "ADD"
    ) {
      const newDigital = await prisma.productVariant.create({
        data: {
          productId,
          type: "DIGITAL",
          format: updates.format ?? "jpg",
        },
      });

      // 🔁 Update cartItem to link to new digital variant
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { digitalVariantId: newDigital.id },
      });
    } else if (digitalVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: digitalVariantId },
        select: { productId: true },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json(
          { error: "Invalid digital variant." },
          { status: 403 }
        );
      }

      await prisma.productVariant.update({
        where: { id: digitalVariantId },
        data: {
          format: updates.format ?? undefined,
        },
      });
    }

    // === PRINT VARIANT ===
    if (
      typeof printVariantId === "string" &&
      printVariantId.toUpperCase() === "ADD"
    ) {
      const newPrint = await prisma.productVariant.create({
        data: {
          productId,
          type: "PRINT",
          format: updates.format ?? "jpg",
          size: updates.size ?? undefined,
          material: updates.material ?? undefined,
          frame: updates.frame ?? undefined,
        },
      });

      // 🔁 Update cartItem to link to new print variant
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { printVariantId: newPrint.id },
      });
    } else if (printVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: printVariantId },
        select: { productId: true },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json(
          { error: "Invalid print variant." },
          { status: 403 }
        );
      }

      await prisma.productVariant.update({
        where: { id: printVariantId },
        data: {
          format: updates.format ?? undefined,
          size: updates.size ?? undefined,
          material: updates.material ?? undefined,
          frame: updates.frame ?? undefined,
        },
      });
    }

    return NextResponse.json({
      message: "Variant(s) updated or created and linked to cart.",
    });
  } catch (err) {
    console.error("PATCH /api/cart failed:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
