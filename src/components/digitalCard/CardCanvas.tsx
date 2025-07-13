// File: components/DigitalCardCustomizer/CardCanvas.tsx
"use client";

import React from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

interface CardCanvasProps {
  id?: string;
  occasion: string;
  message: string;
  font: string;
  color: string;
  imageURL: string | null;
}

export default function CardCanvas({ id, occasion, message, font, color, imageURL }: CardCanvasProps) {
  const [image] = useImage(imageURL || "", "anonymous");

  return (
    <div
      id={id}
      className="border rounded-lg shadow-md p-2 bg-gray-50 inline-block"
    >
      <Stage width={500} height={300}>
        <Layer>
          {image && <KonvaImage image={image} width={500} height={300} />}
          <Text
            text={occasion.toUpperCase()}
            fontSize={24}
            fontFamily="Georgia"
            fill="#333"
            x={20}
            y={20}
          />
          <Text
            text={message}
            fontSize={30}
            fontFamily={font}
            fill={color}
            x={40}
            y={140}
            width={420}
            align="center"
          />
        </Layer>
      </Stage>
    </div>
  );
}
