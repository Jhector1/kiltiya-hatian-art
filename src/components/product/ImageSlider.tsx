"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ImageSliderProps {
  images?: string[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const total = images?.length || 0;

  const paginate = (direction: number) => {
    setIndex((prev) => (prev + direction + total) % total);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-[90vw] max-w-md mx-auto overflow-hidden rounded-xl shadow-lg select-none sm:hidden">
      {/* Slide counter */}
      <div className="absolute top-3 right-4 z-10 text-sm text-white bg-black/50 rounded-full px-3 py-1">
        {index + 1}/{total}
      </div>

      {/* Desktop arrows (hidden on small screens) */}
      <button
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
        onClick={() => paginate(-1)}
      >
        ◀
      </button>
      <button
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
        onClick={() => paginate(1)}
      >
        ▶
      </button>

      {/* Swipeable image area */}
      <div className="relative h-[400px] touch-pan-y">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipePower = Math.abs(offset.x) * velocity.x;
              if (swipePower < -1000) paginate(1);
              else if (swipePower > 1000) paginate(-1);
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Image
              src={images[index]}
              alt={`Slide ${index + 1}`}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-blue-600" : "w-2 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
