"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import {
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import NextImage from "next/image";

type Dir = 1 | -1;

interface ImageSliderProps {
  images?: string[];
  autoPlayMs?: number; // default 4500
}

export default function ImageSlider({
  images = [],
  autoPlayMs = 4500,
}: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const total = images.length;
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameW, setFrameW] = useState(0);

  // Shared motion value for the whole track (reveals neighbors while dragging)
  const x = useMotionValue(0);

  useEffect(() => {
    setIsTouch(typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  }, []);

  // Measure frame width (for constraints + snapping)
  useLayoutEffect(() => {
    const measure = () => {
      const w = frameRef.current?.clientWidth ?? 0;
      setFrameW(w);
      x.set(0); // keep centered on resize
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap = (i: number) => (total ? (i + total) % total : 0);
  const nextIndex = wrap(index + 1);
  const prevIndex = wrap(index - 1);

  const go = (dir: Dir) => setIndex((p) => wrap(p + dir));
  const goTo = (to: number) => setIndex(wrap(to));

  // Velocity-aware swipe helper
  const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
  const SWIPE_VEL = 700;

  // Autoplay (pauses on hover/focus/hidden tab)
  useEffect(() => {
    if (total <= 1) return;
    if (isPaused) return;
    if (typeof document !== "undefined" && document.hidden) return;

    timerRef.current = window.setTimeout(async () => {
      if (frameW > 0) {
        await animate(x, -frameW, { type: "spring", stiffness: 220, damping: 28, mass: 0.9 });
        go(1);
        x.set(0);
      } else {
        go(1);
      }
    }, autoPlayMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, isPaused, total, autoPlayMs, frameW, x]);

  useEffect(() => {
    const onVis = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (total <= 1) return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, frameW]);

  const step = async (dir: Dir) => {
    if (frameW <= 0) return go(dir);
    await animate(x, dir === 1 ? -frameW : frameW, {
      type: "spring",
      stiffness: 220,
      damping: 28,
      mass: 0.9,
    });
    go(dir);
    x.set(0);
  };

  if (total === 0) return null;

  // Derived motion values from x
  // scale: x ∈ [-frameW, 0, frameW] → [0.98, 1, 0.98]
  const scale = useTransform(x, (val) =>
    frameW ? 1 - 0.02 * Math.min(1, Math.abs(val) / frameW) : 1
  );
  // blur: build the full CSS filter string to avoid mixing static + motion
  const filter = useTransform(x, (val) => {
    if (!frameW) return "blur(0px)";
    const px = (Math.min(Math.abs(val), frameW) / frameW) * 2; // up to 2px blur
    return `blur(${px}px)`;
  });

  const sizes = useMemo(() => "(max-width: 768px) 90vw, 420px", []);

  return (
    <div
      className="relative w-[90vw] max-w-md mx-auto overflow-hidden rounded-2xl shadow-xl select-none bg-neutral-900"
      onPointerEnter={() => !isTouch && setIsPaused(true)}
      onPointerLeave={() => !isTouch && setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image slider"
    >
      {/* Edge vignettes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent z-10" />

      {/* Counter */}
      <div className="absolute top-3 right-3 z-20 text-xs text-white/90 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
        {index + 1}/{total}
      </div>

      {/* Arrows (desktop) */}
      {total > 1 && !isTouch && (
        <>
          <button
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/75 hover:bg-white active:scale-95 text-black rounded-full p-2 shadow-sm transition"
            onClick={() => step(-1)}
          >
            ◀
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/75 hover:bg-white active:scale-95 text-black rounded-full p-2 shadow-sm transition"
            onClick={() => step(1)}
          >
            ▶
          </button>
        </>
      )}

      {/* Track (prev | current | next) */}
      <div ref={frameRef} className="relative h-[420px]">
        <motion.div
          className="absolute inset-0 w-[300%] h-full flex"
          style={{ x, touchAction: "pan-y" as any }}
          drag={total > 1 ? "x" : false}
          dragConstraints={{ left: -frameW, right: frameW }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={async (_e, info: PanInfo) => {
            if (frameW <= 0) return;
            const power = swipePower(info.offset.x, info.velocity.x);
            const dist = info.offset.x;
            const snapNext = dist < -frameW * 0.2 || power < -SWIPE_VEL;
            const snapPrev = dist > frameW * 0.2 || power > SWIPE_VEL;

            if (snapNext) {
              await animate(x, -frameW, { type: "spring", stiffness: 220, damping: 28, mass: 0.9 });
              go(1);
              x.set(0);
            } else if (snapPrev) {
              await animate(x, frameW, { type: "spring", stiffness: 220, damping: 28, mass: 0.9 });
              go(-1);
              x.set(0);
            } else {
              await animate(x, 0, { type: "spring", stiffness: 260, damping: 30, mass: 0.9 });
            }
          }}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* Prev */}
          <div className="relative h-full w-1/3">
            <div className="absolute inset-0">
              <NextImage
                src={images[prevIndex]}
                alt={`Slide ${prevIndex + 1}`}
                fill
                sizes={sizes}
                draggable={false}
                className="object-contain opacity-90"
              />
            </div>
          </div>

          {/* Current */}
          <div className="relative h-full w-1/3">
            <motion.div className="absolute inset-0" style={{ scale, filter }}>
              <NextImage
                key={images[index]}
                src={images[index]}
                alt={`Slide ${index + 1}`}
                fill
                sizes={sizes}
                priority
                draggable={false}
                className="object-contain"
              />
            </motion.div>
          </div>

          {/* Next */}
          <div className="relative h-full w-1/3">
            <div className="absolute inset-0">
              <NextImage
                src={images[nextIndex]}
                alt={`Slide ${nextIndex + 1}`}
                fill
                sizes={sizes}
                draggable={false}
                className="object-contain opacity-90"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center mt-4 gap-2 pb-3">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => {
                if (i === index || frameW <= 0) return;
                const forward = (i - index + total) % total;
                const backward = (index - i + total) % total;
                // step just moves one; for multi-jump you could loop step(dir) forward times
                step(forward <= backward ? 1 : -1);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
