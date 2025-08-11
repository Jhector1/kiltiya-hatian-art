// src/components/editor/ui/CanvasStage.tsx
"use client";

import React, { forwardRef } from "react";

type Props = {
  zoom: number;
  setZoom: (z: number) => void;
  loading: boolean;
};

const CanvasStage = forwardRef<HTMLCanvasElement, Props>(
  ({ zoom, setZoom, loading }, ref) => {
    return (
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
            aria-label="Zoom"
          />
          <span className="sm:w-14 text-right tabular-nums text-xs text-black/60">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="relative grid place-items-center overflow-auto rounded-xl bg-[conic-gradient(at_20%_20%,#fafafa,#f4f4f5)] p-2 sm:p-4 max-h-[70vh] md:max-h-[72vh] touch-pan-y">
          <canvas
            ref={ref}
            className="max-w-full h-auto shadow-sm ring-1 ring-black/5"
          />
          {loading && (
            <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/60 backdrop-blur-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

CanvasStage.displayName = "CanvasStage";
export default CanvasStage;
