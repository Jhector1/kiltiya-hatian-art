// File: components/DigitalCardCustomizer/TextCustomizer.tsx
"use client";

import React from "react";

interface TextCustomizerProps {
  message: string;
  font: string;
  onMessageChange: (value: string) => void;
  onFontChange: (value: string) => void;
}

export default function TextCustomizer({ message, font, onMessageChange, onFontChange }: TextCustomizerProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Your message"
        className="p-2 border rounded w-full"
      />
      <input
        type="text"
        value={font}
        onChange={(e) => onFontChange(e.target.value)}
        placeholder="Font family (e.g. Arial, Times New Roman)"
        className="p-2 border rounded w-full"
      />
    </div>
  );
}
