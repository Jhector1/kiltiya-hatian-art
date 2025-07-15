"use client";

import React, { useState } from "react";
import { SketchPicker } from "react-color";
import "./realisticCard.css";

interface RealisticGreetingCardProps {
  width?: number;
  height?: number;
}

export default function RealisticGreetingCard({
  width = 500,
  height = 300,
}: RealisticGreetingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [frontImageURL, setFrontImageURL] = useState<string | null>(null);
  const [insideImageURL, setInsideImageURL] = useState<string | null>(null);
  const [frontText, setFrontText] = useState("Happy Birthday");
  const [insideText, setInsideText] = useState("Wishing you love and joy!");
  const [bgColor, setBgColor] = useState("#fdf5e6");
  const [frontFont, setFrontFont] = useState("Arial");
  const [insideFont, setInsideFont] = useState("Georgia");
  const [frontImageOpacity, setFrontImageOpacity] = useState(1);
  const [insideImageOpacity, setInsideImageOpacity] = useState(1);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isFront: boolean
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isFront) {
        setFrontImageURL(url);
      } else {
        setInsideImageURL(url);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-6 justify-center items-start">
        <div>
          <label className="block text-sm font-medium mb-1">Front Image</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Inside Image</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Card Color</label>
          <SketchPicker color={bgColor} onChangeComplete={(c) => setBgColor(c.hex)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Front Image Opacity: {frontImageOpacity}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={frontImageOpacity}
            onChange={(e) => setFrontImageOpacity(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="block w-full text-sm font-medium mb-1">Inside Image Opacity: {insideImageOpacity}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={insideImageOpacity}
            onChange={(e) => setInsideImageOpacity(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Text & Font Selection */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <div className="flex flex-col">
          <input
            type="text"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="Front Text"
            className="p-2 border rounded w-64"
          />
          <select
            value={frontFont}
            onChange={(e) => setFrontFont(e.target.value)}
            className="mt-2 p-2 border rounded"
          >
            <option value="Great Vibes, cursive">Arial</option>
            <option value="Pacifico, cursive">Georgia</option>
            <option value="Alex Brush, cursive">Comic Sans MS</option>
            <option value="Courier New">Courier New</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </div>

        <div className="flex flex-col">
          <input
            type="text"
            value={insideText}
            onChange={(e) => setInsideText(e.target.value)}
            placeholder="Inside Text"
            className="p-2 border rounded w-64"
          />
          <select
            value={insideFont}
            onChange={(e) => setInsideFont(e.target.value)}
            className="mt-2 p-2 border rounded"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Courier New">Courier New</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </div>
      </div>

      {/* Card Preview */}
      <div
        className="realistic-card-container"
        style={{ width, height }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`realistic-card ${isOpen ? "open" : ""}`}>
          {/* Inside Panel */}
          <div className="card-panel left" style={{ backgroundColor: bgColor }}>
            <div className="card-face">
              {insideImageURL && (
                <img
                  src={insideImageURL}
                  alt="Inside"
                  style={{ opacity: insideImageOpacity }}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}
              <div
                className="relative z-10 text-xl font-medium text-center p-4 w-full"
                style={{ fontFamily: insideFont }}
              >
                {insideText}
              </div>
            </div>
          </div>

          {/* Front Panel */}
          <div className="card-panel right" style={{ backgroundColor: bgColor }}>
            <div className="card-face">
              {frontImageURL && (
                <img
                  src={frontImageURL}
                  alt="Front"
                  style={{ opacity: frontImageOpacity }}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}
              <div
                className="relative z-10 text-2xl font-bold text-center p-4 w-full"
                style={{ fontFamily: frontFont }}
              >
                {frontText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}