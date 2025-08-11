// src/components/editor/hooks/useCanvasRender.ts
"use client";

import { useCallback, useRef, useState } from "react";

export function useCanvasRender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, _setZoom] = useState<number>(1);

  // keep zoom sane
  const setZoom = useCallback((z: number) => {
    _setZoom(Math.min(3, Math.max(0.25, z)));
    // we use CSS scale; no redraw necessary for zoom changes
  }, []);

  // used to cancel stale draws
  const drawTokenRef = useRef(0);

  /**
   * Draw an image URL once (DPR-aware), and scale via CSS for zoom.
   * We render at the image's *intrinsic* size in device pixels once.
   */
  const drawUrl = useCallback(async (url: string) => {
    const token = ++drawTokenRef.current;

    // Load & decode the image
    const img = new Image();
    // If you ever load cross-origin URLs, uncomment:
    // img.crossOrigin = "anonymous";
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
    img.src = url;
    await loaded;

    // If another draw started while we were loading, abort
    if (token !== drawTokenRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    // Use the image's intrinsic size for crispness
    const w = Math.max(1, Math.floor(img.naturalWidth));
    const h = Math.max(1, Math.floor(img.naturalHeight));

    // Backing store in device pixels
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    // CSS size is logical px; we will zoom via CSS transform
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Scale the context to device pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (ctx as any).imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  }, []);

  /**
   * Apply CSS transform for zoom (fast, no redraw).
   * Call this once in your CanvasStage after mount and whenever `zoom` changes,
   * or add it to the hook return and call where convenient.
   */
  const applyCssZoom = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.style.transformOrigin = "top left";
    el.style.transform = `scale(${zoom})`;
  }, [zoom]);

  return { canvasRef, zoom, setZoom, drawUrl, applyCssZoom };
}
