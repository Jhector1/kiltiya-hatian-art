// src/components/studio/ui/PurchaseArtModal.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

import ProductConfigurator from "@/components/product/detail/ProductConfigurator";
import { allFrames, allLicenses, allMaterials, allSizes } from "@/data/helpers";

import type { LicenseOption, MaterialOption, FrameOption } from "@/types";
import type { SizeOption } from "@/components/shared/core/SizeSelectorCore";

import { useProductData } from "@/components/studio/hooks/useProductData";

type RequiredDesignPayload = {
  id?: string;
  style: any;
  defs?: string | null;
};

type DigitalOpts = { format: string; license?: string };
type PrintOpts = {
  format: string;
  size?: string | null;
  material?: string | null;
  frame?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  busy?: boolean;

  productId: string;
  imageSrc: string;

  // optional catalogs (we keep your defaults so it matches the page)
  licenses?: LicenseOption[];
  optionSizes?: SizeOption[];
  materials?: MaterialOption[];
  frames?: FrameOption[];

  // defaults (optional)
  defaultVariant?: "digital" | "print";

  // enable/disable paths
  digital?: DigitalOpts | null; // prefill (format, license?)
  print?: PrintOpts | null; // prefill (format)

  // design flow
  design: RequiredDesignPayload;
  getPreviewDataUrl: () => Promise<string | null>;

  // checkout
  onCheckout: (opts: {
    variant: "digital" | "print";
    quantity: number;
    productId: string;
    price: number;
    digital?: DigitalOpts | null;
    print?: PrintOpts | null;
    design: RequiredDesignPayload;
  }) => Promise<void> | void;

  snapshotCartItem?: boolean;
  showFormat?: boolean; // if you don't want to change format in modal, pass false
};

