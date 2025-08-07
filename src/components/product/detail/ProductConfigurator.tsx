// Code omitted above for brevity...

// File: src/components/product/detail/ProductConfigurator.tsx
import React, { useState } from "react";
import LicenseSelector from "../LicenseSelector";
import FormatSelector from "../FormatSelector";
import SizeSelector from "../SizeSelector";
import PrintCustomizer from "../PrintCustomizer";
import { AnimatePresence, motion } from "framer-motion";
import type {
  ProductDetailResult,
  FrameOption,
  MaterialOption,
  AddOptions,
  LicenseOption,
  CartUpdates,
  CartSelectedItem,
} from "@/types";
import PurchaseOptions from "../PurchaseOptions";
import { useCart } from "@/contexts/CartContext";
import { PriceOptionsProps } from "@/hooks/usePriceCalculator";

interface ProductConfiguratorProps {
  product: ProductDetailResult;
  inCart: CartSelectedItem;
  materials: MaterialOption[];
  licenses: LicenseOption[];
  frames: FrameOption[];
  optionSizes: { label: string; multiplier: number }[];
  formatData: {
    options: AddOptions;
    setOptions: React.Dispatch<React.SetStateAction<AddOptions>>;
  };
  licenseData: {
    license: LicenseOption;
    setLicense: React.Dispatch<React.SetStateAction<LicenseOption>>;
  };
  sizeData: {
    size: { label: string; multiplier: number };
    setSize: (val: { label: string; multiplier: number }) => void;
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
  updateCart: (updates: CartUpdates) => void;
  calculatePrice: (
      type: "Digital" | "Print",
    eraser?: "material" | "frame" | "size" | "license" | "" ,
    newMultiplier?: number
  ) => PriceOptionsProps;
  finalPrice: number;
}

export default function ProductConfigurator({
  product,
  inCart,
  materials,
  frames,
  optionSizes,
  formatData,
  licenseData,
  sizeData,
  materialData,
  frameData,
  licenses,
  //   updateCart,
  calculatePrice,
  finalPrice,
}: ProductConfiguratorProps) {
  const { options, setOptions } = formatData;
  const { license, setLicense } = licenseData;
  const { size, setSize, customSize, setCustomSize, isCustom, setIsCustom } =
    sizeData;
  const { material, setMaterial } = materialData;
  const { frame, setFrame } = frameData;
  const [format, setFormat] = useState<string>("");

  const formats = product.formats.map((url) => {
    const parts = url.split(".");
    return { type: parts.pop() || "", resolution: "n/a", multiplier: 1 };
  });

  const seen = new Set<string>();
  const uniqueFormats = formats.filter(
    (f) => !seen.has(f.type) && seen.add(f.type)
  );
  const { updateCart } = useCart();

  return (
    <>
      <PurchaseOptions
        digitalPrice={calculatePrice("Digital").digitalPrice}
        printPrice={calculatePrice("Print").printPrice}
        options={options}
        onToggle={(t) => setOptions((o) => ({ ...o, [t]: !o[t] }))}
        inCart={inCart || null}
        updateCart={(updates) =>
          updateCart({
            productId: product.id,
            printVariantId: "ADD",
            updates,
          })
        }
        removeFromCart={(updates) =>
          updateCart({
            // userId: user?.id || "",
            productId: product.id,
            printVariantId: "REMOVE",
            updates,
          })
        }
        removeFromCart2={(updates) =>
          updateCart({
            // userId: user?.id || "",
            productId: product.id,
            digitalVariantId: "REMOVE",
            updates,
          })
        }
        updateCart2={(updates) => {
          // alert(options.digitalVariantId)
          updateCart({
            // userId: user?.id || "",
            productId: product.id,
            digitalVariantId: "ADD",
            updates,
          });
        }}
      />
      <AnimatePresence initial={false}>
        {options.digital && (
          <motion.div
            key="print-settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {" "}
            <LicenseSelector
              calculatePrice={calculatePrice}
              updateCart={(updates: CartUpdates) =>
                updateCart({
                  productId: product.id,
                  digitalVariantId: options.digitalVariantId,
                  updates,
                })
              }
              inCart={inCart || null}
              licenses={licenses}
              onSelect={setLicense}
              selected={license}
            />{" "}
          </motion.div>
        )}
      </AnimatePresence>

      <FormatSelector
        formats={uniqueFormats}
        selected={format}
        onChangeAction={setFormat}
        inCart={inCart || null}
        updateCart={(updates: CartUpdates) =>
          updateCart({
            productId: product.id,
            printVariantId: options.printVariantId,
            updates,
          })
        }
      />

      <AnimatePresence initial={false}>
        {options.print && (
          <motion.div
            key="print-settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <SizeSelector
              options={optionSizes}
              selected={size}
              isCustom={isCustom}
              customSize={customSize}
              onSizeChange={(s, custom) => {
                setSize(s);
                setIsCustom(s.label === "Custom");
                if (custom) setCustomSize(custom);
              }}
              calculatePrice={calculatePrice}
              inCart={inCart!}
              updateCart={(updates) =>
                updateCart({
                  productId: product.id,
                  printVariantId: options.printVariantId,
                  updates,
                })
              }
            />
            <br />
            <PrintCustomizer
              total={finalPrice}
              calculatePrice={calculatePrice}
              imageSrc={product.imageUrl}
              setFrameAction={setFrame}
              frame={frame || null}
              setMaterialAction={setMaterial}
              material={material}
              materials={materials}
              frames={frames}
              inCart={inCart || null}
              updateCart={(updates) =>
                updateCart({
                  productId: product.id,
                  printVariantId: options.printVariantId,
                  updates,
                })
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
