"use client";

import React, { useMemo } from "react";
import "./artworkFrameSquare.css";
import {
  MaterialOption,
  FrameOption,
  CartSelectedItem,
  CartUpdates,
} from "@/types";
import { ArtworkFrameSquare } from "./artworkFrameSquare";

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
  setMaterialAction: (material: MaterialOption) => void;
  updateCart: (updates: CartUpdates) => void;
  inCart: CartSelectedItem | null;
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
  const price = useMemo(() => {
    const raw =
      basePrice * formatMultiplier * sizeMultiplier * material.multiplier;
    return raw.toFixed(2);
  }, [basePrice, formatMultiplier, sizeMultiplier, material]);

  const [parsedFrameWidth, parsedFrameColor] = useMemo(() => {
    if (!frame?.border) return [0, "#000"];
    const parts = frame.border.split(" ");
    const widthPx = parseInt(parts[0], 10) || 0;
    const color = parts[2] || "#000";
    return [widthPx, color];
  }, [frame]);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg space-y-6 max-w-5xl mx-auto">
      {/* Material Selector */}
      <div>
        <h3 className="font-semibold mb-2">Material:</h3>
        <div className="flex flex-wrap gap-4">
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
                  if (inCart) updateCart({ material: m.label });
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 relative">
                  <img
                    src={m.thumbnail}
                    alt={m.label}
                    className="object-cover rounded w-full h-full"
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
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => {
              setFrameAction(null);
              if (inCart) updateCart({ frame: "" });
            }}
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
                if (inCart) updateCart({ frame: f.label });
              }}
              className={`px-3 py-1 rounded bg-[url("/images/textures/${f.label
                .split(" ")[0]
                .trim()
                .toLowerCase()}-wood.png")] bg-cover bg-center bg-no-repeat ${
                f.label === "White" ? "text-black" : "text-white"
              } ${
                frame?.label === f.label &&
                "border-2 border-transparent outline outline-2 outline-purple-600 outline-offset-4"
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
          className={`
            relative w-full max-w-3xl aspect-[4/3] mx-auto p-4 sm:p-6
            cursor-zoom-in 
            flex items-center justify-center
            ${
              parsedFrameColor !== "#000" &&
              "bg-[url('/images/textures/concrete-wall.png')]"
            }
            bg-cover bg-center
            before:content-['']
            before:absolute before:inset-0
            before:bg-white/30
            before:mix-blend-overlay
          `}
        >
          <div className="inline-flex items-center justify-center bg-white shadow-md overflow-hidden">
            <ArtworkFrameSquare
              imageSrc={imageSrc}
              width={400}
              frameWidth={parsedFrameWidth}
              frameColor={parsedFrameColor}
              linerWidth={6}
              linerColor="#D4AF37"
              mattePadding={50}
              matteColor="#fff"
            />
          </div>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold">${price}</span>
      </div>
    </div>
  );
}
