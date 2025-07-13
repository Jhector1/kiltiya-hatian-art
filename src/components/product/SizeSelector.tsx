// File: components/SizeSelector.tsx
"use client";
import React from "react";

type Option = { label: string; multiplier: number };
export default function SizeSelector({
  options,
  selected,
  isCustom,
  customSize,
  onSizeChange,
  updateCart,
  inCart,
}: {
  options: Option[];
  selected: Option;
  isCustom: boolean;
  customSize: { width: string; height: string };
  onSizeChange: (
    sel: Option,
    custom?: { width: string; height: string }
  ) => void;
  updateCart: (updates: { [key: string]: any }) => void;
  inCart: boolean;
}) {
  return (
    <div>
      <label className="block font-semibold mb-2">Size (Print):</label>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.label}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="size"
              value={opt.label}
              checked={selected.label === opt.label}
              onChange={() => {
                onSizeChange(opt);
                if (inCart) updateCart({ size: opt.label });
              }}
            />
            {opt.label}
          </label>
        ))}
        {isCustom && (
          <div className="flex gap-4 ml-4 mt-2">
            <input
              type="number"
              placeholder="Width (in)"
              className="border p-2 rounded w-28"
              value={customSize.width}
              onChange={(e) => {
                onSizeChange(selected, {
                  width: e.target.value,
                  height: customSize.height,
                });

               if (inCart) updateCart({'size': `${e.target.value}x${customSize.height} in`});

              }}
            />
            <input
              type="number"
              placeholder="Height (in)"
              className="border p-2 rounded w-28"
              value={customSize.height}
              onChange={(e) =>
                onSizeChange(selected, {
                  width: customSize.width,
                  height: e.target.value,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
