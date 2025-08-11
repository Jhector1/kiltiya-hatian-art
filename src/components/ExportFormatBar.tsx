// ExportFormatBar.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type ExportFormat = "png" | "jpg" | "webp" | "tiff" | "svg";

export default function ExportFormatBar({
  formats,
  canExport,
  exporting,
  loading,
  exportsLeft,
  onExport,
}: {
  formats: ExportFormat[];
  canExport: boolean;
  exporting: boolean;
  loading: boolean;
  exportsLeft: number;
  onExport: (fmt: ExportFormat) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const el = wrapRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  };

  useEffect(() => {
    updateEdges();
    const el = wrapRef.current;
    if (!el) return;
    const onResize = () => updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className="relative w-full sm:w-auto rounded-xl ring-1 ring-black/10 bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="text-xs">
          {canExport ? (
            <span className="text-emerald-700">Exports left: {exportsLeft}</span>
          ) : (
            <span className="text-amber-700">Purchase to export</span>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Scrollable pill row */}
        <div
          ref={wrapRef}
          className="
            flex gap-2 px-2 pb-2 overflow-x-auto scroll-smooth
            flex-nowrap
            [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden
          "
          aria-label="Export formats"
        >
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => onExport(fmt)}
              disabled={loading || exporting || !canExport}
              className={`shrink-0 snap-start rounded-lg px-3 py-2 text-xs font-medium
                min-w-[64px] transition
                ${!canExport ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-50"}
              `}
              title={canExport ? `Export as ${fmt.toUpperCase()}` : "Export blocked"}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Edge shadows */}
        {!atStart && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent rounded-l-xl" />
        )}
        {!atEnd && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent rounded-r-xl" />
        )}

        {/* Nudge chevrons (appear only when needed) */}
        {!atStart && (
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 ring-1 ring-black/10 grid place-items-center shadow-sm"
            aria-label="Scroll formats left"
          >
            ‹
          </button>
        )}
        {!atEnd && (
          <button
            type="button"
            onClick={() => nudge(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 ring-1 ring-black/10 grid place-items-center shadow-sm"
            aria-label="Scroll formats right"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
