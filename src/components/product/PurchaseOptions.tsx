// File: components/PurchaseOptions.tsx
"use client";
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
  options: { digital: boolean; print: boolean };
  onToggle: (key: "digital" | "print") => void;
  updateCart: (updates: { [key: string]: any }) => void;
  updateCart2: (updates: { [key: string]: any }) => void;

  inCart: boolean;
}) {
  return (
    <div>
      <label className="block font-semibold mb-2">Purchase Options:</label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={options.digital}
          onChange={() => {
            onToggle("digital");
            if (inCart)
              updateCart2({
                format: "jpg",
            
              });
          }}
        />
        Digital – <span className="font-medium">${digitalPrice}</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
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
        Print – <span className="font-medium">${printPrice}</span>
      </label>
    </div>
  );
}
