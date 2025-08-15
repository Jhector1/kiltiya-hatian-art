import { ProductVariant } from "@prisma/client";
import ProductDetail from "./app/store/[id]/page";

export type MaterialOption = {
  /**
   * A human-readable name for the material
   * (e.g. "Matte Paper", "Canvas")
   */
  label: string;

  /**
   * A price multiplier for that material
   * (e.g. 1 for matte, 1.5 for canvas)
   */
  multiplier: number;

  /**
   * URL or local path to a small thumbnail image
   * used in the material picker
   */
  thumbnail: string;
};

export type FrameOption = {
  /**
   * A human-readable name for the frame style
   * (e.g. "Black Wood", "Natural Wood")
   */
  label: string;

  /**
   * A CSS border string used when previewing
   * (e.g. "8px solid #111" for a black wood frame)
   */
  border: string;
  multiplier: number;
};

export type Format = { type: string; resolution: string; multiplier: number };
export type ApiProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  thumbnails: string[];
  formats: string[];
};
export interface AddToCartPayload {
  userId?: string;
  productId: string;
  type: string;
  price: string;
}
export type MyProduct = {
  id: string;
  title: string;
  image: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variants?: ProductVariant[];
};
export interface AddOptions {
  digitalVariantId?: string;
  printVariantId?: string;
  digital: boolean;
  print?: boolean;
  // printPrice: number;
  // digitalPrice: number;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface Credentials {
  email: string;
  password: string;
}
export interface SignupData extends Credentials {
  name: string;
}

export interface DigitalDetail {
  format: string;
}
export interface PrintDetail extends DigitalDetail {
  size: string;
  material: string;
  frame: string;
  quantity: number;
}
export interface ProductDetail {
  digital: DigitalDetail;
  print: PrintDetail;
}

export interface OrderList {
  customerId: string;
  cartProductList: OrderProductItem[];
}

export interface OrderProductItem {
  quantity: number;
  myProduct: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;

    digital?: {
      id: string;
      format: string;
      license?: string;
    };

    print?: {
      id: string;
      format: string;
      size?: string;
      material?: string;
      frame?: string;
    };
  };
  cartItemId: string;
}

// File: src/lib/types.ts
import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export const productListSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  thumbnails: true,
  publicId: true,
  svgPreview: true,

  category: { select: { name: true } },
} as const;

export type ProductListItem = Prisma.ProductGetPayload<{
  select: typeof productListSelect;
}>;
export type CartSelectedItem = ProductListItem & {
  cartItemId: string;
  cartPrice: number;
  cartQuantity: number;
  digital: ProductVariant | null;
  print: ProductVariant | null;
   designId?: string | null;    // NEW
  previewUrl?: string | null;  // NE
    isUserDesign?: boolean;

};
// exactly the return type of
//   prisma.review.findMany({ include: { user: true } })
export type ProductReview = Prisma.ReviewGetPayload<{
  include: { user: true };
}>;

// src/types/product.ts
import type { Review } from "@prisma/client";
import { StyleState } from "./components/studio/types";

export type VariantWithInCart = ProductVariant & {
  /** true if this variant’s id was found in the user’s cart */
  inUserCart: boolean;
};

export interface ProductDetailResult {
  /** UUID of the product */
  id: string;
  /** FK to Category.id */
  category: string;
  title: string;
  description: string;
  price: number;
  /** first thumbnail or placeholder */
  imageUrl: string;
  thumbnails: string[];
  formats: string[];
  variants: VariantWithInCart[];
  svgPreview: string;
  reviews: Review[];
}
export type CartUpdates = Record<string, string | number | boolean | null>;
export interface HomeCategory {
  slug: string;
  title: string;
  image: string;
  gradient: string;
}
// --- Types ----------------------------------------------------------------
export type VariantType = "DIGITAL" | "PRINT" | "ALL";

export type CollectionItem = {
  id: string;
  type: VariantType;
  product: {
    title: string;
    thumbnails: string[];
  };
  digitalVariant?: { url: string } | null;
  printVariant?: { url: string } | null;
  order: { placedAt: string; stripeSessionId: string };
};

export type ProductListAndOrderCount = ProductListItem & {
  purchaseCount: number;
  artistName: string;
  dimensions: string;
  originalPrice?: number;
  description: string;
};
export type AddToCartResponse = {
  result?: {
    cartItemId?: string;
    digitalVariantId?: string;
    printVariantId?: string;
      designId?: string | null;    // NEW
  previewUrl?: string | null;  // NEW (snapshot URL)
  };
};

export type LicenseOption = {
     type: string,
    name: string,
    price: number,
    description: string,
  
}




//USer design
export type DesignPayload = {
  id?: string;                 // existing design id (if any)
  style?: StyleState;                 // your StyleState
  defs?: string | null;        // serialized <defs> (or JSON of defsMap)
  previewDataUrl?: string;     // data:image/webp;base64,...
};

export type AddToCartBody = {
  productId: string;
  digitalType?: "DIGITAL" | null;
  printType?: "PRINT" | null;
  price: number;
  quantity?: number;
  format?: string;
  size?: string | null;
  material?: string | null;
  frame?: string | null;
  license?: string;

  design?: DesignPayload;      // 👈 new
  snapshot?: boolean;          // default true (store styleSnapshot)
};