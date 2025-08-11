// ───────────────────────────────────────────────────────────
// file: src/components/editor/constants.ts
// ───────────────────────────────────────────────────────────
import type { StyleState, GradientDef, PatternDef } from "../types";

export const DEFAULT_STYLE: StyleState = {
  fillColor: "#ffffffff",
  strokeColor: "#000000",
  strokeWidth: 2,
  backgroundColor: "#ffffff",
};

export const SOLIDS: string[] = [
  "#000000",
  "#ffffff",
  "#f2f2f2",
  "#222222",
  "#0055A4",
  "#EF3340",
  "#FFD700",
  "#00B894",
  "#1B9CFC",
  "#8E44AD",
  "#E67E22",
  "#2ECC71",
  "#C0392B",
  "#34495E",
];

export const GRADIENTS: GradientDef[] = [
  { id: "grad-sunrise", from: "#ff9a9e", to: "#fad0c4", angle: 45 },
  { id: "grad-lagon", from: "#00c6ff", to: "#0072ff", angle: 30 },
  { id: "grad-rouge", from: "#EF3340", to: "#FF6B6B", angle: 0 },
  { id: "grad-zile", from: "#00B894", to: "#1B9CFC", angle: 90 },
  {
    id: "grad-rainbow",
    angle: 0,
    stops: [
      { offset: 0.0, color: "#ef1f7e" },
      { offset: 0.08, color: "#f1425f" },
      { offset: 0.2, color: "#f57037" },
      { offset: 0.22, color: "#f67f32" },
      { offset: 0.32, color: "#f9b225" },
      { offset: 0.37, color: "#fbc620" },
      { offset: 0.55, color: "#8cc63e" },
      { offset: 0.75, color: "#00c6ff" },
      { offset: 1.0, color: "#5856D6" },
    ],
  },
  {
    id: "grad-trans",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#5BCEFA" },
      { offset: 0.2, color: "#5BCEFA" },
      { offset: 0.2, color: "#F5A9B8" },
      { offset: 0.4, color: "#F5A9B8" },
      { offset: 0.4, color: "#FFFFFF" },
      { offset: 0.6, color: "#FFFFFF" },
      { offset: 0.6, color: "#F5A9B8" },
      { offset: 0.8, color: "#F5A9B8" },
      { offset: 0.8, color: "#5BCEFA" },
      { offset: 1.0, color: "#5BCEFA" },
    ],
  },
  {
    id: "grad-nonbinary",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#FFF430" },
      { offset: 0.25, color: "#FFF430" },
      { offset: 0.25, color: "#FFFFFF" },
      { offset: 0.5, color: "#FFFFFF" },
      { offset: 0.5, color: "#9C59D1" },
      { offset: 0.75, color: "#9C59D1" },
      { offset: 0.75, color: "#000000" },
      { offset: 1.0, color: "#000000" },
    ],
  },
  {
    id: "grad-bi",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#D60270" },
      { offset: 0.4, color: "#D60270" },
      { offset: 0.4, color: "#9B4F96" },
      { offset: 0.6, color: "#9B4F96" },
      { offset: 0.6, color: "#0038A8" },
      { offset: 1.0, color: "#0038A8" },
    ],
  },
  {
    id: "grad-pan",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#FF1B8D" },
      { offset: 0.3333, color: "#FF1B8D" },
      { offset: 0.3333, color: "#FFD800" },
      { offset: 0.6667, color: "#FFD800" },
      { offset: 0.6667, color: "#1BB3FF" },
      { offset: 1.0, color: "#1BB3FF" },
    ],
  },
  {
    id: "grad-lesbian7",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#D52D00" },
      { offset: 0.1429, color: "#D52D00" },
      { offset: 0.1429, color: "#EF7627" },
      { offset: 0.2857, color: "#EF7627" },
      { offset: 0.2857, color: "#FF9A56" },
      { offset: 0.4286, color: "#FF9A56" },
      { offset: 0.4286, color: "#FFFFFF" },
      { offset: 0.5714, color: "#FFFFFF" },
      { offset: 0.5714, color: "#D162A4" },
      { offset: 0.7143, color: "#D162A4" },
      { offset: 0.7143, color: "#B55690" },
      { offset: 0.8571, color: "#B55690" },
      { offset: 0.8571, color: "#A30262" },
      { offset: 1.0, color: "#A30262" },
    ],
  },
  {
    id: "grad-ace",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#000000" },
      { offset: 0.25, color: "#000000" },
      { offset: 0.25, color: "#A4A4A4" },
      { offset: 0.5, color: "#A4A4A4" },
      { offset: 0.5, color: "#FFFFFF" },
      { offset: 0.75, color: "#FFFFFF" },
      { offset: 0.75, color: "#800080" },
      { offset: 1.0, color: "#800080" },
    ],
  },
  {
    id: "grad-genderfluid",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#FF75A2" },
      { offset: 0.2, color: "#FF75A2" },
      { offset: 0.2, color: "#FFFFFF" },
      { offset: 0.4, color: "#FFFFFF" },
      { offset: 0.4, color: "#BE18D6" },
      { offset: 0.6, color: "#BE18D6" },
      { offset: 0.6, color: "#000000" },
      { offset: 0.8, color: "#000000" },
      { offset: 0.8, color: "#333EBD" },
      { offset: 1.0, color: "#333EBD" },
    ],
  },
  {
    id: "grad-agender",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#000000" },
      { offset: 0.1429, color: "#000000" },
      { offset: 0.1429, color: "#B9B9B9" },
      { offset: 0.2857, color: "#B9B9B9" },
      { offset: 0.2857, color: "#FFFFFF" },
      { offset: 0.4286, color: "#FFFFFF" },
      { offset: 0.4286, color: "#B8F483" },
      { offset: 0.5714, color: "#B8F483" },
      { offset: 0.5714, color: "#FFFFFF" },
      { offset: 0.7143, color: "#FFFFFF" },
      { offset: 0.7143, color: "#B9B9B9" },
      { offset: 0.8571, color: "#B9B9B9" },
      { offset: 0.8571, color: "#000000" },
      { offset: 1.0, color: "#000000" },
    ],
  },
  {
    id: "grad-aromantic",
    angle: 90,
    stops: [
      { offset: 0.0, color: "#3DA542" },
      { offset: 0.2, color: "#3DA542" },
      { offset: 0.2, color: "#A7D379" },
      { offset: 0.4, color: "#A7D379" },
      { offset: 0.4, color: "#FFFFFF" },
      { offset: 0.6, color: "#FFFFFF" },
      { offset: 0.6, color: "#A9A9A9" },
      { offset: 0.8, color: "#A9A9A9" },
      { offset: 0.8, color: "#000000" },
      { offset: 1.0, color: "#000000" },
    ],
  },
];

