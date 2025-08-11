// ───────────────────────────────────────────────────────────
// file: src/components/editor/hooks/useSaveDesign.ts
// ───────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import type { SaveResp, StyleState } from "../types";

export function useSaveDesign(productId: string) {
  const [saving, setSaving] = useState(false);

  const saveDesign = async (style: StyleState, defsMap: Record<string, string>) => {
    setSaving(true);
    try {
      const defsNow = Object.values(defsMap).join("\n");
      const res = await fetch(`/api/products/${productId}/saveUserDesign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: { ...style, defs: defsNow } }),
      });
      if (res.status === 401) throw new Error("Please sign in to save.");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      const j: SaveResp = await res.json();
      return j;
    } finally {
      setSaving(false);
    }
  };

  return { saveDesign, saving };
}
