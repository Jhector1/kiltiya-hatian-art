"use client";
import Image, { type ImageProps, type StaticImageData } from "next/image";
import React, { useState } from "react";
import ImageModal from "../store/ImageModal";

// Extend ImageProps to enforce src as string or StaticImageData and alt as string
interface ProductImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string | StaticImageData;
  alt: string;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  className,
  ...imgProps
}: ProductImageProps) {
  // State to control modal zoom
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);

  // Validate and normalize the image source URL
  let imageSrc: string;
  if (typeof src === "string") {
    try {
      imageSrc = new URL(src).toString();
    } catch {
      imageSrc = src.startsWith("/") ? src : "/placeholder.png";
    }
  } else {
    imageSrc = src.src; // StaticImageData has a `src` property
  }

  // Handlers for opening and closing the zoom modal
  const handleOpenZoom = () => setZoomImage({ src: imageSrc, title: alt });
  const handleCloseZoom = () => setZoomImage(null);

  return (
    <>
      <div
        className={`relative w-full h-96 rounded-xl shadow-lg overflow-hidden bg-gray-50 mb-10 cursor-zoom-in ${className ?? ""}`}
        onClick={handleOpenZoom}
      >
        <Image
          {...imgProps}
          src={imageSrc}
          alt={alt}
          fill
          className="object-contain p-4"
        />
      </div>

      {zoomImage && (
        <ImageModal
          image={zoomImage.src}
          title={zoomImage.title}
          isOpen={true}
          onClose={handleCloseZoom}
        />
      )}
    </>
  );
}
