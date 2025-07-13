// File: components/DigitalCardCustomizer/ColorPicker.tsx
"use client";

import React from "react";
import { SketchPicker } from "react-color";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex justify-center">
      <SketchPicker
        color={color}
        onChangeComplete={(c) => onChange(c.hex)}
      />
    </div>
  );
}
