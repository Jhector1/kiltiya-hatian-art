// src/hooks/useProductPurchase.ts
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { useCart } from "@/contexts/CartContext";
import { fetchProductById } from "@/utils/fetchProductById";
import { handleCheckout } from "@/utils/handleCheckout";
import { cleanSizes } from "@/utils/helpers";
import { allFrames, allLicenses, allMaterials } from "@/data/helpers";

import type {
  AddOptions,
  CartSelectedItem,
  CartUpdates,
  ProductDetailResult,
  LicenseOption,
  MaterialOption,
  FrameOption,
} from "@/types";
import type { SizeOption } from "@/components/product/shared/core/SizeSelectorCore";

/* ────────────────────────────────────────────────────────────────────
   Tiny, local pricing helpers (no extra hooks, no “erasers”).
   Keep them here so everything’s visible and predictable.
   ──────────────────────────────────────────────────────────────────── */
const computeDigital = (base: number, lic: LicenseOption | null) =>
  Math.max(0, (Number(base) || 0) + (Number(lic?.price ?? 0) || 0));

const computePrint = (
  base: number,
  size: SizeOption | null,
  material: MaterialOption | null,
  frame: FrameOption | null
) => {
  const s = Math.max(1, Number(size?.multiplier ?? 1));
  const m = Math.max(1, Number(material?.multiplier ?? 1));
  const f = Math.max(1, Number(frame?.multiplier ?? 1));
  const raw = (Number(base) || 0) * s * m * f;
  return Math.max(0, Math.round(raw)); // round to whole dollar as your comments suggested
};

const uniqFormats = (urls: string[] = []) => {
  const seen = new Set<string>();
  return urls
    .map((u) => (u?.split(".").pop() ?? "").toLowerCase())
    .filter((ext) => ext && !seen.has(ext) && seen.add(ext));
};

