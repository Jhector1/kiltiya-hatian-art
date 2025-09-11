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
// keeps your names/signature
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const roundTo = (v: number, step = 0.05) =>
  Math.round(v / step) * step;

export type SizeMathOptions = {
  method?: "area" | "perimeter" | "max-dim";
  exponent?: number;     // main growth (< 1.0)
  minMult?: number;      // floor
  maxMult?: number;      // set to Infinity for "no stop"
  step?: number;         // rounding for UI
  knee?: number;         // start of soft-knee in raw ratio (e.g. 6× the base metric)
  slope?: number;        // 0..1 strength of log-tail beyond knee (smaller = gentler)
};


    const METHOD = "area";
    const EXPONENT = 0.15;    // gentle sub-linear growth
   const MIN_MULT = 1.0;
    const MAX_MULT = Infinity; // 🔑 no hard stop by default
    const STEP = 0.05;
   const  KNEE = 6;           // begin soft knee ~6× base metric
    const SLOPE = 0.18;       // tail strength; lower = slower


// Soft-knee: after ratio > knee, add a tiny log-based tail so it never stops
const withSoftKnee = (
  ratio: number,
  moderated: number,
  knee = 6,
  slope = 0.18
) => {
  if (!(ratio > knee)) return moderated;
  const extra = Math.log(1 + (ratio - knee)); // smooth, slow growth
  return moderated * (1 + slope * extra);
};

export const cleanSizes = (
  sizes: string[] | undefined,
  opts?: SizeMathOptions
) => {
  const {
    method = METHOD,
    exponent =EXPONENT,     // gentle sub-linear growth
    minMult = MIN_MULT,
    maxMult = MAX_MULT, // 🔑 no hard stop by default
    step = STEP,
    knee = KNEE,           // begin soft knee ~6× base metric
    slope = SLOPE,       // tail strength; lower = slower
  } = opts || {};

  if (!sizes?.length) return [];

  const parsed = sizes.map(parseWh);
  const allParsed = parsed.every((p): p is [number, number] => Array.isArray(p));

  if (allParsed) {
    const metric = (w: number, h: number) =>
      method === "perimeter" ? w + h :
      method === "max-dim"  ? Math.max(w, h) :
      w * h; // default: area

    const values = parsed.map(([w, h]) => metric(w, h));
    const minVal = Math.min(...values);
    if (!isFinite(minVal) || minVal <= 0) {
      return sizes.map((label, i) => ({
        label,
        multiplier: roundTo(1 + i * 0.05, step),
      }));
    }

    return sizes.map((label, i) => {
      const ratio = values[i] / minVal;                 // ≥ 1
      const base = Math.pow(ratio, exponent);           // sub-linear
      const tailed = withSoftKnee(ratio, base, knee, slope); // keep rising slowly
      const bounded = clamp(tailed, minMult, maxMult);  // hi=Infinity → no hard stop
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
 * Single-size lookup (same soft-knee behavior).
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

  // Fallback vs 8x10 baseline
  const wh = parseWh(size);
  if (!wh) return 1;

  const {
    method = METHOD,
    exponent =EXPONENT,     // gentle sub-linear growth
    minMult = MIN_MULT,
    maxMult = MAX_MULT, // 🔑 no hard stop by default
    step = STEP,
    knee = KNEE,           // begin soft knee ~6× base metric
    slope = SLOPE,       // tail strength; lower = slower
  } = opts || {};

  const metric = (w: number, h: number) =>
    method === "perimeter" ? w + h :
    method === "max-dim"  ? Math.max(w, h) :
    w * h;

  const baseVal = metric(8, 10);
  const ratio = Math.max(metric(wh[0], wh[1]) / baseVal, 1);
  const base = Math.pow(ratio, exponent);
  const tailed = withSoftKnee(ratio, base, knee, slope);
  return clamp(tailed, minMult, maxMult);
};
