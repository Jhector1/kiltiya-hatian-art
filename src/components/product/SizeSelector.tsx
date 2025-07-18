/* File: components/SizeSelector.tsx */
"use client";
import { CartSelectedItem, CartUpdates } from "@/types";
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
  updateCart: (updates: CartUpdates) => void;
  inCart: CartSelectedItem;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Print Size
      </label>
      <div className="flex gap-4 flex-wrap fle space-x-2">
        {options.map((opt) => (
          <label key={opt.label} className="cursor-pointer">
            <input
              type="radio"
              name="size"
              className="sr-only peer"
              value={opt.label}
              checked={selected.label === opt.label}
              onChange={() => {
                onSizeChange(opt);
                if (inCart) updateCart({ size: opt.label });
              }}
            />
            <span className="px-4 py-2 border border-gray-300 rounded-lg peer-checked:bg-purple-600 peer-checked:text-white transition">
              {opt.label}
            </span>
          </label>
        ))}

        {isCustom && (
          <div className="flex items-center space-x-2 ml-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <input
                type="number"
                placeholder="W"
                className="w-20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customSize.width}
                onChange={(e) => {
                  onSizeChange(selected, {
                    width: e.target.value,
                    height: customSize.height,
                  });
                  if (inCart)
                    updateCart({ size: `${e.target.value}x${customSize.height} in` });
                }}
              />
              <span className="px-2 border-l border-gray-300 text-gray-500">×</span>
              <input
                type="number"
                placeholder="H"
                className="w-20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customSize.height}
                onChange={(e) => {
                  onSizeChange(selected, {
                    width: customSize.width,
                    height: e.target.value,
                  });
                  if (inCart)
                    updateCart({ size: `${customSize.width}x${e.target.value} in` });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
