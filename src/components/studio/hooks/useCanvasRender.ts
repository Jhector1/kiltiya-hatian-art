
// ───────────────────────────────────────────────────────────
// file: src/components/editor/hooks/useCanvasRender.ts
// ───────────────────────────────────────────────────────────
"use client";

import {  useCallback, useRef, useState } from "react";

export function useCanvasRender() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  const drawUrl = useCallback((url: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return resolve();
        const ctx = canvas.getContext("2d");
        const w = img.width, h = img.height;
        canvas.width = Math.max(1, Math.floor(w * zoom));
        canvas.height = Math.max(1, Math.floor(h * zoom));
        if (ctx) {
          (ctx as any).imageSmoothingEnabled = true;
          (ctx as any).imageSmoothingQuality = "high";
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve();
      };
      img.src = url;
    });
  }, [zoom]);

  return { canvasRef, zoom, setZoom, drawUrl };
}
