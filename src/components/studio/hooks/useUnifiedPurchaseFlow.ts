"use client";

import { useCallback, useMemo } from "react";
import type { LicenseOption, MaterialOption, FrameOption } from "@/types";
import type { SizeOption } from "@/components/shared/core/SizeSelectorCore";
import { usePurchaseState } from "@/hooks/usePurchaseState";

/** Fallback pricing if you don't pass a pricingStrategy */
function computeDigitalPrice(base: number, lic: LicenseOption) {
  const val = (Number(base) || 0) + (Number(lic?.price ?? 0) || 0);
  return Number.isFinite(val) ? Math.max(0, val) : 0;
}
function computePrintPrice(
  base: number,
  size: SizeOption,
  material: MaterialOption,
  frame: FrameOption | null
) {
  const s = Math.max(1, Number(size?.multiplier ?? 1));
  const m = Math.max(1, Number(material?.multiplier ?? 1));
  const f = Math.max(1, Number(frame?.multiplier ?? 1));
  const val = (Number(base) || 0) * s * m * f;
  return Number.isFinite(val) ? Math.max(0, val) : 0;
}

export type PricingStrategyArgs = {
  type: "Digital" | "Print";
  baseDigitalPrice: number;
  basePrintPrice: number;
  license: LicenseOption;
  size: SizeOption;
  material: MaterialOption;
  frame: FrameOption | null;
};
export type PricingStrategy = (args: PricingStrategyArgs) => number;

type Catalogs = {
  licenses: LicenseOption[];
  sizes: SizeOption[];
  materials: MaterialOption[];
  frames: FrameOption[];
};

export function useUnifiedPurchaseFlow(opts: {
  /** identity + persistence */
  productId: string;
  designId?: string;
  persist: boolean;                 // page=false, modal=true (or modal open)
  /** availability + defaults */
  defaultVariant?: "digital" | "print";
  digitalSupported: boolean;
  printSupported: boolean;
  defaultFormat?: string;
  /** catalogs + base prices */
  baseDigitalPrice: number;
  basePrintPrice: number;
  catalogs: Catalogs;
  /** optional pluggable pricing (e.g., usePriceCalculator) */
  pricingStrategy?: PricingStrategy;
}) {
  const {
    productId,
    designId,
    persist,
    defaultVariant = "digital",
    digitalSupported,
    printSupported,
    defaultFormat = "png",
    baseDigitalPrice,
    basePrintPrice,
    catalogs,
    pricingStrategy,
  } = opts;

  /** Reuse your state+persistence hook, enable only when persist is true */
  const model = usePurchaseState({
    productId,
    designId,
    enabled: persist,
    defaultVariant,
    digitalSupported,
    printSupported,
    baseDigitalPrice,
    basePrintPrice,
    catalogs,
    defaultFormat,
  });

  const {
    wantDigital, setWantDigital,
    wantPrint, setWantPrint,
    qty, setQty,
    license, setLicense,
    size, setSize,
    isCustom, setIsCustom,
    customSize, setCustomSize,
    material, setMaterial,
    frame, setFrame,
  } = model;

  /** Unified pricing (strategy first, fallback otherwise) */
  const digitalPrice = useMemo(() => {
    if (pricingStrategy) {
      return (
        pricingStrategy({
          type: "Digital",
          baseDigitalPrice,
          basePrintPrice,
          license,
          size,
          material,
          frame,
        }) || 0
      );
    }
    return computeDigitalPrice(baseDigitalPrice, license);
  }, [
    pricingStrategy,
    baseDigitalPrice,
    basePrintPrice,
    license,
    size,
    material,
    frame,
  ]);

  const printPrice = useMemo(() => {
    if (pricingStrategy) {
      return (
        pricingStrategy({
          type: "Print",
          baseDigitalPrice,
          basePrintPrice,
          license,
          size,
          material,
          frame,
        }) || 0
      );
    }
    return computePrintPrice(basePrintPrice, size, material, frame);
  }, [
    pricingStrategy,
    baseDigitalPrice,
    basePrintPrice,
    license,
    size,
    material,
    frame,
  ]);

  const finalPrice = useMemo(
    () => (wantDigital ? digitalPrice : 0) + (wantPrint ? printPrice : 0),
    [wantDigital, wantPrint, digitalPrice, printPrice]
  );

  /** Common fields for cart/checkout */
  const baseVariantFields = useMemo(
    () => ({
      format: defaultFormat,
      size: wantPrint ? size.label : null,
      material: wantPrint ? material.label : null,
      frame: wantPrint ? (frame?.label ?? null) : null,
      license: license.type, // snapshot
    }),
    [defaultFormat, wantPrint, size.label, material.label, frame, license.type]
  );

  /** Payload builders */
  const buildCartPayload = useCallback(
    (extra: { snapshot?: boolean } = {}) => ({
      productId,
      digitalType: wantDigital ? "DIGITAL" : null,
      printType: wantPrint ? "PRINT" : null,
      price: finalPrice,
      quantity: qty,
      ...baseVariantFields,
      snapshot: extra.snapshot ?? true,
    }),
    [
      productId,
      wantDigital,
      wantPrint,
      finalPrice,
      qty,
      baseVariantFields,
    ]
  );

  const buildCheckoutPayload = useCallback(
    () => ({
      variant: wantDigital ? ("digital" as const) : ("print" as const),
      quantity: qty,
      productId,
      price: finalPrice,
      digital: wantDigital
        ? { format: defaultFormat, license: license.type }
        : null,
      print: wantPrint
        ? {
            format: defaultFormat,
            size: size.label,
            material: material.label,
            frame: frame?.label ?? null,
          }
        : null,
    }),
    [
      wantDigital,
      wantPrint,
      qty,
      productId,
      finalPrice,
      defaultFormat,
      license.type,
      size.label,
      material.label,
      frame,
    ]
  );

  return {
    // state
    wantDigital, setWantDigital,
    wantPrint, setWantPrint,
    qty, setQty,
    license, setLicense,
    size, setSize,
    isCustom, setIsCustom,
    customSize, setCustomSize,
    material, setMaterial,
    frame, setFrame,

    // pricing
    digitalPrice, printPrice, finalPrice,

    // builders
    baseVariantFields,
    buildCartPayload,
    buildCheckoutPayload,
  };
}
