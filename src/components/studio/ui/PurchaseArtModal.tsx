"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function PurchaseArtModal({
  open,
  onClose,
  busy,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  onCheckout: (opts: { variant: "digital" | "print"; quantity: number }) => void;
}) {
  const portalEl = useRef<HTMLElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const [variant, setVariant] = useState<"digital" | "print">("digital");
  const [qty, setQty] = useState(1);

  useEffect(() => { portalEl.current = document.body; }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  useEffect(() => { if (open) firstFocusRef.current?.focus(); }, [open]);

  useEffect(() => {
    if (!open) { setVariant("digital"); setQty(1); }
  }, [open]);

  if (!portalEl.current) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.button aria-hidden="true"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div role="dialog" aria-modal="true"
            aria-labelledby="purchase-art-title"
            className="relative mx-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="purchase-art-title" className="text-base font-semibold">
                Purchase this artwork
              </h3>
              <button onClick={onClose}
                className="rounded-md p-1 text-black/60 hover:bg-zinc-100 hover:text-black/80"
                aria-label="Close">✕</button>
            </div>

            <div className="space-y-4">
              {/* Variant */}
              <div>
                <div className="text-sm font-medium mb-2">Type</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "digital", label: "Digital license" },
                    { key: "print", label: "Fine-art print" },
                  ].map((opt) => (
                    <button key={opt.key}
                      onClick={() => setVariant(opt.key as any)}
                      className={[
                        "rounded-xl border px-3 py-3 text-sm",
                        variant === opt.key
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50",
                      ].join(" ")}
                      ref={opt.key === "digital" ? firstFocusRef : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="text-sm font-medium mb-2">Quantity</div>
                <div className="inline-flex items-center rounded-xl border border-zinc-200">
                  <button className="px-3 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={busy}>−</button>
                  <span className="w-10 text-center tabular-nums">{qty}</span>
                  <button className="px-3 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => setQty((q) => q + 1)}
                    disabled={busy}>+</button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={onClose}
                  className="rounded-xl px-3 py-2 text-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
                  disabled={busy}>Cancel</button>
                <button
                  onClick={() => onCheckout({ variant, quantity: qty })}
                  disabled={busy}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-medium",
                    "bg-emerald-600 text-white hover:bg-emerald-700",
                    busy ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {busy ? "Processing..." : "Proceed to checkout"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalEl.current
  );
}
