'use client';

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import './artworkFrameSquare.css';

export interface ArtworkFrameSquareProps {
  imageSrc: string;
  width?: number;            // container width in px
  frameColor?: string;       // outer frame color
  frameWidth?: number;       // outer frame thickness
  linerColor?: string;       // metallic liner color
  linerWidth?: number;       // liner thickness
  matteColor?: string;       // mat board color
  mattePadding?: number;     // mat board width
}

export function ArtworkFrameSquare({
  imageSrc,
  width = 600,
  frameColor = '#000',
  frameWidth = 20,
  linerColor = '#D4AF37',
  linerWidth = 4,
  matteColor = '#fff',
  mattePadding = 60,
}: ArtworkFrameSquareProps) {
  const [ratio, setRatio] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load image to determine aspect ratio
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => setRatio(img.naturalHeight / img.naturalWidth);
  }, [imageSrc]);

  // Compute dimensions based on ratio
  const computedWidth = width;
  const computedHeight = width * ratio;

  // 3D-tilt lighting effect
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const { left, top, width: w, height: h } = svgRef.current.getBoundingClientRect();
    svgRef.current.style.setProperty('--lx', `${((e.clientX - left) / w) * 100}%`);
    svgRef.current.style.setProperty('--ly', `${((e.clientY - top) / h) * 100}%`);
  };

  const innerTotal = frameWidth + linerWidth + mattePadding;
  const innerW = computedWidth - 2 * innerTotal;
  const innerH = computedHeight - 2 * innerTotal;

  return (
    <svg
      ref={svgRef}
      className="artwork-frame-square"
      viewBox={`0 0 ${computedWidth} ${computedHeight}`}
      style={{ width: computedWidth, height: computedHeight }}
      onMouseMove={handleMouseMove}
      onClick={() => svgRef.current?.classList.toggle('open')}
    >
      <defs>
        <filter id="frameShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.4"/>
        </filter>
        <clipPath id="squareClip">
          <rect x={innerTotal} y={innerTotal} width={innerW} height={innerH} />
        </clipPath>
      </defs>

      {/* Outer frame */}
      <rect
        x={frameWidth/2}
        y={frameWidth/2}
        width={computedWidth - frameWidth}
        height={computedHeight - frameWidth}
        fill="none"
        stroke={frameColor}
        strokeWidth={frameWidth}
        filter="url(#frameShadow)"
      />

      {/* Gold liner */}
      {frameColor !=='#000' &&
      <rect
        x={frameWidth + linerWidth/2}
        y={frameWidth + linerWidth/2}
        width={computedWidth - 2*frameWidth - linerWidth}
        height={computedHeight - 2*frameWidth - linerWidth}
        fill="none"
        stroke={linerColor}
        strokeWidth={linerWidth}
      />}

      {/* White mat */}
      <rect
        x={innerTotal}
        y={innerTotal}
        width={innerW}
        height={innerH}
        fill={matteColor}
      />

      {/* Clipped artwork */}
      <g clipPath="url(#squareClip)">
        <image
          href={imageSrc}
          x={innerTotal}
          y={innerTotal}
          width={innerW}
          height={innerH}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </svg>
  );
}
