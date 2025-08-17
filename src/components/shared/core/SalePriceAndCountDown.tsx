// SaleAndCountdown.tsx
// (no hooks here; doesn't need "use client" unless your SaleCountdown uses hooks)

import * as React from "react";

// This matches the object returned by getEffectiveSale(...)
type SaleView = {
  price: number;
  compareAt: number | null;
  onSale: boolean;
  endsAt: Date | string | null;
};

export function SaleAndCountdown({
  price,
  compareAt,
  onSale,
  endsAt,
  className,
}: SaleView & { className?: string }) {
  const pctOff =
    onSale && compareAt && compareAt > 0
      ? Math.max(0, Math.round(100 * (1 - price / compareAt)))
      : 0;

  // Allow endsAt to be Date or ISO string
  const endDate = endsAt ? new Date(endsAt) : null;

  return (
    <div
      className={
        className ??
        "rounded-2xl ring-1 ring-black/5 bg-white p-4 flex items-center justify-between"
      }
    >
      <div className="flex items-center items-baseline gap-3">
        <span className="text-2xl font-semibold">${price.toFixed(2)}</span>

        {onSale && compareAt != null && (
          <span className="text-lg text-gray-400 line-through">
            ${compareAt.toFixed(2)}
          </span>
        )}

        {onSale && pctOff > 0 && (
          <span className="text-xs font-semibold text-white bg-red-600 rounded-full px-2 py-0.5">
            -{pctOff}%
          </span>
        )}
      </div>

      {onSale && endDate && <SaleCountdown endsAt={endDate} />}
    </div>
  );
}

/** Tiny countdown (optional) */
export function SaleCountdown({ endsAt }: { endsAt: Date }) {
  const [left, setLeft] = React.useState(() => endsAt.getTime() - Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setLeft(endsAt.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (left <= 0) return null;
  const s = Math.floor(left / 1000) % 60;
  const m = Math.floor(left / 1000 / 60) % 60;
  const h = Math.floor(left / 1000 / 60 / 60);
  return (
    <span className="text-xs text-emerald-700">
      Sale ends in {h}h {m}m {s}s
    </span>
  );
}