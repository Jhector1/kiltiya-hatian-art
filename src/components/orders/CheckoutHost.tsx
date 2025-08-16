// components/CheckoutHost.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

function showThankYouToast(
  message: string,
  action?: { label: string; onClick: () => void }
) {
  try {
    const id = "checkout-thanks";
    document.getElementById(id)?.remove();

    const root = document.createElement("div");
    root.id = id;
    Object.assign(root.style, {
      position: "fixed",
      left: "50%",
      bottom: "16px",
      transform: "translateX(-50%)",
      zIndex: "9999",
    });

    const card = document.createElement("div");
    Object.assign(card.style, {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      padding: "10px 14px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.98)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
      border: "1px solid rgba(0,0,0,0.06)",
      fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    });

    const text = document.createElement("span");
    text.textContent = message;
    Object.assign(text.style, { fontSize: "14px", color: "#111827" });
    card.appendChild(text);

    if (action) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.label;
      Object.assign(btn.style, {
        fontSize: "13px",
        padding: "6px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(99,102,241,0.25)",
        background: "#eef2ff",
        color: "#3730a3",
        cursor: "pointer",
      });
      btn.addEventListener("click", () => {
        try {
          action.onClick();
        } finally {
          root.remove();
        }
      });
      card.appendChild(btn);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    Object.assign(close.style, {
      fontSize: "16px",
      padding: "4px 6px",
      color: "#6b7280",
      background: "transparent",
      border: "none",
      cursor: "pointer",
    });
    close.addEventListener("click", () => root.remove());
    card.appendChild(close);

    root.appendChild(card);
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 7000);
  } catch {}
}
type Detail = {
  clientSecret: string;
  exportHref?: string;
  onPurchaseComplete?: () => void;
};

export default function CheckoutHost() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => setDetail((e as CustomEvent<Detail>).detail);
    window.addEventListener("open-checkout", onOpen as EventListener);
    return () =>
      window.removeEventListener("open-checkout", onOpen as EventListener);
  }, []);

  useEffect(() => {
    // lock body scroll while overlay is open
    if (!detail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detail]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!detail) return;
      await new Promise((r) => requestAnimationFrame(r));

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
      );
      if (!stripe) {
          window.dispatchEvent(new CustomEvent("checkout-error")); // 🧹 stop header booting

        setError("Stripe failed to load.");
        return;
      }

      try {
        controllerRef.current?.destroy?.();
      } catch {}
      const controller = await stripe.initEmbeddedCheckout({
        async fetchClientSecret() {
          return detail.clientSecret;
        },
        onComplete: () => {
          try {
            controllerRef.current?.destroy?.();
          } catch {}
          controllerRef.current = null;
          setDetail(null);
          window.dispatchEvent(new CustomEvent("checkout-complete"));
          showThankYouToast(
            "Thank you for your purchase! You can now export this design.",
            detail.exportHref
              ? {
                  label: "Open Library",
                  onClick: () => {
                    window.location.href = detail.exportHref!;
                  },
                }
              : undefined
          );
       

          try {
            detail.onPurchaseComplete?.();
          } catch {}
        },
      });

      if (cancelled) {
        try {
          controller.destroy();
          setDetail(null);
  window.dispatchEvent(new CustomEvent("checkout-abort")); // 🧹 stop header booting

        } catch {}
        return;
      }
      controllerRef.current = controller;
      controller.mount(containerRef.current!);
    })();

    return () => {
      cancelled = true;
    };
  }, [detail]);

  if (!detail) return null;

  return (
    // OVERLAY: scrollable, not grid-centered
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => {
        try {
          controllerRef.current?.destroy?.();
        } catch {}
        controllerRef.current = null;
        setDetail(null);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.45)",
        overflowY: "auto", // <-- critical
        WebkitOverflowScrolling: "touch", // iOS smooth scrolling
        // optional padding so dialog breathes on small screens
        padding: "24px 12px",
      }}
    >
      {/* DIALOG: auto height, but capped; it can scroll if content exceeds cap */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
          maxHeight: "calc(100dvh - 48px)", // <-- cap to viewport
          overflowY: "auto", // <-- dialog scrolls if needed
        }}
      >
        <div ref={containerRef} style={{ minHeight: 620 }} />
        {error && <p style={{ color: "#b91c1c", marginTop: 8 }}>⚠️ {error}</p>}
      </div>
    </div>
  );
}