export function useProductPurchase({ productId }: { productId: string }) {
  const { user, guestId } = useUser();
  const { cart, loadingAdd, addToCart, updateCart, removeFromCart } = useCart();

  // product + media
  const [product, setProduct] = useState<ProductDetailResult | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

  // normalized catalog bits
  const [allSizes, setAllSizes] = useState<SizeOption[]>([]);

  // on/off + variant ids you already persist in cart
  const [options, setOptions] = useState<AddOptions>({
    digital: false,
    print: false,
    digitalVariantId: "",
    printVariantId: "",
  });

  // single source of truth for selections
  const [wantDigital, setWantDigital] = useState(false);
  const [wantPrint, setWantPrint] = useState(false);
  const [license, setLicense] = useState<LicenseOption>(allLicenses[0]);
  const [size, setSize] = useState<SizeOption | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customSize, setCustomSize] = useState<{ width: string; height: string }>({
    width: "",
    height: "",
  });
  const [material, setMaterial] = useState<MaterialOption>(allMaterials[0]);
  const [frame, setFrame] = useState<FrameOption | null>(null);
  const [format, setFormat] = useState<string>("");

  // ── load product + seed from cart once ─────────────────────────────
  useEffect(() => {
    if (!productId) return;

    fetchProductById(productId, user?.id || guestId || "")
      .then((p) => {
        setProduct(p);
        setPreview({ src: p.imageUrl || "", alt: p.title });
        setAllSizes(cleanSizes(p.sizes));

        // formats
        const fmts = uniqFormats(p.formats);
        setFormat(fmts[0] || "png");

        // in-cart flags
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

        setWantDigital(!!digitalVariant);
        setWantPrint(!!printVariant);

        // hydrate selections from cart snapshot (if present)
        const byType = (t?: string | null) =>
          allLicenses.find((l) => l.type.toLowerCase() === (t || "").toLowerCase());
        const byLabel = <T extends { label: string }>(arr: T[], lbl?: string | null) =>
          arr.find((a) => a.label.toLowerCase() === (lbl || "").toLowerCase());

        if (digitalVariant?.license) {
          const lic = byType(digitalVariant.license);
          if (lic) setLicense(lic);
        }
        if (printVariant?.size) {
          const sz = byLabel(cleanSizes(p.sizes), printVariant.size);
          if (sz) {
            setSize(sz);
            setIsCustom(sz.label.toLowerCase() === "custom");
          }
        } else {
          // default size if available
          const first = cleanSizes(p.sizes)[0];
          if (first) setSize(first);
        }
        if (printVariant?.material) {
          const m = byLabel(allMaterials, printVariant.material);
          if (m) setMaterial(m);
        }
        if (typeof printVariant?.frame !== "undefined") {
          const f = printVariant.frame ? byLabel(allFrames, printVariant.frame) : null;
          setFrame(f ?? null);
        }
      })
      .catch(console.error);
  }, [productId, user, guestId]);

  // ── derived basics ─────────────────────────────────────────────────
  const inCart: CartSelectedItem | undefined = product
    ? cart.find((item) => item.id === product.id)
    : undefined;

  const formats = useMemo(() => uniqFormats(product?.formats), [product?.formats]);

  // custom-size multiplier (very light; keep your old baseline 8×10=80)
  const customMult = useMemo(() => {
    if (!isCustom) return null;
    const w = parseFloat(customSize.width || "");
    const h = parseFloat(customSize.height || "");
    return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? (w * h) / 80 : null;
  }, [isCustom, customSize]);

  // price — simple, visible rules
  const base = product?.price ?? 0;
  const effectiveSize: SizeOption | null =
    customMult != null && size
      ? { ...size, multiplier: customMult }
      : size;

  const digitalPriceNum = wantDigital ? computeDigital(base, license) : 0;
  const printPriceNum = wantPrint ? computePrint(base, effectiveSize, material, frame) : 0;
  const finalPrice = digitalPriceNum + printPriceNum;

  // ── cart updaters (kept lean) ──────────────────────────────────────
  const syncVariantId = (res: any, key: "digitalVariantId" | "printVariantId") => {
    if (res && key in res) {
      setOptions((o) => ({ ...o, [key]: res[key] || "" }));
    }
  };

  const handleToggleDigital = useCallback(async () => {
    if (!product) return;
    const turningOn = !wantDigital;
    setWantDigital(turningOn);
    setOptions((o) => ({ ...o, digital: turningOn }));

    if (!inCart || !updateCart) return;

    if (turningOn) {
      const res = await updateCart({
        productId: product.id,
        digitalVariantId: "ADD",
        updates: {
          format: format || "jpg",
          license: license.type,
          price: finalPrice, // total after toggle
        } as CartUpdates,
      });
      syncVariantId(res, "digitalVariantId");
    } else {
      const res = await updateCart({
        productId: product.id,
        digitalVariantId: "REMOVE",
        updates: { price: printPriceNum } as CartUpdates,
      });
      syncVariantId(res, "digitalVariantId");
    }
  }, [product, wantDigital, inCart, updateCart, format, license.type, finalPrice, printPriceNum]);

  const handleTogglePrint = useCallback(async () => {
    if (!product) return;
    const turningOn = !wantPrint;
    setWantPrint(turningOn);
    setOptions((o) => ({ ...o, print: turningOn }));

    if (!inCart || !updateCart) return;

    if (turningOn) {
      const res = await updateCart({
        productId: product.id,
        printVariantId: "ADD",
        updates: {
          format: "jpg",
          size: size?.label ?? null,
          material: material.label,
          frame: frame?.label ?? null,
          price: finalPrice,
        } as CartUpdates,
      });
      syncVariantId(res, "printVariantId");
    } else {
      const res = await updateCart({
        productId: product.id,
        printVariantId: "REMOVE",
        updates: { price: digitalPriceNum } as CartUpdates,
      });
      syncVariantId(res, "printVariantId");
    }
  }, [product, wantPrint, inCart, updateCart, size?.label, material.label, frame, finalPrice, digitalPriceNum]);

  // inline setters that also keep cart in sync when possible
  const selectLicense = useCallback(async (lic: LicenseOption) => {
    setLicense(lic);
    if (!product || !inCart || !updateCart || !options.digital) return;
    const res = await updateCart({
      productId: product.id,
      digitalVariantId: options.digitalVariantId || "ADD",
      updates: {
        license: lic.type,
        format: format || "jpg",
        price: computeDigital(base, lic) + (wantPrint ? printPriceNum : 0),
      } as CartUpdates,
    });
    if (!options.digitalVariantId) syncVariantId(res, "digitalVariantId");
  }, [product, inCart, updateCart, options.digital, options.digitalVariantId, format, base, wantPrint, printPriceNum]);

  const selectSize = useCallback(async (next: SizeOption) => {
    setSize(next);
    setIsCustom(next.label.toLowerCase() === "custom");

    if (!product || !inCart || !updateCart || !options.print || !options.printVariantId) return;
    const p = computePrint(base, { ...next, multiplier: customMult ?? next.multiplier }, material, frame);
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId,
      updates: { size: next.label, price: p + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [product, inCart, updateCart, options.print, options.printVariantId, base, material, frame, customMult, wantDigital, digitalPriceNum]);

  const changeCustomSize = useCallback(async (c: { width: string; height: string }) => {
    setCustomSize(c);
    if (!product || !inCart || !updateCart || !options.print || !options.printVariantId || !size) return;
    const mult = (() => {
      const w = parseFloat(c.width || "");
      const h = parseFloat(c.height || "");
      return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? (w * h) / 80 : size.multiplier;
    })();
    const p = computePrint(base, { ...size, multiplier: mult }, material, frame);
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId,
      updates: { size: `${c.width}x${c.height} in`, price: p + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [product, inCart, updateCart, options.print, options.printVariantId, size, base, material, frame, wantDigital, digitalPriceNum]);

  const selectMaterial = useCallback(async (m: MaterialOption) => {
    setMaterial(m);
    if (!product || !inCart || !updateCart || !options.print || !options.printVariantId) return;
    const p = computePrint(base, effectiveSize, m, frame);
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId,
      updates: { material: m.label, price: p + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [product, inCart, updateCart, options.print, options.printVariantId, base, effectiveSize, frame, wantDigital, digitalPriceNum]);

  const selectFrame = useCallback(async (f: FrameOption | null) => {
    setFrame(f);
    if (!product || !inCart || !updateCart || !options.print || !options.printVariantId) return;
    const p = computePrint(base, effectiveSize, material, f);
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId,
      updates: { frame: f?.label ?? "", price: p + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [product, inCart, updateCart, options.print, options.printVariantId, base, effectiveSize, material, wantDigital, digitalPriceNum]);

  const selectFormat = useCallback(async (next: string) => {
    setFormat(next);
    if (!product || !inCart || !updateCart) return;
    // optional: only push format to a variant you require it on
    if (options.print && options.printVariantId) {
      await updateCart({
        productId: product.id,
        printVariantId: options.printVariantId,
        updates: { format: next } as CartUpdates,
      });
    }
  }, [product, inCart, updateCart, options.print, options.printVariantId]);

  // ── checkout (kept direct) ─────────────────────────────────────────
  const handleCheckoutAction = (maybeSetOpen?: unknown) =>
    product &&
    handleCheckout({
      user,
      guestId,
      inCart,
      addToCart,
      product,
      options: { ...options, digital: wantDigital, print: wantPrint },
      format,
      size: size || null,
      material,
      frame,
      license,
      setModalOpen: typeof maybeSetOpen === "function" ? (maybeSetOpen as (b: boolean) => void) : undefined,
      finalPrice: String(finalPrice),
    });

  return {
    // core
    product,
    preview,
    setPreview,
    formats,
    allSizes,

    // selection state
    wantDigital, setWantDigital: handleToggleDigital,   // toggle-aware setter
    wantPrint,  setWantPrint:  handleTogglePrint,       // toggle-aware setter
    license, setLicense: selectLicense,
    size, setSize: selectSize,
    isCustom, setIsCustom,
    customSize, setCustomSize: changeCustomSize,
    material, setMaterial: selectMaterial,
    frame, setFrame: selectFrame,
    format, setFormat: selectFormat,

    // options/ids
    options, setOptions,

    // pricing
    digitalPriceNum,
    printPriceNum,
    finalPrice,
    finalPriceUI: digitalPriceNum + printPriceNum, // kept for compatibility

    // cart + actions
    inCart,
    loadingAdd,
    addToCart,
    removeFromCart,
    updateCart,
    handleCheckoutAction,
  };
}




import { usePriceCalculator } from "@/hooks/usePriceCalculator";

/** Make the new unified hook look like your old useProductData */
export function useProductData({ productId }: { productId: string }) {
  const p = useProductPurchase({ productId });

  // ── legacy calculatePrice (proxy to your existing hook) ────────────
  const calculatePrice = usePriceCalculator(
    (p.product ??
      ({
        id: productId,
        imageUrl: "",
        title: "",
        description: "",
        formats: [],
        price: 0,
        baseDigitalPrice: 0,
        basePrintPrice: 0,
        variants: [],
        category: "",
        svgPreview: null,
      } as any)) as any,
    (p.size as any) ?? ({ label: "", multiplier: 1 } as SizeOption),
    (p.material as any) ?? ({ label: "", multiplier: 1 } as MaterialOption),
    (p.frame as any) ?? null,
    { digital: p.wantDigital, print: p.wantPrint },
    p.customSize,
    p.isCustom,
    (p.license as any) ?? ({ price: 0 } as LicenseOption)
  );

  // ── legacy setter shapes (accept value or updater fn) ──────────────
  const wrapSet =
    <T,>(current: T, apply: (next: T) => void) =>
    (nextOrFn: T | ((prev: T) => T)) => {
      const next =
        typeof nextOrFn === "function"
          ? (nextOrFn as (prev: T) => T)(current)
          : (nextOrFn as T);
      apply(next);
    };

  // toggle-aware adapters to match (v:boolean)=>void shape
  const setWantDigital = (v: boolean) => {
    if (Boolean(v) !== Boolean(p.wantDigital)) p.setWantDigital(); // unified hook toggles
  };
  const setWantPrint = (v: boolean) => {
    if (Boolean(v) !== Boolean(p.wantPrint)) p.setWantPrint();
  };

  // adapters for object setters
  const setLicense = wrapSet(p.license, p.setLicense);
  const setSize = wrapSet(p.size as SizeOption, p.setSize);
  const setCustomSize = wrapSet(p.customSize, p.setCustomSize);
  const setIsCustom = wrapSet(p.isCustom, p.setIsCustom);
  const setMaterial = wrapSet(p.material, p.setMaterial);
  const setFrame = wrapSet(p.frame, p.setFrame);

  // legacy finalPriceUI (you were using both)
  const finalPriceUI = p.finalPrice;

  return {
    // data + cart
    product: p.product,
    inCart: p.inCart as CartSelectedItem | undefined,
    loadingAdd: p.loadingAdd,
    addToCart: p.addToCart,
    removeFromCart: p.removeFromCart,
    updateCart: p.updateCart,

    // media
    preview: p.preview,
    setPreview: p.setPreview,

    // selections
    options: p.options,
    setOptions: p.setOptions,
    size: p.size as SizeOption,
    setSize,
    customSize: p.customSize,
    setCustomSize,
    isCustom: p.isCustom,
    setIsCustom,
    material: p.material as MaterialOption,
    setMaterial,
    frame: p.frame as FrameOption | null,
    setFrame,
    license: p.license as LicenseOption,
    setLicense,
    wantDigital: p.wantDigital,
    setWantDigital,
    wantPrint: p.wantPrint,
    setWantPrint,

    // pricing
    calculatePrice,      // same signature you already pass around
    finalPrice: p.finalPrice, // number
    finalPriceUI,            // legacy alias

    // checkout
    handleCheckoutAction: p.handleCheckoutAction,
  };
}
