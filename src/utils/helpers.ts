import { allSizes } from "@/data/helpers";
import { ProductDetail, ProductDetailResult } from "@/types";
import { Prisma } from "@prisma/client";

// if you already have this helper, use it:
export const toJsonInput = (
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =>
  v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);

export const toNullableJson = (
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | null =>
  v == null ? null : (v as Prisma.InputJsonValue);
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
const STEP = 0.05;
const BASE = 1;

export const cleanSizes = (sizes:string[]) => {
  // alert(product.sizes)
   if(!sizes)
    return allSizes;
  const parsed = sizes?.map((s: string) => parseWh(s));

  const allParsed = parsed?.every((p) => Array.isArray(p));
  if (allParsed) {
    const areas = parsed.map(([w, h]) => w * h) as number[];
    const minArea = Math.min(...areas);
    return sizes.map((size: string, i: number) => {
      const [w, h] = parsed[i] as [number, number];
      return {
        label: size,
        multiplier: +((w * h) / minArea).toFixed(2),
      };
    });
  }

  // Fallback: simple step by index so you never crash
  return sizes?.map((size: string, i: number) => ({
    label: size,
    multiplier: +(BASE + STEP * i).toFixed(2),
  }));
};
