"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function PurchaseExportsModal({
  open,
  onClose,
  onPick,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (pack: 10 | 50 | 200) => void;
  busy?: boolean;
}) {
  // Portal target
  const portalEl = useRef<HTMLElement | null>(null);
  useEffect(() => {
    portalEl.current = document.body;
  }, []);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus first interactive control when opened
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open) firstButtonRef.current?.focus();
  }, [open]);

  if (!portalEl.current) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.button
            aria-hidden="true"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-title"
            className="relative mx-auto w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 id="purchase-title" className="text-base font-semibold">
                Buy more export quota
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-black/60 hover:bg-zinc-100 hover:text-black/80"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-black/60">
              Choose a pack. Usable on any format (PNG/JPG/WebP/TIFF/SVG).
            </p>

            {/* Packs */}
            <div className="grid gap-2">
              {[
                { qty: 10 as const, price: "$3.99" },
                { qty: 50 as const, price: "$14.99" },
                { qty: 200 as const, price: "$39.99" },
              ].map(({ qty, price }, idx) => (
                <button
                  key={qty}
                  ref={idx === 0 ? firstButtonRef : undefined}
                  disabled={!!busy}
                  onClick={() => onPick(qty)}
                  className={[
                    "flex items-center justify-between rounded-xl border px-3 py-3 text-sm",
                    "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                    busy ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <span className="font-medium">{qty} exports</span>
                  <span className="text-emerald-700">{price}</span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-black/50">
              Purchases apply instantly. Unused exports don’t expire.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalEl.current
  );
}
