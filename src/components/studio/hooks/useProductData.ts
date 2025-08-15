"use client";

import { useUser } from "@/contexts/UserContext";
import { AddOptions, CartSelectedItem, ProductDetailResult } from "@/types";
import { fetchProductById } from "@/utils/fetchProductById";
import { useEffect, useMemo, useState } from "react";
import { useUnifiedPurchaseFlow } from "./useUnifiedPurchaseFlow";
import { usePriceCalculator } from "@/hooks/usePriceCalculator";
import { allFrames, allLicenses, allMaterials, allSizes } from "@/data/helpers";
import { useCart } from "@/contexts/CartContext";
import { handleCheckout } from "@/utils/handleCheckout";

export function useProductData({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductDetailResult | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(
    null
  );
  const [options, setOptions] = useState<AddOptions>({
    digital: false,
    print: false,
    digitalVariantId: "",
    printVariantId: "",
  });

  const { user, guestId } = useUser();
  const { cart, loadingAdd, addToCart, updateCart, removeFromCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    fetchProductById(productId.toString(), user?.id || guestId || "")
      .then((p) => {
        setProduct(p);
        setPreview({ src: p.imageUrl || "", alt: p.title });

        const printVariant = p.variants?.find(
          (v) => v.type?.toUpperCase() === "PRINT" && v.inUserCart
        );
        const digitalVariant = p.variants?.find(
          (v) => v.type?.toUpperCase() === "DIGITAL" && v.inUserCart
        );

        setOptions({
          digital: !!digitalVariant,
          print: !!printVariant,
          digitalVariantId: digitalVariant?.id || "",
          printVariantId: printVariant?.id || "",
        });
      })
      .catch(console.error);
  }, [productId, user, guestId]);

  const productFormats = product?.formats ?? [];

  const formats = useMemo(() => {
    const seen = new Set<string>();
    return productFormats
      .map((url) => {
        const ext = url.split(".").pop() || "";
        return { type: ext, resolution: "n/a", multiplier: 1 };
      })
      .filter((f) => {
        if (seen.has(f.type)) return false;
        seen.add(f.type);
        return true;
      });
  }, [productFormats]);
// at top (only if you'll use the sessionId fallback here)
// import { loadStripe } from "@stripe/stripe-js";

// ...

const handleCheckoutAction = async (opts?: {
  /** If false, don't open any UI; just return the session so caller can handle it */
  openUI?: boolean;
  /** Optional: where to send user after success */
  exportHref?: string;
  /** Optional success hook */
  onPurchaseComplete?: () => void;
  /** Optional: show your login/auth */
  openAuth?: () => void;
}) => {
  if (!product) return { status: "error", message: "Product not loaded" } as const;

  const result = await handleCheckout({
    user,
    guestId,
    inCart,
    addToCart,
    product,
    options: { ...options, digital: wantDigital, print: wantPrint },
    format: product?.formats[0]?.split(".").pop() || "",
    size,
    material,
    frame,
    license,
    // IMPORTANT: don't pass setModalOpen here; caller (modal/page) will close/open UI
    finalPrice: String(finalPriceUI),
    exportHref: opts?.exportHref,
    onPurchaseComplete: opts?.onPurchaseComplete,
    openUI: false, // ← let caller decide when/how to open checkout UI
  });

  // Auth gate
  if ((result as any).status === "auth_required") {
    opts?.openAuth?.();
    return result;
  }

  // Optionally open UI here (e.g., when called from a page, not a modal)
  if (opts?.openUI !== false && (result as any).status === "ok") {
    // Give React a tick in case caller just closed something
    await new Promise((r) => requestAnimationFrame(r));

    if ((result as any).flow === "embedded") {
      window.dispatchEvent(
        new CustomEvent("open-checkout", {
          detail: {
            clientSecret: (result as any).clientSecret,
            exportHref: opts?.exportHref,
            onPurchaseComplete: opts?.onPurchaseComplete,
          },
        })
      );
    } else if ((result as any).flow === "redirect") {
      window.location.href = (result as any).url;
    } else if ((result as any).flow === "sessionId") {
      const stripe = await import("@stripe/stripe-js").then((m) =>
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );
      await stripe?.redirectToCheckout({ sessionId: (result as any).sessionId });
    }
  }

  return result;
};


  const stubProduct = useMemo(
    () =>
      ({
        id: productId,
        imageUrl: "",
        title: "",
        description: "",
        formats: [],
        baseDigitalPrice: 0,
        basePrintPrice: 0,
        variants: [],
        category: "",
        svgPreview: null,
      } as unknown as ProductDetailResult),
    [productId]
  );
  const base = product?.price ?? 0;

  /** Shared model (persist so selections survive refresh and sync with modal) */
  const flow = useUnifiedPurchaseFlow({
    productId,
    persist: false,
    defaultVariant: "digital",
    digitalSupported: true,
    printSupported: true,
    baseDigitalPrice: base,
    basePrintPrice: base,
    catalogs: {
      licenses: allLicenses,
      sizes: allSizes,
      materials: allMaterials,
      frames: allFrames,
    },
    defaultFormat: formats[0]?.type || "png",
  });

  const {
    wantDigital,
    setWantDigital,
    wantPrint,
    setWantPrint,
    license,
    setLicense,
    size,
    setSize,
    isCustom,
    setIsCustom,
    customSize,
    setCustomSize,
    material,
    setMaterial,
    frame,
    setFrame,
    finalPrice, // ✅ authoritative total from flow
  } = flow;

  /** Use your page calculator for itemized pricing (cart updates etc.) */
  const calculatePrice = usePriceCalculator(
    product ?? stubProduct,
    size,
    material,
    frame,
    { ...options, digital: wantDigital, print: wantPrint },
    customSize,
    isCustom,
    license
  );

  const inCart: CartSelectedItem | undefined = product
    ? cart.find((item) => item.id === product.id)
    : undefined;

  // Seed selections from cart when product loads
  useEffect(() => {
    if (!product) return;

    setWantDigital(Boolean(options.digital));
    setWantPrint(Boolean(options.print));

    const dig = product.variants?.find(
      (v) => v.type?.toUpperCase() === "DIGITAL" && v.inUserCart
    );
    const pr = product.variants?.find(
      (v) => v.type?.toUpperCase() === "PRINT" && v.inUserCart
    );

    const byType = (t?: string | null) =>
      allLicenses.find((l) => l.type.toLowerCase() === (t || "").toLowerCase());
    const byLabel = <T extends { label: string }>(
      arr: T[],
      lbl?: string | null
    ) => arr.find((a) => a.label.toLowerCase() === (lbl || "").toLowerCase());

    if (dig?.license) {
      const lic = byType(dig.license);
      if (lic) setLicense(lic);
    }
    if (pr?.size) {
      const sz = byLabel(allSizes, pr.size);
      if (sz) {
        setSize(sz);
        setIsCustom(sz.label.toLowerCase() === "custom");
      }
    }
    if (pr?.material) {
      const m = byLabel(allMaterials, pr.material);
      if (m) setMaterial(m);
    }
    if (typeof pr?.frame !== "undefined") {
      const f = pr?.frame ? byLabel(allFrames, pr.frame) : null;
      setFrame(f ?? null);
    }
  }, [
    product,
    options.digital,
    options.print,
    setWantDigital,
    setWantPrint,
    setLicense,
    setSize,
    setIsCustom,
    setMaterial,
    setFrame,
  ]);
  //     const calculatePrice = usePriceCalculator(
  //     product ?? stubProduct,
  //     size,
  //     material,
  //     frame,
  //     { ...options, digital: wantDigital, print: wantPrint },
  //     customSize,
  //     isCustom,
  //     license
  //   );

  const digitalPriceNum =
    (wantDigital ? Number(calculatePrice("Digital").digitalPrice) : 0) || 0;

  const printPriceNum =
    (wantPrint ? Number(calculatePrice("Print").printPrice) : 0) || 0;

  const finalPriceUI = digitalPriceNum + printPriceNum;

  return {
    product,
    inCart,
    loadingAdd,

    // selections
    options,
    setOptions,
    size,
    setSize,
    customSize,
    setCustomSize,
    isCustom,
    setIsCustom,
    material,
    setMaterial,
    frame,
    setFrame,
    license,
    setLicense,
    wantDigital,
    setWantDigital,
    wantPrint,
    setWantPrint,
    finalPriceUI,

    // pricing
    calculatePrice,
    finalPrice,
    handleCheckoutAction,

    // cart
    addToCart,
    removeFromCart,
    updateCart,

    // media
    preview,
    setPreview,
  };
}
