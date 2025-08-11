"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@/contexts/UserContext";


import { DesignProvider, useDesignContext } from "./contexts/DesignContext";
import { useLivePreview } from "./hooks/useLivePreview";
import { useCanvasRender } from "./hooks/useCanvasRender";
import { useSaveDesign } from "./hooks/useSaveDesign";
import { useExportArtwork } from "./hooks/useExportArtwork";

import EditorHeaderBar from "./ui/EditorHeaderBar";
import CanvasStage from "./ui/CanvasStage";
import Palette from "./ui/Palette";
import AppearanceControls from "./ui/AppearanceControls";
import ExportSizeControls from "./ui/ExportSizeControls";

import type { ExportMode, ExportUnit } from "./types";
import { DEFAULT_STYLE } from "./utils/constants";
import { usePurchaseExports } from "./hooks/usePurchaseExports";
import PurchaseExportsModal from "./ui/PurchaseExportsModal";
import { usePurchaseArt } from "./hooks/usePurchaseArt";
import PurchaseArtModal from "./ui/PurchaseArtModal";


// Lightweight skeleton brick
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-zinc-100",
        className,
      ].join(" ")}
    />
  );
}

// Full-page layout skeleton that mirrors the editor UI
function BootLayoutSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50 p-3 md:p-4 ring-1 ring-black/5">
        <div className="min-w-0">
          <Skeleton className="h-5 w-48 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-44 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl sm:hidden" />
        </div>
      </div>

      {/* Grid skeleton (canvas + sidebar) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] gap-4">
        {/* Canvas side */}
        <div className="relative rounded-2xl bg-white p-3 ring-1 ring-black/5">
          {/* Zoom row */}
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>

          {/* Canvas placeholder */}
          <div className="relative grid place-items-center overflow-auto rounded-xl bg-[conic-gradient(at_20%_20%,#fafafa,#f4f4f5)] p-2 sm:p-4 max-h-[70vh] md:max-h-[72vh]">
            <div className="w-full h-[48vh] sm:h-[60vh] rounded-xl ring-1 ring-black/5 bg-white grid place-items-center">
              <Skeleton className="h-[90%] w-[90%] rounded-xl" />
            </div>
          </div>
        </div>

        {/* Controls side */}
        <aside className="rounded-2xl bg-white p-4 ring-1 ring-black/5 md:sticky md:top-4 md:h-fit">
          {/* Palette header + target tabs */}
          <div className="mb-4 rounded-2xl border border-black/10 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex overflow-hidden rounded-xl ring-1 ring-black/10">
                <Skeleton className="h-7 w-16 rounded-none" />
                <Skeleton className="h-7 w-16 rounded-none" />
                <Skeleton className="h-7 w-20 rounded-none" />
              </div>
            </div>
            {/* Solids grid */}
            <div className="mb-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Gradients grid */}
            <div className="mb-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-12 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Patterns grid */}
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-12 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full col-span-2 rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-span-2 flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>

          {/* Export size */}
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="mb-2 flex gap-1 rounded-xl bg-white ring-1 ring-black/10 p-1 overflow-x-auto">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-3 w-40" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <Skeleton className="h-4 w-40" />
          </div>
        </aside>
      </div>
    </div>
  );
}


