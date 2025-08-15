"use client";

import { useMemo, useState, useCallback } from "react";
import type {
  ProductDetailResult,
  LicenseOption,
  MaterialOption,
  FrameOption,
  CartSelectedItem,
  CartUpdates,
  AddOptions,
} from "@/types";
import type { SizeOption } from "@/components/shared/core/SizeSelectorCore";
import type { PriceOptionsProps } from "@/hooks/usePriceCalculator";

export function usePurchaseConfigurator(args: {
  product: ProductDetailResult;

  wantDigital: boolean;
  setWantDigital: (v: boolean) => void;
  wantPrint: boolean;
  setWantPrint: (v: boolean) => void;

  license: LicenseOption;
  setLicense: React.Dispatch<React.SetStateAction<LicenseOption>>;

  size: SizeOption;
  setSize: (s: SizeOption) => void;
  customSize: { width: string; height: string };
  setCustomSize: (c: { width: string; height: string }) => void;
  isCustom: boolean;
  setIsCustom: (v: boolean) => void;

  material: MaterialOption;
  setMaterial: (m: MaterialOption) => void;

  frame: FrameOption | null;
  setFrame: (f: FrameOption | null) => void;

  calculatePrice: (
    type: "Digital" | "Print",
    eraser?: "material" | "frame" | "size" | "license" | "",
    newMultiplier?: number
  ) => PriceOptionsProps;

  inCart?: CartSelectedItem | null;
  updateCart?: (input: {
    productId: string;
    digitalVariantId?: string | "ADD" | "REMOVE";
    printVariantId?: string | "ADD" | "REMOVE";
    updates: CartUpdates;
  }) => Promise<any> | void;

  options: AddOptions;
  setOptions: React.Dispatch<React.SetStateAction<AddOptions>>;
}) {
  const {
    product, wantDigital, setWantDigital, wantPrint, setWantPrint,
    license, setLicense, size, setSize, customSize, setCustomSize, isCustom, setIsCustom,
    material, setMaterial, frame, setFrame,
    calculatePrice,
    inCart, updateCart, options, setOptions,
  } = args;

  const formats = useMemo(() => {
    const seen = new Set<string>();
    return (product?.formats ?? [])
      .map((url) => {
        const ext = (url?.split(".").pop() ?? "").toLowerCase();
        return { type: ext, resolution: "n/a", multiplier: 1 };
      })
      .filter((f) => {
        if (seen.has(f.type)) return false;
        seen.add(f.type);
        return true;
      });
  }, [product?.formats]);

  const [format, setFormat] = useState<string>(formats[0]?.type || "");

  const digitalPriceStr = calculatePrice("Digital").digitalPrice;
  const printPriceStr = calculatePrice("Print").printPrice;
  const digitalPriceNum = Number(digitalPriceStr) || 0;
  const printPriceNum = Number(printPriceStr) || 0;

  const handleToggleDigital = useCallback(async () => {
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
          price: (options.print ? printPriceNum : 0) + digitalPriceNum,
        } as CartUpdates,
      });
      // sync ids if server returns them
      if (res?.digitalVariantId) {
        setOptions((o) => ({ ...o, digitalVariantId: res.digitalVariantId }));
      }
    } else {
      const res = await updateCart({
        productId: product.id,
        digitalVariantId: "REMOVE",
        updates: { price: options.print ? printPriceNum : 0 } as CartUpdates,
      });
      if (res?.digitalVariantId === null) {
        setOptions((o) => ({ ...o, digitalVariantId: "" }));
      }
    }
  }, [
    wantDigital, setWantDigital, setOptions,
    inCart, updateCart, product?.id,
    format, license?.type,
    options?.print, printPriceNum, digitalPriceNum,
  ]);

  const handleTogglePrint = useCallback(async () => {
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
          size: size.label,
          material: material.label,
          frame: frame?.label ?? null,
          price: (options.digital ? digitalPriceNum : 0) + printPriceNum,
        } as CartUpdates,
      });
      if (res?.printVariantId) {
        setOptions((o) => ({ ...o, printVariantId: res.printVariantId }));
      }
    } else {
      const res = await updateCart({
        productId: product.id,
        printVariantId: "REMOVE",
        updates: { price: options.digital ? digitalPriceNum : 0 } as CartUpdates,
      });
      if (res?.printVariantId === null) {
        setOptions((o) => ({ ...o, printVariantId: "" }));
      }
    }
  }, [
    wantPrint, setWantPrint, setOptions,
    inCart, updateCart, product?.id,
    size?.label, material?.label, frame,
    options?.digital, digitalPriceNum, printPriceNum,
  ]);

  const handleFormatChange = useCallback(async (nextFormat: string) => {
    setFormat(nextFormat);
    if (!inCart || !updateCart || !options.print || !options.printVariantId) return;
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId!,
      updates: { format: nextFormat } as CartUpdates,
    });
  }, [inCart, updateCart, options.print, options.printVariantId, product?.id]);

  const handleLicenseSelect = useCallback(async (lic: LicenseOption) => {
    setLicense(lic);
    if (!inCart || !updateCart || !options.digital) return;

    const res = await updateCart({
      productId: product.id,
      digitalVariantId: options.digitalVariantId || "ADD",
      updates: {
        license: lic.type,
        price: (Number(calculatePrice("Digital", 'license').digitalPrice) || 0) + (options.print ? printPriceNum : 0) + lic.price,
        format, // ensure format is present on ADD
      } as CartUpdates,
    });
    if (res?.digitalVariantId && !options.digitalVariantId) {
      setOptions((o) => ({ ...o, digitalVariantId: res.digitalVariantId }));
    }
  }, [
    inCart, updateCart, options.digital, options.digitalVariantId,
    product?.id, setLicense, calculatePrice, printPriceNum, format, setOptions
  ]);

  const handleSizeSelect = useCallback(async (sel: SizeOption) => {
    setSize(sel);
    setIsCustom(sel.label === "Custom");
    if (!inCart || !updateCart || !options.print || !options.printVariantId) return;
    const newPrintPrice = Number(calculatePrice("Print", "size", sel.multiplier).printPrice) || 0;
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId!,
      updates: { size: sel.label, price: newPrintPrice + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [
    setSize, setIsCustom, inCart, updateCart, options.print, options.printVariantId,
    calculatePrice, product?.id, wantDigital, digitalPriceNum
  ]);

  const handleCustomSizeChange = useCallback(async (c: { width: string; height: string }) => {
    setCustomSize(c);
    if (!inCart || !updateCart || !options.print || !options.printVariantId) return;
    const newPrintPrice = Number(calculatePrice("Print", "size").printPrice) || 0;
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId!,
      updates: { size: `${c.width}x${c.height} in`, price: newPrintPrice + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [
    setCustomSize, inCart, updateCart, options.print, options.printVariantId,
    calculatePrice, product?.id, wantDigital, digitalPriceNum
  ]);

  const handleMaterial = useCallback(async (m: MaterialOption) => {
    setMaterial(m);
    if (!inCart || !updateCart || !options.print || !options.printVariantId) return;
    const newPrintPrice = Number(calculatePrice("Print", "material", m.multiplier).printPrice) || 0;
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId!,
      updates: { material: m.label, price: newPrintPrice + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [
    setMaterial, inCart, updateCart, options.print, options.printVariantId,
    calculatePrice, product?.id, wantDigital, digitalPriceNum
  ]);

  const handleFrame = useCallback(async (f: FrameOption | null) => {
    setFrame(f);
    if (!inCart || !updateCart || !options.print || !options.printVariantId) return;
    const mult = f ? f.multiplier : 1;
    const newPrintPrice = Number(calculatePrice("Print", "frame", mult).printPrice) || 0;
    await updateCart({
      productId: product.id,
      printVariantId: options.printVariantId!,
      updates: { frame: f?.label ?? "", price: newPrintPrice + (wantDigital ? digitalPriceNum : 0) } as CartUpdates,
    });
  }, [
    setFrame, inCart, updateCart, options.print, options.printVariantId,
    calculatePrice, product?.id, wantDigital, digitalPriceNum
  ]);

  return {
    formats, format, setFormat,
    digitalPriceStr, printPriceStr,
    digitalPriceNum, printPriceNum,
    handleToggleDigital, handleTogglePrint,
    handleFormatChange, handleLicenseSelect,
    handleSizeSelect, handleCustomSizeChange,
    handleMaterial, handleFrame,
  };
}
