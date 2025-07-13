// File: components/DigitalCardCustomizer/OccasionSelector.tsx
"use client";

import React from "react";

interface OccasionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function OccasionSelector({ value, onChange }: OccasionSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border rounded w-full"
    >
      <option>Birthday</option>
      <option>Anniversary</option>
      <option>Graduation</option>
      <option>Congratulations</option>
      <option>Thank You</option>
    </select>
  );
}
