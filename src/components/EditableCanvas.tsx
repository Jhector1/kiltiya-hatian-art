"use client";

import { useUser } from "@/contexts/UserContext";
import React, { useEffect, useRef, useState } from "react";
import ExportFormatBar from "./ExportFormatBar";

/* ---------- Types ---------- */
export type StyleState = {
  fillColor: string;
  fillOpacity?: number; // 0..1
  strokeColor: string;
  strokeOpacity?: number; // 0..1
  strokeWidth: number;
  backgroundColor: string;
  backgroundOpacity?: number; // 0..1
  defs?: string;
};

type LinearStop = { offset: number; color: string; opacity?: number };

type GradientDef =
  | { id: string; from: string; to: string; angle?: number }
  | { id: string; angle?: number; stops: LinearStop[] };

/* ---------- Utils ---------- */
// turn any angle into x1,y1,x2,y2 in %
const angleToVec = (angle = 0) => {
  const a = ((((angle % 360) + 360) % 360) * Math.PI) / 180;
  const x = Math.cos(a),
    y = Math.sin(a);
  const x1 = (0.5 - x / 2) * 100;
  const y1 = (0.5 - y / 2) * 100;
  const x2 = (0.5 + x / 2) * 100;
  const y2 = (0.5 + y / 2) * 100;
  return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` };
};

const DEFAULT_STYLE: StyleState = {
  fillColor: "#FFD700",
  strokeColor: "#000000",
  strokeWidth: 2,
  backgroundColor: "#ffffff",
};

// Solid colors
const SOLIDS = [
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

// Gradients
const GRADIENTS: GradientDef[] = [
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

// Patterns
type PatternDef = { id: string; svg: string; preview: string };
const PATTERNS: PatternDef[] = [
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

// returns a CSS-ready background-image value (for preview chips)
const gradientPreview = (g: GradientDef) => {
  if ("stops" in g) {
    const def = buildLinearGradientDef(g);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32"><defs>${def}</defs><rect width="48" height="32" fill="url(#${g.id})"/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }
  return `linear-gradient(${g.angle ?? 0}deg, ${g.from}, ${g.to})`;
};

// Build <linearGradient> defs from a gradient item
function buildLinearGradientDef(g: GradientDef) {
  const { x1, y1, x2, y2 } = angleToVec(g.angle ?? 0);
  if ("stops" in g) {
    const stopsMarkup = g.stops
      .map(
        (s) =>
          `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${
            s.color
          }"${s.opacity != null ? ` stop-opacity="${s.opacity}"` : ""}/>`
      )
      .join("\n");
    return `<linearGradient id="${g.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsMarkup}</linearGradient>`.trim();
  }
  return `<linearGradient id="${g.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${g.from}"/><stop offset="100%" stop-color="${g.to}"/></linearGradient>`.trim();
}

const safeColorValue = (v: string) => (v.startsWith("url(") ? "#000000" : v);

