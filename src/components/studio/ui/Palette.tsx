// ───────────────────────────────────────────────────────────
// file: src/components/editor/ui/Palette.tsx
// ───────────────────────────────────────────────────────────
"use client";

import React from "react";
import { useDesignContext } from "../contexts/DesignContext";
import { StyleState } from "../types";
import { GRADIENTS, PATTERNS, SOLIDS } from "../utils/constants";
import { buildLinearGradientDef, gradientPreview } from "../utils/svg";

const TARGETS = ["fill", "stroke", "background"] as const;

type Target = typeof TARGETS[number];

export default function Palette() {
  const { defsMap, setDefsMap, handleStyleChange } = useDesignContext();
  const [target, setTarget] = React.useState<Target>("fill");

  const setColor = (key: keyof StyleState, value: string) => {
    handleStyleChange(key, value );
  };

  return (
    <div className="mb-4 rounded-2xl border border-black/10 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-black/70">Palette</h3>
        <div className="flex overflow-hidden rounded-xl ring-1 ring-black/10">
          {TARGETS.map((k) => (
            <button key={k} onClick={() => setTarget(k)} className={`px-3 py-1 text-xs capitalize ${target === k ? "bg-emerald-100 text-emerald-900" : "bg-white hover:bg-emerald-50"}`}>{k}</button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 text-xs text-black/50">Solids</div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {SOLIDS.map((c) => (
            <button key={c} className="group h-8 w-8 sm:h-7 sm:w-7 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition" style={{ background: c }} title={c} onClick={() => {
              const key = target === "background" ? "backgroundColor" : target === "fill" ? "fillColor" : "strokeColor";
              setColor(key as keyof StyleState, c);
            }}>
              <span className="sr-only">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 text-xs text-black/50">Gradients</div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {GRADIENTS.map((g) => (
            <button key={g.id} className="h-8 w-12 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition bg-white" style={{ backgroundImage: gradientPreview(g), backgroundSize: "cover" }} title={"stops" in g ? g.id : `${(g as any).from} → ${(g as any).to}`} onClick={() => {
              const newMap = { ...defsMap, [g.id]: buildLinearGradientDef(g) };
              setDefsMap(newMap);
              const key = target === "background" ? "backgroundColor" : target === "fill" ? "fillColor" : "strokeColor";
              // const newDefsString = Object.values(newMap).join("\n");
              setColor(key as keyof StyleState, `url(#${g.id})`);
            }} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs text-black/50">Patterns</div>
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {PATTERNS.map((p) => (
            <button key={p.id} className="h-8 w-12 rounded-lg ring-1 ring-black/10 hover:ring-emerald-400 transition bg-white" style={{ backgroundImage: `url("${p.preview}")`, backgroundSize: "cover" }} title={p.id.replace("pat-", "")} onClick={() => {
              const newMap = { ...defsMap, [p.id]: p.svg };
              setDefsMap(newMap);
              const key = target === "background" ? "backgroundColor" : target === "fill" ? "fillColor" : "strokeColor";
              // const newDefsString = Object.values(newMap).join("\n");
              setColor(key as keyof StyleState, `url(#${p.id})`);
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
