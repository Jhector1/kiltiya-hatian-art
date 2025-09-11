// import { allSizes } from "@/data/helpers";
// import { ProductDetail, ProductDetailResult } from "@/types";
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

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const roundTo = (v: number, step = 0.05) =>
  Math.round(v / step) * step;
export type SizeMathOptions = {
  method?: "area" | "perimeter" | "max-dim";
  exponent?: number;   // < 1.0 to tame growth (0.5–0.7 works well)
  minMult?: number;    // floor for smallest size
  maxMult?: number;    // cap for largest size
  step?: number;       // rounding granularity for display math
};
export const cleanSizes = (
  sizes: string[] | undefined,
  opts?: SizeMathOptions
) => {
  const {
    method = "area",
    exponent = 0.6,   // sqrt-ish moderation; try 0.5–0.7
    minMult = 1.0,
    maxMult = 3.5,    // keep even the largest <= 3.5x base
    step = 0.05,
  } = opts || {};

  if (!sizes?.length) return [];

  const parsed = sizes.map(parseWh);
  const allParsed = parsed.every((p): p is [number, number] => Array.isArray(p));

  if (allParsed) {
    const metric = (w: number, h: number) =>
      method === "perimeter"
        ? w + h
        : method === "max-dim"
        ? Math.max(w, h)
        : w * h; // default: area

    const values = parsed.map(([w, h]) => metric(w, h));
    const minVal = Math.min(...values);

    if (!isFinite(minVal) || minVal <= 0) {
      // fallback if something went weird
      return sizes.map((label, i) => ({
        label,
        multiplier: roundTo(1 + i * 0.05, step),
      }));
    }

    return sizes.map((label, i) => {
      const ratio = values[i] / minVal;
      const moderated = Math.pow(ratio, exponent);
      const bounded = clamp(moderated, minMult, maxMult);
      return { label, multiplier: roundTo(bounded, step) };
    });
  }

  // fallback: gentle steps
  return sizes.map((label, i) => ({
    label,
    multiplier: roundTo(1 + i * 0.05),
  }));
};

/**
 * Get a single multiplier for one size, given all available sizes.
 * Falls back to a default baseline (8x10) if full list not available.
 */
export const getSizeMultiplier = (
  size: string | null | undefined,
  allSizes: string[] | undefined,
  opts?: Parameters<typeof cleanSizes>[1]
): number => {
  if (!size) return 1;

  const table = cleanSizes(allSizes, opts);
  const hit = table.find(
    (x) => x.label.trim().toLowerCase() === size.trim().toLowerCase()
  );
  if (hit) return hit.multiplier;

  // Fallback baseline vs 8x10
  const wh = parseWh(size);
  if (!wh) return 1;

  const {
    method = "area",
    exponent = 0.6,
    minMult = 1.0,
    maxMult = 3.5,
  } = opts || {};

  const metric = (w: number, h: number) =>
    method === "perimeter"
      ? w + h
      : method === "max-dim"
      ? Math.max(w, h)
      : w * h;

  const baseVal = metric(8, 10); // fallback baseline
  const ratio = metric(wh[0], wh[1]) / baseVal;
  const moderated = Math.pow(Math.max(ratio, 1), exponent);
  return clamp(moderated, minMult, maxMult);
};
