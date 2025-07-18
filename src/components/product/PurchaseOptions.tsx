
/* File: components/PurchaseOptions.tsx */
"use client";
import { AddOptions, CartSelectedItem, CartUpdates } from "@/types";
import React from "react";

export default function PurchaseOptions({
  digitalPrice,
  printPrice,
  options,
  onToggle,
  updateCart,
  updateCart2,
  inCart,
}: {
  digitalPrice: string;
  printPrice: string;
  options: AddOptions;
  onToggle: (key: "digital" | "print") => void;
  updateCart: (updates: CartUpdates) => void;
  updateCart2: (updates: CartUpdates) => void;
  inCart: CartSelectedItem | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Purchase Options
      </label>
      <div className="flex space-x-4">
        {/* Digital Option */}
        <label className="cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={options.digital}
            onChange={() => {
              onToggle("digital");
              if (inCart)
                updateCart2({ format: "jpg" });
            }}
          />
          <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg peer-checked:bg-purple-600 peer-checked:text-white transition">
            Digital – <span className="font-medium ml-1">${digitalPrice}</span>
          </div>
        </label>

        {/* Print Option */}
        <label className="cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={options.print}
            onChange={() => {
              onToggle("print");
              if (inCart)
                updateCart({
                  format: "jpg",
                  size: "11x14 in",
                  material: "Matte Paper",
                  frame: null,
                  quantity: 1,
                });
            }}
          />
          <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg peer-checked:bg-purple-600 peer-checked:text-white transition">
            Print – <span className="font-medium ml-1">${printPrice}</span>
          </div>
        </label>
      </div>
    </div>
  );
}
