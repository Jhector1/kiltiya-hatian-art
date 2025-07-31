import { loadStripe } from "@stripe/stripe-js";
import {
  ProductDetailResult,
  AddOptions,
  LicenseOption,
  FrameOption,
  MaterialOption,
} from "@/types";

interface SizeOption {
  label: string;
  multiplier: number;
}

interface CheckoutProps {
  user: { id: string } | null;
  guestId: string | null;
  inCart: any;
  addToCart: (
    productId: string,
    digitalType: string | null,
    printType: string | null,
    finalPrice: number,
    format: string,
    size: string,
    material: string,
    frame: string,
    quantity: number
  ) => Promise<any>;
  product: ProductDetailResult;
  options: AddOptions;
  format: string;
  size: SizeOption;
  material: MaterialOption;
  frame: FrameOption | null;
  license: LicenseOption;
  setModalOpen: (isOpen: boolean) => void;
  id: string;
}

export async function handleCheckout({
  user,
  guestId,
  inCart,
  addToCart,
  product,
  options,
  format,
  size,
  material,
  frame,
  license,
  setModalOpen,
  id,
}: CheckoutProps): Promise<void> {
  if (!user && !guestId) {
    setModalOpen(true);
    return;
  }

  let data: any = null;

  if (!inCart) {
    data = await addToCart(
      id,
      options.digital ? "Digital" : null,
      options.print ? "Print" : null,
      product.price + license.price,
      format,
      size.label,
      material?.label || "",
      frame?.label || "",
      1
    );
  }

  const productItem = {
    quantity: 1,
    myProduct: {
      id: product.id,
      title: product.title,
      price: product.price + license.price,
      imageUrl: product.imageUrl,
      digital: options.digital
        ? { id: options.digitalVariantId || data?.result?.digitalVariantId, format }
        : undefined,
      print: options.print
        ? {
            id: options.printVariantId || data?.result?.printVariantId,
            format,
            size: size.label,
            material: material.label,
            frame: frame?.label || "",
          }
        : undefined,
    },
  };

  // ✅ No need to send userId or guestId — server will handle that
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartProductList: [productItem] }),
  });

  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Checkout session failed");

  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  if (!stripe) throw new Error("Stripe failed to load");

  await stripe.redirectToCheckout({ sessionId: resData.sessionId });
}
