// components/CheckoutHost.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

function showThankYouToast(message: string, action?: { label: string; onClick: () => void }) {
  try {
    const id = "checkout-thanks";
    document.getElementById(id)?.remove();

    const root = document.createElement("div");
    root.id = id;
    Object.assign(root.style, {
      position: "fixed", left: "50%", bottom: "16px", transform: "translateX(-50%)",
      zIndex: "9999",
    });

    const card = document.createElement("div");
    Object.assign(card.style, {
      display: "flex", gap: "10px", alignItems: "center",
      padding: "10px 14px", borderRadius: "999px",
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
        fontSize: "13px", padding: "6px 10px", borderRadius: "999px",
        border: "1px solid rgba(99,102,241,0.25)", background: "#eef2ff", color: "#3730a3",
        cursor: "pointer",
      });
      btn.addEventListener("click", () => { try { action.onClick(); } finally { root.remove(); } });
      card.appendChild(btn);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    Object.assign(close.style, { fontSize: "16px", padding: "4px 6px", color: "#6b7280", background: "transparent", border: "none", cursor: "pointer" });
    close.addEventListener("click", () => root.remove());
    card.appendChild(close);

    root.appendChild(card);
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 7000);
  } catch {}
}

type Detail = {
  clientSecret: string;
  exportHref?: string;             // where to send them if they click the CTA
  // optional: keep, but not required for the toast
  onPurchaseComplete?: () => void; // can be omitted if passing funcs via events is flaky
};

export default function CheckoutHost() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => setDetail((e as CustomEvent<Detail>).detail);
    window.addEventListener("open-checkout", onOpen as EventListener);
    return () => window.removeEventListener("open-checkout", onOpen as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      if (!detail) return;
      await new Promise(r => requestAnimationFrame(r));

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
      if (!stripe) { setError("Stripe failed to load."); return; }

      try { controllerRef.current?.destroy?.(); } catch {}
      const controller = await stripe.initEmbeddedCheckout({
        async fetchClientSecret() { return detail.clientSecret; },
        onComplete: () => {
          try { controllerRef.current?.destroy?.(); } catch {}
          controllerRef.current = null;
          setDetail(null);

          // 🔔 Dispatch a global event if you want other parts of the app to react
          window.dispatchEvent(new CustomEvent("checkout-complete"));

          // ✅ Show the thank-you toast here
          showThankYouToast(
            "Thank you for your purchase! You can now export this design.",
            detail.exportHref ? { label: "Open Library", onClick: () => { window.location.href = detail.exportHref!; } } : undefined
          );

          // Optional local callback
          try { detail.onPurchaseComplete?.(); } catch {}
        },
      });

      if (cancelled) { try { controller.destroy(); } catch {} ; return; }

      controllerRef.current = controller;
      controller.mount(containerRef.current!);
    }
    mount();
    return () => { cancelled = true; };
  }, [detail]);

  if (!detail) return null;

  return (
    <div role="dialog" aria-modal="true"
         style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center" }}
         onClick={() => { try { controllerRef.current?.destroy?.(); } catch {}; controllerRef.current = null; setDetail(null); }}>
      <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 16, padding: 16 }}
           onClick={(e) => e.stopPropagation()}>
        <div ref={containerRef} style={{ minHeight: 620 }} />
        {error && <p style={{ color: "#b91c1c", marginTop: 8 }}>⚠️ {error}</p>}
      </div>
    </div>
  );
}
