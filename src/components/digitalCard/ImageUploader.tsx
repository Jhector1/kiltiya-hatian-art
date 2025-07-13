// File: components/DigitalCardCustomizer/ImageUploader.tsx
"use client";

import React from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleChange}
      className="block mx-auto mt-4"
    />
  );
}
