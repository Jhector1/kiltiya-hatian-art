// File: components/PrintCustomizer.tsx
"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { MaterialOption, FrameOption, CartSelectedItem, CartUpdates } from "@/types";

interface PrintCustomizerProps {
  basePrice: number;
  formatMultiplier: number;
  sizeMultiplier: number;
  imageSrc: string;
  materials: MaterialOption[];
  frames: FrameOption[];
  setFrameAction: (frame: FrameOption | null) => void;
  frame: FrameOption | null;
  material: MaterialOption;
  updateCart: (updates: CartUpdates) => void;
  inCart: CartSelectedItem | null;
  setMaterialAction: (material: MaterialOption) => void;
}

export default function PrintCustomizer({
  basePrice,
  formatMultiplier,
  sizeMultiplier,
  imageSrc,
  materials,
  frames,
  setFrameAction,
  frame,
  material,
  setMaterialAction,
  updateCart,
  inCart,
}: PrintCustomizerProps) {
  // const [material, setMaterial] = useState<MaterialOption>(materials[0]);
  // const [frame, setFrame] = useState<FrameOption | null>(null);

  const price = useMemo(() => {
    const raw =
      basePrice * formatMultiplier * sizeMultiplier * material.multiplier;
    return raw.toFixed(2);
  }, [basePrice, formatMultiplier, sizeMultiplier, material]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg space-y-6">
      {/* Material Selector */}
      <div>
        <h3 className="font-semibold mb-2">Material:</h3>
        <div className="flex gap-4">
          {materials.map((m) => (
            <label
              key={m.label}
              className={`cursor-pointer p-2 border rounded-lg transition-shadow ${
                material.label === m.label
                  ? "shadow-md border-purple-600"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="material"
                value={m.label}
                className="sr-only"
                checked={material.label === m.label}
                onChange={() => {
                  setMaterialAction(m);
                  if (inCart) updateCart({'material':m.label});
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 relative">
                  <Image
                    src={m.thumbnail}
                    alt={m.label}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <span className="text-sm">{m.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Frame Selector */}
      <div>
        <h3 className="font-semibold mb-2">Frame:</h3>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setFrameAction(null)}
            className={`px-3 py-1 rounded ${
              frame === null ? "bg-purple-600 text-white" : "bg-gray-100"
            }`}
          >
            None
          </button>
          {frames.map((f) => (
            <button
              key={f.label}
              onClick={() => {
                setFrameAction(f);
                if (inCart) updateCart({'frame': f.label});
              }}
              className={`px-3 py-1 rounded ${
                frame?.label === f.label
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="font-semibold mb-2">Preview:</h3>
        <div
          className="relative w-full h-64	bg-gray-50 overflow-hidden rounded-lg p-4"
          style={frame ? { border: frame.border, padding: "1rem" } : undefined}
        >
          <Image
            src={imageSrc}
            alt="Artwork Preview"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Price Display */}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold">${price}</span>
      </div>
    </div>
  );
}
