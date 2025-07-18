// File: components/DigitalCardCustomizer/DigitalCard.tsx
"use client";

import React, { useState } from "react";
import OccasionSelector from "./OccasionSelector";
import TextCustomizer from "./TextCustomizer";
import ColorPicker from "./ColorPicker";
import ImageUploader from "./ImageUploader";
// const CardCanvas = dynamic(() => import("./CardCanvas"), { ssr: false });
import html2canvas from "html2canvas";
import RealisticGreetingCard  from "./FoldingCard";
// import dynamic from "next/dynamic";
// const CardCanvas = dynamic(() => import("./CardCanvas"), { ssr: false });

export default function DigitalCard() {
  const [occasion, setOccasion] = useState("Birthday");
  const [message, setMessage] = useState("Wishing you joy and love!");
  const [font, setFont] = useState("Great Vibes");
  const [color, setColor] = useState("#FF69B4");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);

  const exportCard = async () => {
    const card = document.getElementById("card-preview");
    if (card) {
      const canvas = await html2canvas(card);
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = "digital_card.png";
      a.click();
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImageURL(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-center">
      <h1 className="text-3xl font-bold">Create a Hyperrealistic Digital Card</h1>

      <div className="space-y-4">
        <OccasionSelector value={occasion} onChange={setOccasion} />
        <TextCustomizer
          message={message}
          font={font}
          onMessageChange={setMessage}
          onFontChange={setFont}
        />
        <ColorPicker color={color} onChange={setColor} />
        <ImageUploader onUpload={handleImageUpload} />
      </div>
{/* 
      <CardCanvas
        id="card-preview"
        occasion={occasion}
        message={message}
        font={font}
        color={color}
        imageURL={imageURL}
      /> */}

      <button
        onClick={exportCard}
        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow"
      >
        Save / Download Card
      </button>
      {/* <FoldingCard
  frontImageURL={imageURL}
  message={message}
  font={font}
  color={color}
  occasion={occasion}
/> */}

{/* <BookStyleCard
  frontImageURL={imageURL}
  message={message}
/> */}

<RealisticGreetingCard
  // frontImageURL="/images/card-front.png"
  // insideImageURL="/images/card-inside.png"
  width={500}
  height={300}
/>
    </div>
  );
}
