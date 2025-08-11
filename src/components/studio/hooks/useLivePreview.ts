// ───────────────────────────────────────────────────────────
// file: src/components/editor/hooks/useLivePreview.ts
// ───────────────────────────────────────────────────────────
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StyleState } from "../types";

export function useLivePreview(productId: string) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [baseW, setBaseW] = useState(0);
  const [baseH, setBaseH] = useState(0);
  const objectUrlRef = useRef<string | null>(null);

  const updatePreview = useCallback(async (style: StyleState, defs: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/live-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...style, defs }),
      });
      if (!res.ok) throw new Error("Failed to update preview");
      const blob = await res.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  // returns also a setter for intrinsic size once image loads
  const onImageLoad = useCallback((img: HTMLImageElement) => {
    setBaseW(img.width);
    setBaseH(img.height);
  }, []);

  return { previewUrl, loading, updatePreview, baseW, baseH, onImageLoad };
}
