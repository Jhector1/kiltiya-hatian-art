
// ───────────────────────────────────────────────────────────
// file: src/components/editor/ui/AppearanceControls.tsx
// ───────────────────────────────────────────────────────────
"use client";

import React from "react";
import { useDesignContext } from "../contexts/DesignContext";
import { safeColorValue } from "../utils/svg";

export default function AppearanceControls() {
  const { style, handleStyleChange } = useDesignContext();
  return (
    < div   id="controls-panel"
>
      <h2 className="mb-3 text-sm font-semibold text-black/70">Appearance</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-black/60">Fill</span>
          <input type="color" value={safeColorValue(style.fillColor)} onChange={(e) => handleStyleChange("fillColor", e.target.value)} className="h-10 w-full rounded-md border border-black/10" />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-black/60">Stroke</span>
          <input type="color" value={safeColorValue(style.strokeColor)} onChange={(e) => handleStyleChange("strokeColor", e.target.value)} className="h-10 w-full rounded-md border border-black/10" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs">
          <span className="text-black/60">Background</span>
          <input type="color" value={safeColorValue(style.backgroundColor)} onChange={(e) => handleStyleChange("backgroundColor", e.target.value)} className="h-10 w-full rounded-md border border-black/10" />
        </label>

        <label className="col-span-2 flex items-center gap-3 text-xs">
          <span className="w-24 text-black/60">Stroke Width</span>
          <input type="range" min={0} max={16} step={0.5} value={style.strokeWidth} onChange={(e) => handleStyleChange("strokeWidth", parseFloat(e.target.value))} className="w-full" />
          <span className="w-12 text-right tabular-nums">{style.strokeWidth}</span>
        </label>

        <label className="flex items-center gap-3 text-xs">
          <span className="w-24 text-black/60">Fill Opacity</span>
          <input type="range" min={0} max={1} step={0.01} value={style.fillOpacity ?? 1} onChange={(e) => handleStyleChange("fillOpacity", parseFloat(e.target.value))} className="w-full" />
          <span className="w-12 text-right tabular-nums">{(style.fillOpacity ?? 1).toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-3 text-xs">
          <span className="w-24 text-black/60">Stroke Opacity</span>
          <input type="range" min={0} max={1} step={0.01} value={style.strokeOpacity ?? 1} onChange={(e) => handleStyleChange("strokeOpacity", parseFloat(e.target.value))} className="w-full" />
          <span className="w-12 text-right tabular-nums">{(style.strokeOpacity ?? 1).toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-3 text-xs">
          <span className="w-24 text-black/60">Background Opacity</span>
          <input type="range" min={0} max={1} step={0.01} value={style.backgroundOpacity ?? 1} onChange={(e) => handleStyleChange("backgroundOpacity", parseFloat(e.target.value))} className="w-full" />
          <span className="w-12 text-right tabular-nums">{(style.backgroundOpacity ?? 1).toFixed(2)}</span>
        </label>
      </div>
    </div>
  );
}