const EXPORT_FORMATS = ["png", "jpg", "webp", "tiff", "svg"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
type SaveResp = {
  ok: boolean;
  canExport: boolean;
  exportsLeft: number;
  purchased: boolean;
};

/* =================================================================== */
/*                           COMPONENT                                  */
/* =================================================================== */
export default function EditableCanvas({ productId }: { productId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [style, setStyle] = useState<StyleState>(DEFAULT_STYLE);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(false); // RESPONSIVE: mobile toggle

  const [exportMode, setExportMode] = useState<"scale" | "px" | "print">(
    "scale"
  );
  const [scale, setScale] = useState<number>(1);
  const [outW, setOutW] = useState<string>("");
  const [outH, setOutH] = useState<string>("");
  const [dpi, setDpi] = useState<number>(300);
  const [unit, setUnit] = useState<"in" | "mm">("in");
  const [printW, setPrintW] = useState<number>(8);
  const [printH, setPrintH] = useState<number>(10);

  const [baseW, setBaseW] = useState<number>(0);
  const [baseH, setBaseH] = useState<number>(0);

  const [target, setTarget] = useState<"background" | "fill" | "stroke">(
    "fill"
  );
  const { isLoggedIn } = useUser();
  const [defsMap, setDefsMap] = useState<Record<string, string>>({});
  const [canExport, setCanExport] = useState<boolean>(false);
  const [exportsLeft, setExportsLeft] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  // on mount: fetch status
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/products/${productId}/saveUserDesign/status`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) return;
        const j = await res.json();
        setCanExport(!!j.canExport);
        setExportsLeft(j.exportsLeft ?? 0);
      } catch {}
    })();
  }, [productId]);

  // Initial preview (with last saved if exists)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const s = await fetch(`/api/products/${productId}/saveUserDesign`, {
          cache: "no-store",
        });
        if (s.ok) {
          const j = await s.json();
          if (!cancelled && j?.found) {
            const savedStyle = { ...DEFAULT_STYLE, ...(j.style || {}) };
            const savedDefs: string = j.defs || "";
            setStyle(savedStyle);
            setDefsMap(savedDefs ? { __persisted: savedDefs } : {});
            requestPreview(savedStyle, savedDefs);
            return;
          }
        }
        const res = await fetch(`/api/products/${productId}/live-preview`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load preview");
        const blob = await res.blob();
        if (!cancelled) setPreviewUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Draw PNG on canvas (scaled by zoom)
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const w = img.width;
      const h = img.height;
      setBaseW(w);
      setBaseH(h);

      canvas.width = Math.max(1, Math.floor(w * zoom));
      canvas.height = Math.max(1, Math.floor(h * zoom));
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        (ctx as any).imageSmoothingEnabled = true;
        (ctx as any).imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = previewUrl;
  }, [previewUrl, zoom]);

  const saveDesign = async () => {
    setSaving(true);
    try {
      const defsNow = Object.values(defsMap).join("\n");
      const res = await fetch(`/api/products/${productId}/saveUserDesign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: { ...style, defs: defsNow } }),
      });
      if (res.status === 401) {
        alert("Please sign in to save.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      const j: SaveResp = await res.json();
      setCanExport(j.canExport);
      setExportsLeft(j.exportsLeft);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Debounced preview
  const previewTimer = useRef<number | null>(null);
  const requestPreview = (styleToSend: StyleState, defsToSend: string) => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/live-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...styleToSend, defs: defsToSend }),
        });
        if (!res.ok) throw new Error("Failed to update preview");
        const blob = await res.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  // Change style (single source of truth)
  const handleStyleChange = <K extends keyof StyleState>(
    field: K,
    value: StyleState[K],
    defsOverride?: string
  ) => {
    setStyle((prev) => {
      const next = { ...prev, [field]: value };
      const defsNow = defsOverride ?? Object.values(defsMap).join("\n");
      requestPreview(next, defsNow);
      return next;
    });
  };

  // Quick client-side PNG
  const quickDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `art-${productId}-${Date.now()}.png`;
    a.click();
  };

  // Export
  const exportArtwork = async (format: ExportFormat) => {
    if (!canExport) {
      alert("Purchase required or export limit reached.");
      return;
    }
    setExporting(true);
    try {
      const defsNow = Object.values(defsMap).join("\n");

      const sizePayload: any = {};
      if (exportMode === "scale") {
        sizePayload.scale = Math.max(0.05, Math.min(10, scale || 1));
      } else if (exportMode === "px") {
        const w = parseInt(outW || "", 10);
        const h = parseInt(outH || "", 10);
        if (Number.isFinite(w)) sizePayload.width = w;
        if (Number.isFinite(h)) sizePayload.height = h;
      } else if (exportMode === "print") {
        sizePayload.print = { unit, width: printW, height: printH, dpi };
      }

      const res = await fetch(`/api/products/${productId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: { ...style, defs: defsNow },
          format,
          ...sizePayload,
          saveToLibrary,
          filename: `art-${productId}-${Date.now()}.${
            format === "jpg" ? "jpg" : format
          }`,
        }),
      });

      if (res.status === 401) {
        alert("Please sign in to save to your Library.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Export failed");
      }

      const contentType = res.headers.get("Content-Type") || "";
      const isJson = contentType.includes("application/json");

      if (isJson) {
        const data = (await res.json()) as { url: string; id?: string };
        if (data.url) {
          if (!saveToLibrary) {
            const dl = document.createElement("a");
            dl.href = data.url;
            dl.download = `art-${productId}.${format}`;
            dl.click();
          } else {
            alert("Saved to your Library ✨");
          }
        }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `art-${productId}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      try {
        const st = await fetch(`/api/products/${productId}/status`, {
          cache: "no-store",
        });
        if (st.ok) {
          const j = await st.json();
          setCanExport(!!j.canExport);
          setExportsLeft(j.exportsLeft ?? 0);
        }
      } catch {}
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveClick = () => {
    if (!isLoggedIn) {
      alert("Please log in first to save your design.");
      return;
    }
    void saveDesign();
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50 p-3 md:p-4 ring-1 ring-black/5">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.125rem,2.5vw,1.5rem)] font-semibold">
            SVG Playground
          </h1>
          <p className="text-sm text-black/60">
            Edit colors & stroke, then export in PNG/JPG/WebP/TIFF/SVG.
          </p>
        </div>

        {/* Actions (RESPONSIVE: wrap, full-width on mobile) */}
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveClick}
            disabled={saving || loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 bg-white hover:bg-emerald-50 disabled:opacity-60"
            title="Save your current edit"
          >
            💾 Save
          </button>

          <button
            onClick={quickDownloadPng}
            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 bg-white hover:bg-amber-50 disabled:opacity-60"
            disabled={loading}
            title="Quick download current view as PNG (client-side)"
          >
            Quick PNG
          </button>

          {/* Export box (RESPONSIVE: scrollable on XS) */}
          <ExportFormatBar
            formats={["png", "jpg", "webp", "tiff", "svg"]}
            canExport={canExport}
            exporting={exporting}
            loading={loading}
            exportsLeft={exportsLeft}
            onExport={(fmt) => exportArtwork(fmt)}
          />

          {/* Mobile Controls Toggle */}
          <button
            className="sm:hidden inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 bg-white hover:bg-emerald-50"
            onClick={() => setShowControls((s) => !s)}
            aria-expanded={showControls}
            aria-controls="controls-panel"
          >
            {showControls ? "Hide Controls" : "Show Controls"}
          </button>
        </div>
      </div>

      {/* Canvas + Controls */}
      <div
        className="
          mt-4 grid grid-cols-1
          md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] gap-4
        "
      >
        {/* Canvas */}
        <div className="relative rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm text-black/70">Zoom</label>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="sm:w-14 text-right tabular-nums text-xs text-black/60">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* RESPONSIVE canvas wrapper: keeps canvas visible on tiny screens */}
          <div className="relative grid place-items-center overflow-auto rounded-xl bg-[conic-gradient(at_20%_20%,#fafafa,#f4f4f5)] p-2 sm:p-4 max-h-[70vh] md:max-h-[72vh] touch-pan-y">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto shadow-sm ring-1 ring-black/5"
            />
            {loading && (
              <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/60 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <aside
          id="controls-panel"
          className={`
            rounded-2xl bg-white p-4 ring-1 ring-black/5
            ${showControls ? "block" : "hidden"} sm:block
            md:sticky md:top-4 md:h-fit
          `}
        >
          {/* Swatch Palette */}
          <div className="mb-4 rounded-2xl border border-black/10 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-black/70">Palette</h3>
              <div className="flex overflow-hidden rounded-xl ring-1 ring-black/10">
                {(["fill", "stroke", "background"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTarget(k)}
                    className={`px-3 py-1 text-xs capitalize ${
                      target === k
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-white hover:bg-emerald-50"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Solids (RESPONSIVE grid) */}
            <div className="mb-3">
              <div className="mb-1 text-xs text-black/50">Solids</div>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {SOLIDS.map((c) => (
                  <button
                    key={c}
                    className="group h-8 w-8 sm:h-7 sm:w-7 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition"
                    style={{ background: c }}
                    title={c}
                    onClick={() => {
                      const key =
                        target === "background"
                          ? "backgroundColor"
                          : target === "fill"
                          ? "fillColor"
                          : "strokeColor";
                      handleStyleChange(key as keyof StyleState, c as any);
                    }}
                  >
                    <span className="sr-only">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gradients (RESPONSIVE grid) */}
            <div className="mb-3">
              <div className="mb-1 text-xs text-black/50">Gradients</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    className="h-8 w-12 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition bg-white"
                    style={{
                      backgroundImage: gradientPreview(g),
                      backgroundSize: "cover", // helps on high DPR phones
                    }}
                    title={
                      "stops" in g
                        ? g.id
                        : `${(g as any).from} → ${(g as any).to}`
                    }
                    onClick={() => {
                      const newMap = {
                        ...defsMap,
                        [g.id]: buildLinearGradientDef(g),
                      };
                      setDefsMap(newMap);
                      const key =
                        target === "background"
                          ? "backgroundColor"
                          : target === "fill"
                          ? "fillColor"
                          : "strokeColor";
                      const newDefsString = Object.values(newMap).join("\n");
                      handleStyleChange(
                        key as keyof StyleState,
                        `url(#${g.id})` as any,
                        newDefsString
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Patterns (RESPONSIVE grid) */}
            <div>
              <div className="mb-1 text-xs text-black/50">Patterns</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    className="h-8 w-12 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition bg-white"
                    style={{
                      backgroundImage: `url("${p.preview}")`,
                      backgroundSize: "cover",
                    }}
                    title={p.id.replace("pat-", "")}
                    onClick={() => {
                      const newMap = { ...defsMap, [p.id]: p.svg };
                      setDefsMap(newMap);
                      const key =
                        target === "background"
                          ? "backgroundColor"
                          : target === "fill"
                          ? "fillColor"
                          : "strokeColor";
                      const newDefsString = Object.values(newMap).join("\n");
                      handleStyleChange(
                        key as keyof StyleState,
                        `url(#${p.id})` as any,
                        newDefsString
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <h2 className="mb-3 text-sm font-semibold text-black/70">
            Appearance
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60">Fill</span>
              <input
                type="color"
                value={safeColorValue(style.fillColor)}
                onChange={(e) => handleStyleChange("fillColor", e.target.value)}
                className="h-10 w-full rounded-md border border-black/10"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60">Stroke</span>
              <input
                type="color"
                value={safeColorValue(style.strokeColor)}
                onChange={(e) =>
                  handleStyleChange("strokeColor", e.target.value)
                }
                className="h-10 w-full rounded-md border border-black/10"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs">
              <span className="text-black/60">Background</span>
              <input
                type="color"
                value={safeColorValue(style.backgroundColor)}
                onChange={(e) =>
                  handleStyleChange("backgroundColor", e.target.value)
                }
                className="h-10 w-full rounded-md border border-black/10"
              />
            </label>

            {/* Sliders */}
            <label className="col-span-2 flex items-center gap-3 text-xs">
              <span className="w-24 text-black/60">Stroke Width</span>
              <input
                type="range"
                min={0}
                max={16}
                step={0.5}
                value={style.strokeWidth}
                onChange={(e) =>
                  handleStyleChange("strokeWidth", parseFloat(e.target.value))
                }
                className="w-full"
              />
              <span className="w-12 text-right tabular-nums">
                {style.strokeWidth}
              </span>
            </label>

            <label className="flex items-center gap-3 text-xs">
              <span className="w-24 text-black/60">Fill Opacity</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={style.fillOpacity ?? 1}
                onChange={(e) =>
                  handleStyleChange("fillOpacity", parseFloat(e.target.value))
                }
                className="w-full"
              />
              <span className="w-12 text-right tabular-nums">
                {(style.fillOpacity ?? 1).toFixed(2)}
              </span>
            </label>

            <label className="flex items-center gap-3 text-xs">
              <span className="w-24 text-black/60">Stroke Opacity</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={style.strokeOpacity ?? 1}
                onChange={(e) =>
                  handleStyleChange("strokeOpacity", parseFloat(e.target.value))
                }
                className="w-full"
              />
              <span className="w-12 text-right tabular-nums">
                {(style.strokeOpacity ?? 1).toFixed(2)}
              </span>
            </label>

            <label className="flex items-center gap-3 text-xs">
              <span className="w-24 text-black/60">Background Opacity</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={style.backgroundOpacity ?? 1}
                onChange={(e) =>
                  handleStyleChange(
                    "backgroundOpacity",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full"
              />
              <span className="w-12 text-right tabular-nums">
                {(style.backgroundOpacity ?? 1).toFixed(2)}
              </span>
            </label>
          </div>

          {/* Export size */}
          <div className="mt-4">
            <h2 className="mb-3 text-sm font-semibold text-black/70">
              Export size
            </h2>

            {/* Segmented control (scrolls on XS) */}
            <div className="mb-2 flex gap-1 rounded-xl bg-white ring-1 ring-black/10 p-1 overflow-x-auto">
              {(["scale", "px", "print"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setExportMode(m)}
                  className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${
                    exportMode === m
                      ? "bg-emerald-100 text-emerald-900"
                      : "hover:bg-emerald-50"
                  }`}
                >
                  {m === "px" ? "Pixels" : m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {exportMode === "scale" && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-black/60">Scale</span>
                  <input
                    type="range"
                    min={0.25}
                    max={4}
                    step={0.05}
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="w-14 text-right tabular-nums">
                    {(scale * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-black/60">
                  Base: {baseW}×{baseH}px → Export: {Math.round(baseW * scale)}×
                  {Math.round(baseH * scale)}px
                </div>
              </div>
            )}

            {exportMode === "px" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="text-black/60">Width (px)</span>
                  <input
                    className="h-9 rounded-md border border-black/10 px-2"
                    value={outW}
                    onChange={(e) =>
                      setOutW(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder={String(baseW)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-black/60">Height (px)</span>
                  <input
                    className="h-9 rounded-md border border-black/10 px-2"
                    value={outH}
                    onChange={(e) =>
                      setOutH(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder={String(baseH)}
                  />
                </label>
                <div className="col-span-2 text-black/50">
                  Tip: leave one side empty to keep aspect ratio (server will
                  fit).
                </div>
              </div>
            )}

            {exportMode === "print" && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label className="flex flex-col gap-1 col-span-1">
                  <span className="text-black/60">Unit</span>
                  <select
                    className="h-9 rounded-md border border-black/10 px-2"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                  >
                    <option value="in">in</option>
                    <option value="mm">mm</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-black/60">Width</span>
                  <input
                    className="h-9 rounded-md border border-black/10 px-2"
                    type="number"
                    step="0.1"
                    value={printW}
                    onChange={(e) => setPrintW(parseFloat(e.target.value) || 0)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-black/60">Height</span>
                  <input
                    className="h-9 rounded-md border border-black/10 px-2"
                    type="number"
                    step="0.1"
                    value={printH}
                    onChange={(e) => setPrintH(parseFloat(e.target.value) || 0)}
                  />
                </label>
                <label className="flex flex-col gap-1 col-span-3">
                  <span className="text-black/60">DPI</span>
                  <input
                    className="h-9 rounded-md border border-black/10 px-2"
                    type="number"
                    step="1"
                    value={dpi}
                    onChange={(e) => setDpi(parseInt(e.target.value) || 300)}
                  />
                </label>
                <div className="col-span-3 text-black/50">
                  Output ≈{" "}
                  {unit === "mm"
                    ? Math.round((printW / 25.4) * dpi)
                    : Math.round(printW * dpi)}
                  ×
                  {unit === "mm"
                    ? Math.round((printH / 25.4) * dpi)
                    : Math.round(printH * dpi)}{" "}
                  px
                </div>
              </div>
            )}
          </div>

          {/* Save to Library toggle (kept simple, but visible on small) */}
          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
              />
              Save exports to my Library
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}
