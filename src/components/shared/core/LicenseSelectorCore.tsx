// src/components/shared/core/LicenseSelectorCore.tsx
"use client";
import React from "react";
import type { LicenseOption } from "@/types";

export default function LicenseSelectorCore({
  selected,
  licenses,
  onSelect,
  disabled,
}: {
  selected: LicenseOption;
  licenses: LicenseOption[];
  onSelect: (licence: LicenseOption) => void;
  disabled?: boolean;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Choose License</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {licenses.map((license) => (
          <button
            key={license.type}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(license)}
            className={[
              "text-left rounded-xl border-2 p-4 transition-all",
              selected.type === license.type ? "border-black shadow-md bg-gray-50" : "border-gray-200 hover:border-gray-400",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-medium text-gray-900">{license.name}</h4>
              <span className="text-sm font-semibold text-gray-600">
                {license.type === "personal" ? "FREE" : `$${license.price}`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{license.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
