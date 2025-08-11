// ───────────────────────────────────────────────────────────
// file: src/components/editor/ui/EditorHeaderBar.tsx
// ───────────────────────────────────────────────────────────
"use client";

import React from "react";
import type { ExportFormat } from "../types";
import ExportFormatBar from "./ExportFormatBar";

interface Props {
  loading: boolean;
  saving: boolean;
  canExport: boolean;
  purchased: boolean;
  exporting: boolean;
  exportsLeft: number;
  onSave: () => void;
  onQuickPng: () => void;
  onExport: (fmt: ExportFormat) => void;
  showControls: boolean;
  onPurchaseClick: () => void; // NEW

  setShowControls: (f: (prev: boolean) => boolean) => void;
  onPurchaseArtClick: () => void;
}

export default function EditorHeaderBar({
  loading,
  saving,
  canExport,purchased,
  exporting,
  exportsLeft,
  onSave,
  onQuickPng,
  onExport,
  showControls,
  setShowControls,
  onPurchaseClick,
  onPurchaseArtClick,
}: Props) {
  // alert(purchased)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50 p-3 md:p-4 ring-1 ring-black/5">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.125rem,2.5vw,1.5rem)] font-semibold">
          Zile Studio
        </h1>
        <p className="text-sm text-black/60">
          Edit colors & stroke, then export in PNG/JPG/WebP/TIFF/SVG.
        </p>
      </div>

      <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving || loading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 bg-white hover:bg-emerald-50 disabled:opacity-60"
          title="Save your current edit"
        >
          💾 Save
        </button>

        <button
          onClick={onQuickPng}
          className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 bg-white hover:bg-amber-50 disabled:opacity-60"
          disabled={loading}
          title="Quick download current view as PNG (client-side)"
        >
          Quick PNG
        </button>
        <span
          className={[
            "inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium ring-1",
            exportsLeft <= 3
              ? "text-amber-900 bg-amber-50 ring-amber-200"
              : "text-black/70 bg-white ring-black/10",
          ].join(" ")}
          title="Exports remaining"
        >
          {exportsLeft} left
        </span>

        {/* Buy exports */}
        <button
          onClick={onPurchaseClick}
          className={[
            "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium",
            "ring-1 ring-emerald-600/20",
            exportsLeft === 0 || !canExport
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white text-emerald-700 hover:bg-emerald-50",
          ].join(" ")}
        >
          Buy exports
        </button>
        {/* <div className="mt-2 mb-[-6px] flex justify-end"> */}
         {!purchased && <button
            onClick={onPurchaseArtClick}
            className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 ring-1 ring-indigo-600/20"
          >
            Purchase Now
          </button>}
        {/* </div> */}
        <ExportFormatBar
        purchased={purchased}
          formats={["png", "jpg", "webp", "tiff", "svg"]}
          canExport={canExport}
          exporting={exporting}
          loading={loading}
          exportsLeft={exportsLeft}
          onExport={onExport}
        />

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
  );
}
