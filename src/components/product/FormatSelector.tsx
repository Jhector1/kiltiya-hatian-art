// File: components/FormatSelector.tsx
"use client";
import { Format } from "@/types";
import React from "react";

export default function FormatSelector({
  formats,
  selected,
  onChangeAction,
  updateCart,
  inCart,
}: {
  formats: Format[];
  selected: string;
  updateCart: (updates: { [key: string]: any }) => void;
  inCart: boolean;
  onChangeAction: (f: string) => void;
}) {
  return (
    <div>
      <label className="block font-semibold mb-2">Format:</label>
      <div className="flex flex-wrap gap-4">
        {formats.map((f) => (
          <label
            key={f.type + f.resolution}
            className="flex  items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="format"
              value={f.type}
              checked={selected === f.type}
              onChange={() => {
                onChangeAction(f.type);
                if (inCart) updateCart({'format': f.type});

              }}
            />
            <span className="text-sm">
              {f.type} <span className="text-gray-500">({f.resolution})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
