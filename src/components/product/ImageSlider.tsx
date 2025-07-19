"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ImageSliderProps {
  images?: string[];
}

export default function ImageSlider({ images }: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const total = images?.length || 0;

  useEffect(() => {
    // Determine if device supports touch
    setIsTouch(navigator.maxTouchPoints > 0);
  }, []);

  const paginate = (dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + total) % total);
  };

  if (!images || images.length === 0) return null;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative w-[90vw] max-w-md mx-auto overflow-hidden rounded-xl shadow-lg select-none">
      {/* Slide counter */}
      <div className="absolute top-3 right-4 z-10 text-sm text-white bg-black/50 rounded-full px-3 py-1">
        {index + 1}/{total}
      </div>

      {/* Arrows (only show on non-touch devices) */}
      {!isTouch && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
            onClick={() => paginate(-1)}
          >
            ◀
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
            onClick={() => paginate(1)}
          >
            ▶
          </button>
        </>
      )}

      {/* Image swipe area */}
      <div className="relative h-[400px] touch-pan-y">
        <AnimatePresence custom={direction} mode="wait" initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragElastic={0.5} // 💡 soft elastic bounce
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -100) paginate(1);      // swipe left
              else if (offset.x > 100) paginate(-1); // swipe right
              // else do nothing: allows peek
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
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

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i === index) return;
              paginate(i > index ? 1 : -1);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-blue-600" : "w-2 bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
