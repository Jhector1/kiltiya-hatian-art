// src/components/editor/ui/AppearanceControls.tsx
"use client";

import React from "react";
import { useDesignContext } from "../contexts/DesignContext";

// keep the colorInputValue helper you already added (not shown here)

export default function AppearanceControls() {
  const {
    style,
    handleStyleChange,
    beginHistory,
    commitHistory,
  } = useDesignContext();

  const start = (label: string) => () => beginHistory(label);
  const commit = (label: string) => () => commitHistory(label);

  return (
    <div id="controls-panel">
      {/* ... Fill / Stroke / Background color inputs ... */}
      {/* Color inputs = discrete: commit immediately */}
      {/* example for Fill: */}
      {/* onChange={(e)=>{ handleStyleChange("fillColor", e.target.value); commitHistory("Fill color"); }} */}

      <label className="col-span-2 flex items-center gap-3 text-xs">
        <span className="w-24 text-black/60">Stroke Width</span>
        <input
          type="range"
          min={0}
          max={16}
          step={0.5}
          value={style.strokeWidth ?? 0}
          onPointerDown={start("Stroke width")}
          onChange={(e) =>
            handleStyleChange("strokeWidth", parseFloat(e.target.value))
          }
          onPointerUp={commit("Stroke width")}
          className="w-full"
        />
        <span className="w-12 text-right tabular-nums">
          {(style.strokeWidth ?? 0).toString()}
        </span>
      </label>

      {/* Same pattern for the opacity sliders */}
      <label className="flex items-center gap-3 text-xs">
        <span className="w-24 text-black/60">Fill Opacity</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={style.fillOpacity ?? 1}
          onPointerDown={start("Fill opacity")}
          onChange={(e) =>
            handleStyleChange("fillOpacity", parseFloat(e.target.value))
          }
          onPointerUp={commit("Fill opacity")}
          className="w-full"
        />
        <span className="w-12 text-right tabular-nums">
          {(style.fillOpacity ?? 1).toFixed(2)}
        </span>
      </label>

      {/* strokeOpacity, backgroundOpacity: same treatment */}
    </div>
  );
}
