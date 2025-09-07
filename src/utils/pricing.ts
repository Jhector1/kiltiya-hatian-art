// src/components/shared/purchase/pricing.ts
import type { LicenseOption, MaterialOption, FrameOption } from "@/types";
import type { SizeOption } from "@/components/product/shared/core/SizeSelectorCore";

export function computeDigitalPrice(baseDigitalPrice: number, lic: LicenseOption) {
  const base = Number(baseDigitalPrice) || 0;
  const extra = Number(lic?.price ?? 0) || 0;
  const val = base + extra;
  return Number.isFinite(val) ? Math.max(0, val) : 0;
}

export function computePrintPrice(
  basePrintPrice: number,
  size: SizeOption,
  material: MaterialOption,
  frame: FrameOption | null
) {
  const base = Number(basePrintPrice) || 0;
  const s = Math.max(1, Number(size?.multiplier ?? 1));
  const mm = Math.max(1, Number(material?.multiplier ?? 1));
  const fm = Math.max(1, Number(frame?.multiplier ?? 1));
  const val = base * s * mm * fm;
  return Number.isFinite(val) ? Math.max(0, val) : 0;
}