function EditableCanvasInner({ productId }: { productId: string }) {
  const { isLoggedIn } = useUser();
  const { style, setStyle, defsMap, setDefsMap } = useDesignContext();

  const { previewUrl, loading, updatePreview, baseW, baseH, onImageLoad } =
    useLivePreview(productId);
  const { canvasRef, zoom, setZoom, drawUrl } = useCanvasRender();
  const { saveDesign, saving } = useSaveDesign(productId);
  const {
    exporting,
    canExport,
    purchased,
    exportsLeft,
    quickDownloadPng,
    exportArtwork,
    fetchInitialExportStatus,
  } = useExportArtwork(productId);

  const [showControls, setShowControls] = useState(false);

  const [exportMode, setExportMode] = useState<ExportMode>("scale");
  const [scale, setScale] = useState(1);
  const [outW, setOutW] = useState("");
  const [outH, setOutH] = useState("");
  const [dpi, setDpi] = useState(300);
  const [unit, setUnit] = useState<ExportUnit>("in");
  const [printW, setPrintW] = useState(8);
  const [printH, setPrintH] = useState(10);
  const [booting, setBooting] = useState(true);
const [showPurchase, setShowPurchase] = useState(false);
const { startCheckout, busy: purchasing } = usePurchaseExports(productId);

const [showBuyArt, setShowBuyArt] = useState(false);
const { startArtCheckout, busy: purchasingArt } = usePurchaseArt(productId);

  // Build a stable defs string to watch in effects
  const defsString = useMemo(
    () => Object.values(defsMap).join("\n"),
    [defsMap]
  );

  // Initial load: fetch status, try saved design, else draw fallback preview
 // initial load
useEffect(() => {
  let cancelled = false;
  (async () => {
    await fetchInitialExportStatus();

    try {
      const s = await fetch(`/api/products/${productId}/saveUserDesign`, { cache: "no-store" });
      if (s.ok) {
        const j = await s.json();
        if (!cancelled && j?.found) {
          const savedStyle = { ...DEFAULT_STYLE, ...(j.style || {}) };
          const savedDefs: string = j.defs || "";
          setStyle(savedStyle);
          setDefsMap(savedDefs ? { __persisted: savedDefs } : {});
          // render correct preview before showing UI
          await updatePreview(savedStyle, savedDefs);
          setBooting(false);
          return;
        }
      }
    } catch {}

    // no saved design: draw fallback once
    try {
      const res = await fetch(`/api/products/${productId}/live-preview`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load preview");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await drawUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setBooting(false);
    }
  })();
  return () => { cancelled = true; };
}, [productId, setStyle, setDefsMap, fetchInitialExportStatus, drawUrl, updatePreview]);

// debounced preview — skip while booting
useEffect(() => {
  if (booting) return;
  const id = window.setTimeout(() => { void updatePreview(style, defsString); }, 250);
  return () => window.clearTimeout(id);
}, [booting, style, defsString, updatePreview]);

  // Draw when previewUrl or zoom changes
  useEffect(() => {
    if (previewUrl) void drawUrl(previewUrl);
  }, [previewUrl, drawUrl, zoom]);

  // Capture intrinsic size
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => onImageLoad(img);
    img.src = previewUrl;
  }, [previewUrl, onImageLoad]);

  const onSaveClick = async () => {
    if (!isLoggedIn) {
      alert("Please log in first to save your design.");
      return;
    }
    try {
      await saveDesign(style, defsMap);
    } catch (e: any) {
      alert(e.message || String(e));
    }
  };

  const onQuickPng = () => quickDownloadPng(canvasRef.current, productId);

  const onExport = (fmt: any) => {
    if (!canExport) {
      alert("Purchase required or export limit reached.");
      return;
    }
    return exportArtwork(fmt, style, defsMap, {
      mode: exportMode,
      scale,
      outW,
      outH,
      unit,
      dpi,
      printW,
      printH,
      saveToLibrary: false,
    });
  };
  // early return UI while booting
if (booting) {
  return <BootLayoutSkeleton />;
}


  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      <EditorHeaderBar
      purchased={purchased}
        loading={loading}
        saving={saving}
        canExport={canExport}
        exporting={exporting}
        exportsLeft={exportsLeft}
        onSave={onSaveClick}
        onQuickPng={onQuickPng}
        onExport={onExport}
        showControls={showControls}
        setShowControls={setShowControls}
          onPurchaseClick={() => setShowPurchase(true)}
          onPurchaseArtClick={() => setShowBuyArt(true)}

      />
      <PurchaseExportsModal
  open={showPurchase}
  onClose={() => setShowPurchase(false)}
  busy={purchasing}
  onPick={async (qty) => {
    await startCheckout(qty);
    // After redirect returns, your server should refresh status;
    // You can also poll refresh here if you handle webhooks and return.
  }}
/>
<PurchaseArtModal
  open={showBuyArt}
  onClose={() => setShowBuyArt(false)}
  busy={purchasingArt}
  onCheckout={async ({ variant, quantity }) => {
    await startArtCheckout({
      style,
      defs: defsString,
      variant,
      quantity,
    });
    // on success we redirect; if your API returns ok without redirect,
    // you can close here: setShowBuyArt(false)
  }}
/>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] gap-4">
        <CanvasStage
          zoom={zoom}
          setZoom={setZoom}
          ref={canvasRef}
          loading={loading}
        />

        <aside
          id="controls-panel"
          className={`rounded-2xl bg-white p-4 ring-1 ring-black/5 ${
            showControls ? "block" : "hidden"
          } sm:block md:sticky md:top-4 md:h-fit`}
        >
          <Palette />
          <AppearanceControls />
          <ExportSizeControls
            mode={exportMode}
            setMode={setExportMode}
            baseW={baseW}
            baseH={baseH}
            scale={scale}
            setScale={setScale}
            outW={outW}
            setOutW={setOutW}
            outH={outH}
            setOutH={setOutH}
            unit={unit}
            setUnit={setUnit}
            dpi={dpi}
            setDpi={setDpi}
            printW={printW}
            setPrintW={setPrintW}
            printH={printH}
            setPrintH={setPrintH}
          />

          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => {
                  /* wire to saveToLibrary if desired */
                }}
              />
              Save exports to my Library
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function EditableCanvas({ productId }: { productId: string }) {
  return (
    <DesignProvider initialStyle={DEFAULT_STYLE}>
      <EditableCanvasInner productId={productId} />
    </DesignProvider>
  );
}
