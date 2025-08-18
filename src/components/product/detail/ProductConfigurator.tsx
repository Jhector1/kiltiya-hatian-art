"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import PurchaseOptionsCore from "@/components/shared/core/PurchaseOptionsCore";
import LicenseSelectorCore from "@/components/shared/core/LicenseSelectorCore";
import SizeSelectorCore from "@/components/shared/core/SizeSelectorCore";
import PrintCustomizerCore from "@/components/shared/core/PrintCustomizerCore";
import FormatSelector from "../FormatSelector";

import type {
  ProductDetailResult,
  FrameOption,
  MaterialOption,
  AddOptions,
  LicenseOption,
  CartUpdates,
  CartSelectedItem,
} from "@/types";
import type { SizeOption } from "@/components/shared/core/SizeSelectorCore";
import type { PriceOptionsProps } from "@/hooks/usePriceCalculator";
import { useCart } from "@/contexts/CartContext";
import { usePurchaseConfigurator } from "@/hooks/usePurchaseConfigurator";
import { SaleAndCountdown } from "@/components/shared/core/SalePriceAndCountDown";
import { getEffectiveSale } from "@/lib/pricing";

interface SelectionModel {
  wantDigital: boolean;
  setWantDigital: (v: boolean) => void;
  wantPrint: boolean;
  setWantPrint: (v: boolean) => void;
}

interface ProductConfiguratorProps {
    previewImageSrc?: string; // ✅ NEW

  showFormat?: boolean;
  product: ProductDetailResult;
  inCart: CartSelectedItem | null;

  materials: MaterialOption[];
  licenses: LicenseOption[];
  frames: FrameOption[];
  optionSizes: SizeOption[];

  formatData: {
    options: AddOptions;
    setOptions: React.Dispatch<React.SetStateAction<AddOptions>>;
  };
  licenseData: {
    license: LicenseOption;
    setLicense: React.Dispatch<React.SetStateAction<LicenseOption>>;
  };
  sizeData: {
    size: SizeOption;
    setSize: (val: SizeOption) => void;
    customSize: { width: string; height: string };
    setCustomSize: (val: { width: string; height: string }) => void;
    isCustom: boolean;
    setIsCustom: (val: boolean) => void;
  };
  materialData: {
    material: MaterialOption;
    setMaterial: (val: MaterialOption) => void;
  };
  frameData: {
    frame: FrameOption | null;
    setFrame: (val: FrameOption | null) => void;
  };

  selection: SelectionModel;

  calculatePrice: (
    type: "Digital" | "Print",
    eraser?: "material" | "frame" | "size" | "license" | "",
    newMultiplier?: number
  ) => PriceOptionsProps;

  finalPrice: number;
}

