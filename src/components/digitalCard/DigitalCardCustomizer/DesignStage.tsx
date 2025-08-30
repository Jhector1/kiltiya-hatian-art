"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Stage,
  Layer,
  Text as KText,
  Image as KImage,
  Group,
  Transformer,
} from "react-konva";

export type FaceKey = "outside-front" | "outside-back" | "inside-left" | "inside-right";

export type DesignEl =
  | {
      id: string;
      type: "text";
      x: number; y: number; width: number; height: number;
      rotation: number; z: number; locked?: boolean; opacity: number;
      text: string; color: string; fontFamily: string; fontSize: number; fontStyle?: string;
    }
  | {
      id: string;
      type: "emoji";
      x: number; y: number; width: number; height: number;
      rotation: number; z: number; locked?: boolean; opacity: number;
      text: string; fontSize: number;
    }
  | {
      id: string;
      type: "image";
      x: number; y: number; width: number; height: number;
      rotation: number; z: number; locked?: boolean; opacity: number;
      src: string;
    };

export interface DesignStageProps {
  width: number;
  height: number;
  elements: DesignEl[];
  onChange(elements: DesignEl[]): void;
  selectedId: string | null;
  onSelect(id: string | null): void;
}

/** Safe image loader hook */
function useHTMLImage(src?: string) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.src = src;
    return () => setImg(null);
  }, [src]);
  return img;
}

/** Image element node */
function ImageNode({
  el,
  onSelect,
  updateEl,
}: {
  el: Extract<DesignEl, { type: "image" }>;
  onSelect: (id: string) => void;
  updateEl: (id: string, patch: Partial<DesignEl>) => void;
}) {
  const img = useHTMLImage(el.src);
  return (
    <Group
      id={`shape-${el.id}`}
      x={el.x}
      y={el.y}
      rotation={el.rotation || 0}
      draggable={!el.locked}
      opacity={el.opacity ?? 1}
      onClick={() => onSelect(el.id)}
      onTap={() => onSelect(el.id)}
      onDragEnd={(evt) => updateEl(el.id, { x: evt.target.x(), y: evt.target.y() })}
      onTransformEnd={(evt) => {
        const node = evt.target as any;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        updateEl(el.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * scaleX),
          height: Math.max(10, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    >
      <KImage image={img || undefined} width={el.width} height={el.height} listening={false} />
    </Group>
  );
}

/** Text/Emoji node */
function TextOrEmojiNode({
  el,
  onSelect,
  updateEl,
}: {
  el: Extract<DesignEl, { type: "text" | "emoji" }>;
  onSelect: (id: string) => void;
  updateEl: (id: string, patch: Partial<DesignEl>) => void;
}) {
  return (
    <Group
      id={`shape-${el.id}`}
      x={el.x}
      y={el.y}
      rotation={el.rotation || 0}
      draggable={!el.locked}
      opacity={el.opacity ?? 1}
      onClick={() => onSelect(el.id)}
      onTap={() => onSelect(el.id)}
      onDragEnd={(evt) => updateEl(el.id, { x: evt.target.x(), y: evt.target.y() })}
      onTransformEnd={(evt) => {
        const node = evt.target as any;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        updateEl(el.id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * scaleX),
          height: Math.max(10, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    >
      {el.type === "text" ? (
        <KText
          text={el.text}
          fontSize={el.fontSize}
          fontFamily={el.fontFamily}
          fill={el.color}
          width={el.width}
          height={el.height}
          align="center"
          verticalAlign="middle"
          listening={false}
          fontStyle={el.fontStyle}
        />
      ) : (
        <KText
          text={el.text}
          fontSize={el.fontSize}
          width={el.width}
          height={el.height}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
    </Group>
  );
}

export default function DesignStage({
  width,
  height,
  elements,
  onChange,
  selectedId,
  onSelect,
}: DesignStageProps) {
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const updateEl = (id: string, patch: Partial<DesignEl>) => {
    onChange(elements.map(el => (el.id === id ? { ...el, ...patch } as DesignEl : el)));
  };

  // Bind transformer to selection
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = stageRef.current?.findOne(`#shape-${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  // Render order
  const ordered = useMemo(() => [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0)), [elements]);

  // Delete key support
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        onChange(elements.filter(el => el.id !== selectedId));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selectedId, elements, onChange]);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, zIndex: 50 }}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>
        {ordered.map(el =>
          el.type === "image" ? (
            <ImageNode key={el.id} el={el} onSelect={onSelect} updateEl={updateEl} />
          ) : (
            <TextOrEmojiNode key={el.id} el={el as any} onSelect={onSelect} updateEl={updateEl} />
          )
        )}

        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            "top-left","top-right","bottom-left","bottom-right",
            "top-center","bottom-center","middle-left","middle-right"
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}
