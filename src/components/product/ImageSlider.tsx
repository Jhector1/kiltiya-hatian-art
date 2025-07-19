'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import Image from 'next/image';

interface ImageSliderProps {
  images?: string[];
}

export default function ImageSlider({ images = [] }: ImageSliderProps) {
  const total = images.length;
  const [index, setIndex] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Set fallback width to avoid blank screen
  const [slideWidth, setSlideWidth] = useState(360);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setSlideWidth(containerRef.current.offsetWidth || 360);
      }
    };

    setIsTouch(navigator.maxTouchPoints > 0);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const snapToIndex = (i: number) => {
    const newIndex = Math.max(0, Math.min(i, total - 1));
    setIndex(newIndex);
    animate(x, -newIndex * slideWidth, {
      type: 'spring',
      stiffness: 300,
      damping: 35,
    });
  };

 const handleDragEnd = (_: any, info: any) => {
  const offsetX = info.offset.x;

  if (offsetX < -slideWidth * 0.25 && index < total - 1) {
    // Swiped left to next
    snapToIndex(index + 1);
  } else if (offsetX > slideWidth * 0.25 && index > 0) {
    // Swiped right to previous
    snapToIndex(index - 1);
  } else {
    // Not enough swipe — snap back
    snapToIndex(index);
  }
};

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto overflow-hidden select-none"
    >
      {/* Counter */}
      <div className="absolute top-3 right-4 z-10 text-sm text-white bg-black/50 rounded-full px-3 py-1">
        {index + 1}/{total}
      </div>

      {/* Arrows for non-touch */}
      {!isTouch && (
        <>
          <button
            onClick={() => snapToIndex(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
          >
            ◀
          </button>
          <button
            onClick={() => snapToIndex(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white text-black rounded-full p-2"
          >
            ▶
          </button>
        </>
      )}

      {/* Draggable track */}
      <motion.div
        drag="x"
        dragElastic={0.3}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex"
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 h-[400px]"
            style={{ width: `${slideWidth}px` }}
          >
            <Image
              src={src}
              alt={`Slide ${i + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority={i === index}
            />
          </div>
        ))}
      </motion.div>

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => snapToIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-4 bg-blue-600' : 'w-2 bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
