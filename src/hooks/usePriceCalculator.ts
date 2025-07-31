// import { FrameOption, LicenseOption, MaterialOption } from "@/types";
// import { Product } from "@prisma/client";

import { ProductDetailResult } from "@/types";

// File: src/hooks/usePriceCalculator.ts
export function usePriceCalculator(
  product: ProductDetailResult,
  size: { label: string; multiplier: number },
  material: { multiplier: number },
  frame: { multiplier: number } | null,
  options: { digital: boolean },
  customSize: { width: string; height: string },
  isCustom: boolean,
  license: { price: number }
): (type: string, eraser?: string, newMultiplier?: number) => string {
  return function calculatePrice(type: string, eraser = "", newMultiplier = 0): string {
    const base = product?.price || 0;
    if (type === "Digital") return String(base);

    const sizeMultiplier =
      isCustom && customSize.width && customSize.height
        ? (+customSize.width * +customSize.height) / 80
        : size.multiplier;

    let materialMultiplier = material?.multiplier ?? 1;
    let frameMultiplier = frame?.multiplier ?? 1;

    if (eraser === "material") materialMultiplier = newMultiplier;
    if (eraser === "frame") frameMultiplier = newMultiplier;

    const total =
      base * sizeMultiplier * materialMultiplier * frameMultiplier +
      (options?.digital ? base : 0);

    return String(Number(total) + license.price);
  };
}