export default function PurchaseArtModal({
  open,
  onClose,
  busy = false,
  onCheckout,

  productId,
  imageSrc,

  licenses: licensesProp = allLicenses,
  optionSizes: optionSizesProp = allSizes,
  materials = allMaterials,
  frames: framesProp = allFrames,

  defaultVariant = "digital",
  digital = { format: "png", license: "personal" },
  print = { format: "jpg" },

  design,
  getPreviewDataUrl,

  snapshotCartItem = true,
  showFormat = false, // modal usually doesn’t need to change format
}: Props) {
  const portalEl = useRef<HTMLElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(imageSrc || "");

  // Use the same data/state/pricing as the Product page
  const {
    product,
    // unified selections (shared with ProductConfigurator)
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
    handleCheckoutAction,
    license,
    setLicense,
    wantDigital,
    setWantDigital,
    wantPrint,
    setWantPrint,
    inCart,
    removeFromCart,
    // pricing & calculator (identical to ProductDetail)
    calculatePrice,
    finalPriceUI, // ✅ this is the authoritative total used on the page
  } = useProductData({ productId });

  // Cart API used only to add with DESIGN payload
  const cartApi = useCart() as any;
  useEffect(() => {
    let cancelled = false;
    if (!open) return;

    (async () => {
      try {
        const dataUrl = await getPreviewDataUrl?.();
        if (!cancelled && dataUrl) setPreviewSrc(dataUrl);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [open, getPreviewDataUrl]);
  // Portals & a11y
  useEffect(() => {
    portalEl.current = document.body;
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) setErr(null);
  }, [open]);

  // Seed variant default the first time modal opens
  // useEffect(() => {
  //   if (!open) return;
  //   if (defaultVariant === "digital") {
  //     setWantDigital(true);
  //     setWantPrint(false);
  //   } else if (defaultVariant === "print") {
  //     setWantDigital(false);
  //     setWantPrint(true);
  //   }
  // }, [open, defaultVariant, setWantDigital, setWantPrint]);

  // Helper: capture a fresh preview for design snapshot
  const buildDesignWithPreview = useCallback(async (): Promise<
    RequiredDesignPayload & { previewDataUrl?: string }
  > => {
    const previewDataUrl = (await getPreviewDataUrl?.()) ?? undefined;
    return {
      id: design?.id,
      style: design.style,
      defs: design.defs ?? null,
      ...(previewDataUrl ? { previewDataUrl } : {}),
    };
  }, [design, getPreviewDataUrl]);

  const isBusy = busy || adding;

  // The modal doesn’t mutate cart variants while toggling (we pass `inCart={null}` below),
  // so the only cart call here is addToCartWithDesign on submit.

  const handleAddToCart = useCallback(async () => {
    if (!product) return; // guard while loading
    if (!wantDigital && !wantPrint) {
      setErr("Select at least one option (Digital or Print).");
      return;
    }
    if (typeof cartApi?.addToCartWithDesign !== "function") {
      setErr(
        "CartContext.addToCartWithDesign is required for design purchases."
      );
      return;
    }

    setAdding(true);
    setErr(null);
    try {
      if (!inCart) {
        const designPayload = await buildDesignWithPreview();

        // Your backend expects one "format" field; prefer digital.format if present
        const chosenFormat =
          digital?.format ??
          print?.format ??
          (product.formats[0]?.split(".").pop() || "png");

        await cartApi.addToCartWithDesign({
          productId,
          digitalType: wantDigital ? "DIGITAL" : null,
          printType: wantPrint ? "PRINT" : null,
          price: finalPriceUI, // ✅ same math as ProductDetail
          quantity: 1,
          format: chosenFormat,
          size: wantPrint ? size?.label ?? null : null,
          material: wantPrint ? material?.label ?? null : null,
          frame: wantPrint ? frame?.label ?? null : null,
          license: wantDigital ? license?.type : license?.type, // snapshot license anyway
          design: designPayload, // include live preview snapshot
          snapshot: snapshotCartItem,
        });

        onClose();
      } else {
        await removeFromCart(
          product.id,
          options.digitalVariantId!,
          options.printVariantId!
        );
      }
    } catch (e: any) {
      console.error("Add to cart failed:", e);
      setErr(e?.message || "Failed to add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  }, [
    product,
    productId,
    wantDigital,
    wantPrint,
    size,
    material,
    frame,
    license,
    digital?.format,
    print?.format,
    finalPriceUI,
    cartApi,
    buildDesignWithPreview,
    onClose,
    snapshotCartItem,
    inCart,
    options.digitalVariantId,
    options.printVariantId,
    removeFromCart,
  ]);

  // const handleBuyNow = useCallback(async () => {
  //   if (!product) return;
  //   if (!wantDigital && !wantPrint) {
  //     setErr("Select at least one option (Digital or Print).");
  //     return;
  //   }
  //   try {
  //     const compatVariant: "digital" | "print" = wantDigital
  //       ? "digital"
  //       : "print";
  //     await onCheckout({
  //       variant: compatVariant,
  //       quantity: 1,
  //       productId,
  //       price: finalPriceUI, // ✅ same total
  //       digital: wantDigital
  //         ? { format: digital?.format ?? "png", license: license.type }
  //         : null,
  //       print: wantPrint
  //         ? {
  //             format: print?.format ?? "jpg",
  //             size: size.label,
  //             material: material.label,
  //             frame: frame?.label ?? null,
  //           }
  //         : null,
  //       design,
  //     });
  //   } catch (e: any) {
  //     console.error("Checkout failed:", e);
  //     setErr(e?.message || "Checkout failed. Please try again.");
  //   }
  // }, [
  //   product,
  //   productId,
  //   wantDigital,
  //   wantPrint,
  //   size,
  //   material,
  //   frame,
  //   license,
  //   digital?.format,
  //   print?.format,
  //   finalPriceUI,
  //   onCheckout,
  //   design,
  // ]);

  // Render
  const disabled = isBusy || (!wantDigital && !wantPrint);

  const portalTarget = portalEl.current;
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-[60] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="purchase-art-title"
                className="relative w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10
                           max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto"
                initial={{ y: 20, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0, scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3
                    id="purchase-art-title"
                    className="text-base font-semibold"
                  >
                    Purchase this customized artwork
                  </h3>
                  <button
                    onClick={onClose}
                    className="rounded-md p-1 text-black/60 hover:bg-zinc-100 hover:text-black/80"
                    aria-label="Close"
                    ref={firstFocusRef}
                  >
                    ✕
                  </button>
                </div>

                {/* 👇 SAME configurator UI/behavior as the Product page */}
                {product && (
                  <div className="space-y-5">
                    <ProductConfigurator
                      showFormat={false}
                      // often false for modal
                      previewImageSrc={previewSrc}
                      product={product}
                      inCart={inCart || null}
                      materials={materials} // ← important: prevents PATCH logic
                      frames={framesProp}
                      licenses={licensesProp}
                      optionSizes={optionSizesProp}
                      formatData={{ options, setOptions }}
                      licenseData={{ license, setLicense }}
                      sizeData={{
                        size,
                        setSize,
                        customSize,
                        setCustomSize,
                        isCustom,
                        setIsCustom,
                      }}
                      materialData={{ material, setMaterial }}
                      frameData={{ frame, setFrame }}
                      selection={{
                        wantDigital,
                        setWantDigital,
                        wantPrint,
                        setWantPrint,
                      }}
                      calculatePrice={calculatePrice}
                      finalPrice={finalPriceUI}
                    />
                  </div>
                )}

                {/* Error */}
                {err && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {err}
                  </div>
                )}

                {/* Actions */}
                <div className="py-5 mt-3 sticky bottom-0 flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end bg-white">
                  <button
                    onClick={handleAddToCart}
                    disabled={isBusy || (!wantDigital && !wantPrint)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-emerald-600/20",
                      "bg-white text-emerald-700 hover:bg-emerald-50",
                      disabled ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-busy={isBusy}
                  >
                    {adding
                      ? inCart
                        ? "Removing…"
                        : "Adding…"
                      : inCart
                      ? "Remove from Cart"
                      : "Add  to Cart"}

                    {/* {adding ? "Adding…" : "Add to cart"} */}
                  </button>

                  <button
                    onClick={async ()=>{    const result = await handleCheckoutAction({ openUI: false, exportHref: "/account/orders" });

    if (result.status === "error") {
      setErr(result.message || "Checkout failed. Please try again.");
      return;
    }
    if (result.status === "auth_required") {
      // show login if you want
      return;
    }
    // Close THIS modal so the overlay never sits above Stripe
    onClose();
    await new Promise((r) => requestAnimationFrame(r));

    if (result.flow === "embedded") {
      window.dispatchEvent(
        new CustomEvent("open-checkout", {
          detail: { clientSecret: result.clientSecret, exportHref: "/account/orders" },
        })
      );
    } else if (result.flow === "redirect") {
      window.location.href = result.url;
    } else if (result.flow === "sessionId") {
      const stripe = await import("@stripe/stripe-js").then((m) =>
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );
      await stripe?.redirectToCheckout({ sessionId: result.sessionId });
    }

                    }}
                    disabled={isBusy || (!wantDigital && !wantPrint)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm font-medium",
                      !disabled
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-emerald-300 text-white hover:bg-emerald-300",
                      disabled ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-busy={isBusy}
                  >
                    {busy
                      ? "Processing…"
                      : `Buy now — $${finalPriceUI.toFixed(2)}`}
                  </button>

                  <button
                    onClick={onClose}
                    className="rounded-xl px-3 py-2 text-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
                    disabled={isBusy}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
