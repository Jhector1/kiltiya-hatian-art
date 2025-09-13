import { Prisma } from "@prisma/client";

export const toJsonInput = (
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =>
  v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);

export const toNullableJson = (
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | null =>
  v == null ? null : (v as Prisma.InputJsonValue);

// Robust "WxH" parser: 8x10, 8 × 10, 8" x 10", 8in x 10in, etc.
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

// Floating-point-safe rounding to a step (e.g., 0.05)
const roundTo = (v: number, step = 0.05) => {
  const dec = Math.max(0, (step.toString().split(".")[1] || "").length);
  const k = Math.round(v / step + Number.EPSILON);
  const res = k * step;
  return parseFloat(res.toFixed(dec));
};

export type SizeMathOptions = {
  method?: "area" | "perimeter" | "max-dim";
  exponent?: number;     // main growth (< 1.0)
  minMult?: number;      // floor
  maxMult?: number;      // set to Infinity for "no stop"
  step?: number;         // rounding for UI
  knee?: number;         // start of soft-knee in raw ratio (e.g. 6×)
  slope?: number;        // 0..1 strength of log-tail beyond knee
  /** NEW (optional): choose baseline for ratios.
   *  - "min"   : smallest in the list (default)
   *  - "first" : first entry in the list
   *  - "8x10"  : or any WxH string to anchor all sizes
   */
  baseline?: "min" | "first" | string;
};

const METHOD = "area";
const EXPONENT = 0.3;     // gentle sub-linear growth
const MIN_MULT = 1.0;
const MAX_MULT = Infinity;
const STEP = 0.05;
const KNEE = 6;           // begin soft knee ~6× base metric
const SLOPE = 0.18;       // tail strength; lower = slower

// Soft-knee: after ratio > knee, add a tiny log-based tail so it never stops
const withSoftKnee = (
  ratio: number,
  moderated: number,
  knee = KNEE,
  slope = SLOPE
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
    exponent = EXPONENT,
    minMult = MIN_MULT,
    maxMult = MAX_MULT,
    step = STEP,
    knee = KNEE,
    slope = SLOPE,
    baseline = "min",
  } = opts || {};

  if (!sizes?.length) return [];

  const parsed = sizes.map(parseWh);
  const allParsed = parsed.every((p): p is [number, number] => Array.isArray(p));

  const metric = (w: number, h: number) =>
    method === "perimeter" ? w + h :
    method === "max-dim"  ? Math.max(w, h) :
    w * h; // default: area

  if (allParsed) {
    const values = parsed.map(([w, h]) => metric(w, h));

    // pick baseline
    let baseVal: number | null = null;
    if (baseline === "first") {
      const [bw, bh] = parsed[0];
      baseVal = metric(bw, bh);
    } else if (baseline === "min") {
      baseVal = Math.min(...values);
    } else if (typeof baseline === "string") {
      const p = parseWh(baseline);
      if (p) baseVal = metric(p[0], p[1]);
    }
    if (!baseVal || !isFinite(baseVal) || baseVal <= 0) {
      baseVal = Math.min(...values);
    }

    if (!isFinite(baseVal) || baseVal <= 0) {
      // Extremely defensive fallback
      return sizes.map((label, i) => ({
        label,
        multiplier: roundTo(1 + i * 0.05, step),
      }));
    }

    return sizes.map((label, i) => {
      const ratio = Math.max(values[i] / baseVal, 1);         // ≥ 1
      const base = Math.pow(ratio, exponent);                 // sub-linear
      const tailed = withSoftKnee(ratio, base, knee, slope);  // keep rising slowly
      const bounded = clamp(tailed, minMult, maxMult);
      return { label, multiplier: roundTo(bounded, step) };   // ALWAYS rounded
    });
  }

  // fallback: gentle steps (RESPECT step)
  return sizes.map((label, i) => ({
    label,
    multiplier: roundTo(1 + i * 0.05, (opts && opts.step) ?? STEP),
  }));
};

/** Single-size lookup (same soft-knee behavior, same rounding). */
export const getSizeMultiplier = (
  size: string | null | undefined,
  allSizes: string[] | undefined,
  opts?: Parameters<typeof cleanSizes>[1]
): number => {
  const {
    method = METHOD,
    exponent = EXPONENT,
    minMult = MIN_MULT,
    maxMult = MAX_MULT,
    step = STEP,
    knee = KNEE,
    slope = SLOPE,
    baseline = "min",
  } = opts || {};

  if (!size) return 1;

  // If we have a table, use it (ensures exact consistency with cleanSizes)
  const table = cleanSizes(allSizes, opts);
  const hit = table.find(
    (x) => x.label.trim().toLowerCase() === size.trim().toLowerCase()
  );
  if (hit) return hit.multiplier;

  // Compute directly (and ROUND) with the SAME baseline rules
  const wh = parseWh(size);
  if (!wh) return 1;

  // choose base dimensions
  let baseW = 8, baseH = 10; // sensible default
  if (baseline === "first" && allSizes?.length) {
    const p = parseWh(allSizes[0]);
    if (p) [baseW, baseH] = p;
  } else if (baseline === "min" && allSizes?.length) {
    const ps = allSizes.map(parseWh).filter(Boolean) as [number, number][];
    if (ps.length) {
      const areas = ps.map(([w, h]) => metric(w, h, method));
      let idx = 0, min = areas[0];
      for (let i = 1; i < areas.length; i++) {
        if (areas[i] < min) { min = areas[i]; idx = i; }
      }
      [baseW, baseH] = ps[idx];
    }
  } else if (typeof baseline === "string") {
    const p = parseWh(baseline);
    if (p) [baseW, baseH] = p;
  }

  const metric = (w: number, h: number, m: SizeMathOptions["method"]) =>
    m === "perimeter" ? w + h :
    m === "max-dim"  ? Math.max(w, h) :
    w * h;

  const baseVal = metric(baseW, baseH, method);
  const ratio = Math.max(metric(wh[0], wh[1], method) / baseVal, 1);
  const base = Math.pow(ratio, exponent);
  const tailed = withSoftKnee(ratio, base, knee, slope);
  const bounded = clamp(tailed, minMult, maxMult);
  return roundTo(bounded, step); // ALWAYS rounded
};



 // at the top of the file (or near where you use it)
export const toDate = (v: Date | string | null | undefined): Date | null => {
  if (!v) return null;
  return typeof v === "string" ? new Date(v) : v;
};