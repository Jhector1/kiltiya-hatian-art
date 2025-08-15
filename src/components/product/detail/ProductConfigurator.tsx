"use client";

import React from "react";
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

  return (
    <>
      <PurchaseOptionsCore
        digitalChecked={selection.wantDigital}
        printChecked={selection.wantPrint}
        digitalPrice={ctrl.digitalPriceStr}
        printPrice={ctrl.printPriceStr}
        onToggleDigital={ctrl.handleToggleDigital}
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
              options={optionSizes}
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