export default function ProductConfigurator({ showFormat = true, ...props }: ProductConfiguratorProps) {
  const { updateCart } = useCart();

  const {
    product,
    inCart,
    materials, licenses, frames, optionSizes,
    formatData, licenseData, sizeData, materialData, frameData,
    selection, calculatePrice, finalPrice,
  } = props;
// Robust "WxH" parser: "8x10", "8 × 10", `8" x 10"`, "8in x 10in", etc.
const parseWh = (s: string): [number, number] | null => {
  if (!s) return null;
  const cleaned = s.trim().toLowerCase().replace(/[×✕]/g, "x");
  const m = cleaned.match(
    /(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")?\s*x\s*(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")?/
  );
  if (!m) return null;
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  return Number.isFinite(w) && Number.isFinite(h) ? [w, h] : null;
};

// Build multipliers: area-based if all sizes parse; otherwise simple stepped.
const STEP = 0.25;
const BASE = 1;

const availableSizes = (() => {
  const parsed = product.sizes.map((s: string) => parseWh(s));

  const allParsed = parsed.every((p) => Array.isArray(p));
  if (allParsed) {
    const areas = parsed.map(([w, h]) => w * h) as number[];
    const minArea = Math.min(...areas);
    return product.sizes.map((size: string, i: number) => {
      const [w, h] = parsed[i] as [number, number];
      return {
        label: size,
        multiplier: +((w * h) / minArea).toFixed(2),
      };
    });
  }

  // Fallback: simple step by index so you never crash
  return product.sizes.map((size: string, i: number) => ({
    label: size,
    multiplier: +(BASE + STEP * i).toFixed(2),
  }));
})();

  // alert(availableSizes)

  const ctrl = usePurchaseConfigurator({
    product,
    wantDigital: selection.wantDigital,
    setWantDigital: selection.setWantDigital,
    wantPrint: selection.wantPrint,
    setWantPrint: selection.setWantPrint,

    license: licenseData.license,
    setLicense: licenseData.setLicense,

    size: sizeData.size,
    setSize: sizeData.setSize,
    customSize: sizeData.customSize,
    setCustomSize: sizeData.setCustomSize,
    isCustom: sizeData.isCustom,
    setIsCustom: sizeData.setIsCustom,

    material: materialData.material,
    setMaterial: materialData.setMaterial,

    frame: frameData.frame,
    setFrame: frameData.setFrame,

    calculatePrice,
    inCart,
    updateCart: (input) =>
      updateCart({
        productId: input.productId,
        digitalVariantId: input.digitalVariantId,
        printVariantId: input.printVariantId,
        updates: input.updates,
      }),
    options: formatData?.options,
    setOptions: formatData.setOptions,
  });

  // hard guard: never allow it to be false
useEffect(() => {
  if (!selection.wantDigital) selection.setWantDigital(true); // 👈 force back on
}, [selection.wantDigital, selection.setWantDigital]);

 const baseTotal = (() => {
    const n =
      typeof finalPrice === "string" ? parseFloat(finalPrice) : finalPrice;
    return Number.isFinite(n) ? n : 0;
  })();
    // normalize date fields if they arrive as strings
    const saleStartsAt = product?.saleStartsAt
      ? new Date(product.saleStartsAt as any)
      : null;
    const saleEndsAt = product?.saleEndsAt
      ? new Date(product.saleEndsAt as any)
      : null;
    //  alert(JSON.stringify(product))
    // alert(saleEndsAt)
    const saleInfo = product
      ? getEffectiveSale({
          price: baseTotal,
          salePrice: (product as any).salePrice ?? null,
          salePercent: (product as any).salePercent ?? null,
          saleStartsAt,
          saleEndsAt,
       
        })
      : {
          price: baseTotal,
          compareAt: null,
          onSale: false,
          endsAt: null as Date | null,
        };
        const forceDigitalOn = () => selection.setWantDigital(true);

  return (
    <>
      <SaleAndCountdown {...saleInfo}/>
      <PurchaseOptionsCore
  digitalChecked={true}                  // 👈 always true
        printChecked={selection.wantPrint}
        digitalPrice={ctrl.digitalPriceStr}
        printPrice={ctrl.printPriceStr}
        onToggleDigital={forceDigitalOn}
        onTogglePrint={ctrl.handleTogglePrint}
      />

      <AnimatePresence initial={false}>
        {selection.wantDigital && (
          <motion.div
            key="digital-license"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <LicenseSelectorCore
              selected={licenseData.license}
              licenses={licenses}
              onSelect={ctrl.handleLicenseSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showFormat && (
        <FormatSelector
          formats={ctrl.formats}
          selected={ctrl.format}
          onChangeAction={ctrl.handleFormatChange}
          inCart={inCart || null}
          updateCart={(updates: CartUpdates) =>
            updateCart({
              productId: product.id,
              printVariantId: formatData.options.printVariantId,
              updates,
            })
          }
        />
      )}

      <AnimatePresence initial={false}>
        {selection.wantPrint && (
          <motion.div
            key="print-settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <SizeSelectorCore
              options={availableSizes}
              selected={sizeData.size}
              isCustom={sizeData.isCustom}
              customSize={sizeData.customSize}
              onSelect={ctrl.handleSizeSelect}
              onCustomChange={ctrl.handleCustomSizeChange}
            />

            <div className="mt-4" />

            <PrintCustomizerCore
              imageSrc={props.previewImageSrc ?? product.imageUrl} 
              // {/* ✅ use override if provided */}
              materials={materials}
              frames={frames}
              material={materialData.material}
              frame={frameData.frame}
              onMaterial={ctrl.handleMaterial}
              onFrame={ctrl.handleFrame}
              total={finalPrice}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