export const PATTERNS: PatternDef[] = [
  {
    id: "pat-stripes",
    svg: `
<pattern id="pat-stripes" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
  <rect width="12" height="12" fill="white"/>
  <rect x="0" y="0" width="6" height="12" fill="#f2f2f2"/>
</pattern>`.trim(),
    preview:
      `data:image/svg+xml;utf8,` +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="white"/><rect width="32" height="32" fill="url(#pat-stripes)"/><defs><pattern id="pat-stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="white"/><rect width="4" height="8" fill="#f2f2f2"/></pattern></defs></svg>`
      ),
  },
  {
    id: "pat-dots",
    svg: `
<pattern id="pat-dots" patternUnits="userSpaceOnUse" width="12" height="12">
  <rect width="12" height="12" fill="white"/>
  <circle cx="3" cy="3" r="1.8" fill="#e6e6e6"/>
</pattern>`.trim(),
    preview:
      `data:image/svg+xml;utf8,` +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="white"/><rect width="32" height="32" fill="url(#pat-dots)"/><defs><pattern id="pat-dots" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="white"/><circle cx="2.5" cy="2.5" r="1.6" fill="#e6e6e6"/></pattern></defs></svg>`
      ),
  },
  {
    id: "pat-grid",
    svg: `
<pattern id="pat-grid" patternUnits="userSpaceOnUse" width="16" height="16">
  <rect width="16" height="16" fill="white"/>
  <path d="M0 0H16M0 0V16" stroke="#eaeaea" stroke-width="1"/>
</pattern>`.trim(),
    preview:
      `data:image/svg+xml;utf8,` +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="white"/><rect width="32" height="32" fill="url(#pat-grid)"/><defs><pattern id="pat-grid" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="white"/><path d="M0 0H8M0 0V8" stroke="#eaeaea" stroke-width="1"/></pattern></defs></svg>`
      ),
  },
];