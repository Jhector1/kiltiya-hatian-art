"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { SketchPicker } from "react-color";
import html2canvas from "html2canvas";
import "./realisticCard.css";

type FaceKey = "front" | "back" | "inLeft" | "inRight";

type BaseEl = {
  id: string;
  type: "text" | "emoji" | "image";
  xPct: number; // 0..100 (left)
  yPct: number; // 0..100 (top)
  rotation: number; // deg
  scale: number; // 0.3..3
  opacity: number; // 0..1
  z: number; // stacking index
};

type TextEl = BaseEl & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number; // base px (before scale)
  color: string;
  fontWeight: 400 | 600 | 700;
  fontStyle: "normal" | "italic";
  align: "left" | "center" | "right";
  shadow: boolean;
  bg?: string | null;
  pad?: number; // px
};

type EmojiEl = BaseEl & {
  type: "emoji";
  emoji: string;
  fontSize: number; // base px (before scale)
};

type ImageEl = BaseEl & {
  type: "image";
  url: string;
  widthPct: number; // % of face width (before scale)
  aspect?: number | null;
};

type DesignEl = TextEl | EmojiEl | ImageEl;

interface RealisticGreetingCardProps {
  width?: number;
  height?: number;
}

function uid(prefix = "el"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function RealisticGreetingCard({
  width = 700,
  height = 420,
}: RealisticGreetingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Angles
  const [openAngle, setOpenAngle] = useState<number>(-35);
  const [bookTilt, setBookTilt] = useState<number>(165);

  // Background images
  const [frontImageURL, setFrontImageURL] = useState<string | null>(null);
  const [backImageURL, setBackImageURL] = useState<string | null>(null);
  const [insideLeftImageURL, setInsideLeftImageURL] = useState<string | null>(null);
  const [insideRightImageURL, setInsideRightImageURL] = useState<string | null>(null);

  // Optional static texts (keep for quick labels if you want)
  const [frontText, setFrontText] = useState("Happy Birthday");
  const [backText, setBackText] = useState("© Your Brand");
  const [insideLeftText, setInsideLeftText] = useState("To: You");
  const [insideRightText, setInsideRightText] = useState("Wishing you love and joy!");

  // Styles
  const [bgColor, setBgColor] = useState("#fdf5e6");
  const [frontFont, setFrontFont] = useState("Great Vibes, cursive");
  const [insideFont, setInsideFont] = useState("Georgia, serif");
  const [backFont, setBackFont] = useState("Arial, sans-serif");

  const [frontImageOpacity, setFrontImageOpacity] = useState(1);
  const [backImageOpacity, setBackImageOpacity] = useState(1);
  const [insideLeftImageOpacity, setInsideLeftImageOpacity] = useState(1);
  const [insideRightImageOpacity, setInsideRightImageOpacity] = useState(1);

  // Design mode & layers per face
  const [designMode, setDesignMode] = useState<boolean>(true);
  const [activeFace, setActiveFace] = useState<FaceKey>("front");
  const faceRefs = useRef<Record<FaceKey, HTMLDivElement | null>>({
    front: null,
    back: null,
    inLeft: null,
    inRight: null,
  });

  const [layers, setLayers] = useState<Record<FaceKey, DesignEl[]>>({
    front: [],
    back: [],
    inLeft: [],
    inRight: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Upload helpers
  const uploadFaceImage = (e: React.ChangeEvent<HTMLInputElement>, which: FaceKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "front") setFrontImageURL(url);
    else if (which === "back") setBackImageURL(url);
    else if (which === "inLeft") setInsideLeftImageURL(url);
    else setInsideRightImageURL(url);
  };

  // Quick view switcher so the clicked face is visible
  const showFace = useCallback((face: FaceKey) => {
    setActiveFace(face);
    if (face === "front") {
      setIsFlipped(false);
      setIsOpen(false);
    } else if (face === "back") {
      setIsFlipped(true);
      setIsOpen(false);
    } else if (face === "inLeft" || face === "inRight") {
      setIsFlipped(false);
      setIsOpen(true);
    }
  }, []);

  // ---- Dragging ----
  type DragState = {
    id: string;
    face: FaceKey;
  } | null;

  const drag = useRef<DragState>(null);

  const getFaceRect = (face: FaceKey) => {
    const el = faceRefs.current[face];
    return el?.getBoundingClientRect() || null;
  };

  const pctFromClient = (clientX: number, clientY: number, face: FaceKey) => {
    const rect = getFaceRect(face);
    if (!rect) return { xPct: 0, yPct: 0 };
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { xPct: (x / rect.width) * 100, yPct: (y / rect.height) * 100 };
  };

  const onPointerMove = useCallback((evt: PointerEvent) => {
    if (!drag.current) return;
    const { id, face } = drag.current;
    const { xPct, yPct } = pctFromClient(evt.clientX, evt.clientY, face);
    setLayers((prev) => {
      const next = { ...prev };
      next[face] = next[face].map((el) => (el.id === id ? { ...el, xPct, yPct } : el));
      return next;
    });
  }, []);

  const stopDragging = useCallback(() => {
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove as any);
    window.removeEventListener("pointerup", stopDragging);
  }, [onPointerMove]);

  const startDragging = (e: React.PointerEvent, id: string, face: FaceKey) => {
    if (!designMode) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, face };
    window.addEventListener("pointermove", onPointerMove as any);
    window.addEventListener("pointerup", stopDragging);
  };

  // ---- Selection & keyboard nudge/delete ----
  useEffect(() => {
    if (!designMode) return;
    function onKey(e: KeyboardEvent) {
      if (!selectedId) return;
      const list = layers[activeFace];
      const el = list.find((x) => x.id === selectedId);
      if (!el) return;

      const STEP = e.shiftKey ? 2 : 0.5;

      if (e.key === "Delete" || e.key === "Backspace") {
        setLayers((prev) => {
          const next = { ...prev };
          next[activeFace] = next[activeFace].filter((x) => x.id !== selectedId);
          return next;
        });
        setSelectedId(null);
        e.preventDefault();
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        setLayers((prev) => {
          const next = { ...prev };
          next[activeFace] = next[activeFace].map((x) =>
            x.id === selectedId
              ? {
                  ...x,
                  xPct: Math.max(0, Math.min(100, x.xPct + (e.key === "ArrowRight" ? STEP : e.key === "ArrowLeft" ? -STEP : 0))),
                  yPct: Math.max(0, Math.min(100, x.yPct + (e.key === "ArrowDown" ? STEP : e.key === "ArrowUp" ? -STEP : 0))),
                }
              : x
          );
          return next;
        });
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [designMode, selectedId, activeFace, layers]);

  const currentLayers = layers[activeFace].slice().sort((a, b) => a.z - b.z);
  const selected = layers[activeFace].find((x) => x.id === selectedId) || null;

  // ---- Mutators ----
  const addText = () => {
    const id = uid("txt");
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = [
        ...next[activeFace],
        {
          id,
          type: "text",
          text: "Double-click to edit",
          xPct: 50,
          yPct: 50,
          rotation: 0,
          scale: 1,
          opacity: 1,
          z: Date.now(),
          fontFamily: "Georgia, serif",
          fontSize: 28,
          color: "#1f2937",
          fontWeight: 600,
          fontStyle: "normal",
          align: "center",
          shadow: false,
          bg: null,
          pad: 2,
        } as TextEl,
      ];
      return next;
    });
    setSelectedId(id);
  };

  const addEmoji = (emoji?: string) => {
    const id = uid("emo");
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = [
        ...next[activeFace],
        {
          id,
          type: "emoji",
          emoji: emoji || "🎉",
          xPct: 40,
          yPct: 40,
          rotation: 0,
          scale: 1,
          opacity: 1,
          z: Date.now(),
          fontSize: 56,
        } as EmojiEl,
      ];
      return next;
    });
    setSelectedId(id);
  };

  const addStickerImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const id = uid("img");
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = [
        ...next[activeFace],
        {
          id,
          type: "image",
          url,
          xPct: 60,
          yPct: 50,
          rotation: 0,
          scale: 1,
          opacity: 1,
          z: Date.now(),
          widthPct: 30,
          aspect: null,
        } as ImageEl,
      ];
      return next;
    });
    setSelectedId(id);
  };

  const updateSelected = <K extends keyof DesignEl>(key: K, value: DesignEl[K]) => {
    if (!selected) return;
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = next[activeFace].map((x) => (x.id === selected.id ? { ...x, [key]: value } : x));
      return next;
    });
  };

  const updateSelectedText = <K extends keyof TextEl>(key: K, value: TextEl[K]) => {
    if (!selected || selected.type !== "text") return;
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = next[activeFace].map((x) =>
        x.id === selected.id ? ({ ...x, [key]: value } as DesignEl) : x
      );
      return next;
    });
  };

  const bringFwd = () => selected && updateSelected("z", Date.now());

  const sendBack = () =>
    selected &&
    setLayers((prev) => {
      const next = { ...prev };
      const minZ = next[activeFace].length ? Math.min(...next[activeFace].map((x) => x.z)) : 0;
      next[activeFace] = next[activeFace].map((x) => (x.id === selected.id ? { ...x, z: minZ - 1 } : x));
      return next;
    });

  const duplicate = () => {
    if (!selected) return;
    const copy = {
      ...selected,
      id: uid(selected.type),
      xPct: Math.min(100, selected.xPct + 4),
      yPct: Math.min(100, selected.yPct + 4),
      z: Date.now(),
    } as DesignEl;
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = [...next[activeFace], copy];
      return next;
    });
    setSelectedId(copy.id);
  };

  const deleteSel = () => {
    if (!selected) return;
    setLayers((prev) => {
      const next = { ...prev };
      next[activeFace] = next[activeFace].filter((x) => x.id !== selected.id);
      return next;
    });
    setSelectedId(null);
  };

  // Double-click to drop text at cursor (for a given face)
  const onCanvasDblClick = (face: FaceKey, e: React.MouseEvent) => {
    if (!designMode) return;
    const rect = getFaceRect(face);
    if (!rect) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const id = uid("txt");
    setLayers((prev) => {
      const next = { ...prev };
      next[face] = [
        ...next[face],
        {
          id,
          type: "text",
          text: "Edit me",
          xPct,
          yPct,
          rotation: 0,
          scale: 1,
          opacity: 1,
          z: Date.now(),
          fontFamily: "Georgia, serif",
          fontSize: 26,
          color: "#1f2937",
          fontWeight: 600,
          fontStyle: "normal",
          align: "center",
          shadow: false,
          bg: null,
          pad: 2,
        } as TextEl,
      ];
      return next;
    });
    setSelectedId(id);
    setActiveFace(face);
  };

  // Click background to peek open/close (works in design mode too)
  const containerClick = () => {
    setIsOpen((o) => !o);
  };

  // Toolbar
  const toolbar = useMemo(
    () => (
      <div className="realistic-controls flex flex-wrap gap-3 justify-center items-center">
        <button
          type="button"
          onClick={() => setDesignMode((d) => !d)}
          className={`px-4 py-2 rounded ${designMode ? "bg-amber-600" : "bg-slate-600"} text-white shadow`}
          aria-pressed={designMode}
          title="Toggle design/edit mode"
        >
          {designMode ? "Design Mode: ON" : "Design Mode: OFF"}
        </button>

        <div className="inline-flex items-center gap-2">
          <label className="text-sm">Edit Face</label>
          <select
            className="px-2 py-1 rounded border"
            value={activeFace}
            onChange={(e) => setActiveFace(e.target.value as FaceKey)}
          >
            <option value="front">Outside Front (Cover)</option>
            <option value="back">Outside Back</option>
            <option value="inLeft">Inside Left</option>
            <option value="inRight">Inside Right</option>
          </select>
          <button
            className="px-3 py-1 rounded bg-slate-700 text-white"
            onClick={() => showFace(activeFace)}
            title="Switch the preview so this face is visible"
          >
            View this face
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="px-4 py-2 rounded bg-indigo-600 text-white shadow"
          aria-pressed={isOpen}
          title="Peek the card open/closed (works in Design Mode too)"
        >
          {isOpen ? "Close" : "Peek Open"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setIsFlipped((f) => !f);
          }}
          className="px-4 py-2 rounded bg-slate-700 text-white shadow"
          aria-pressed={isFlipped}
          title="Flip between outside and inside views"
        >
          {isFlipped ? "Show Inside" : "Show Outside / Back"}
        </button>

        <button
          type="button"
          onClick={async () => {
            if (!cardRef.current) return;
            const canvas = await html2canvas(cardRef.current, { backgroundColor: null, useCORS: true });
            const data = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = data;
            a.download = isFlipped ? "card_outside.png" : "card_inside.png";
            a.click();
          }}
          className="px-4 py-2 rounded bg-emerald-600 text-white shadow"
        >
          Export PNG (Current View)
        </button>
      </div>
    ),
    [designMode, activeFace, isOpen, isFlipped, showFace]
  );

  // Property / asset panel
  const propPanel = (
    <div className="flex flex-wrap gap-4 items-start justify-center">
      {/* Face backgrounds */}
      <div className="p-3 rounded-lg border bg-white/60">
        <div className="text-sm font-semibold mb-2">Face Backgrounds</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            Outside Front
            <input type="file" accept="image/*" onChange={(e) => uploadFaceImage(e, "front")} />
            <div className="text-[10px]">Opacity: {frontImageOpacity.toFixed(2)}</div>
            <input type="range" min={0} max={1} step={0.05} value={frontImageOpacity}
              onChange={(e) => setFrontImageOpacity(parseFloat(e.target.value))} />
          </label>

          <label className="block text-xs">
            Outside Back
            <input type="file" accept="image/*" onChange={(e) => uploadFaceImage(e, "back")} />
            <div className="text-[10px]">Opacity: {backImageOpacity.toFixed(2)}</div>
            <input type="range" min={0} max={1} step={0.05} value={backImageOpacity}
              onChange={(e) => setBackImageOpacity(parseFloat(e.target.value))} />
          </label>

          <label className="block text-xs">
            Inside Left
            <input type="file" accept="image/*" onChange={(e) => uploadFaceImage(e, "inLeft")} />
            <div className="text-[10px]">Opacity: {insideLeftImageOpacity.toFixed(2)}</div>
            <input type="range" min={0} max={1} step={0.05} value={insideLeftImageOpacity}
              onChange={(e) => setInsideLeftImageOpacity(parseFloat(e.target.value))} />
          </label>

          <label className="block text-xs">
            Inside Right
            <input type="file" accept="image/*" onChange={(e) => uploadFaceImage(e, "inRight")} />
            <div className="text-[10px]">Opacity: {insideRightImageOpacity.toFixed(2)}</div>
            <input type="range" min={0} max={1} step={0.05} value={insideRightImageOpacity}
              onChange={(e) => setInsideRightImageOpacity(parseFloat(e.target.value))} />
          </label>
        </div>
      </div>

      {/* Card color */}
      <div className="p-3 rounded-lg border bg-white/60">
        <div className="text-sm font-semibold mb-2">Card Stock Color</div>
        <SketchPicker color={bgColor} onChangeComplete={(c) => setBgColor(c.hex)} />
      </div>

      {/* Angles */}
      <div className="p-3 rounded-lg border bg-white/60">
        <div className="text-sm font-semibold mb-2">Angles</div>
        <label className="text-xs block">
          Peek Open Angle: {openAngle}°
          <input
            type="range"
            min={-170}
            max={-5}
            step={1}
            value={openAngle}
            onChange={(e) => setOpenAngle(parseInt(e.target.value, 10))}
          />
        </label>

        <label className="text-xs block mt-2">
          Outside Tilt (flipped): {bookTilt}°
          <input
            type="range"
            min={140}
            max={180}
            step={1}
            value={bookTilt}
            onChange={(e) => setBookTilt(parseInt(e.target.value, 10))}
          />
        </label>
      </div>

      {/* Add elements */}
      {designMode && (
        <div className="p-3 rounded-lg border bg-white/60">
          <div className="text-sm font-semibold mb-2">Add Elements</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={addText}>
              + Text
            </button>
            <button className="px-3 py-1 rounded bg-rose-600 text-white" onClick={() => addEmoji("🎂")}>
              + Emoji
            </button>
            <label className="px-3 py-1 rounded bg-emerald-600 text-white cursor-pointer">
              + Sticker
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addStickerImage(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          <div className="text-[11px] mt-2 text-slate-600">
            Tip: Double-click a face to drop a text box at cursor.
          </div>
        </div>
      )}

      {/* Selected element panel */}
      {designMode && selected && (
        <div className="p-3 rounded-lg border bg-white/60 min-w-[260px]">
          <div className="text-sm font-semibold mb-2">Selected Element</div>

          <div className="flex gap-2 mb-2">
            <button className="px-2 py-1 rounded border" onClick={bringFwd}>Bring forward</button>
            <button className="px-2 py-1 rounded border" onClick={sendBack}>Send back</button>
          </div>

          <label className="block text-xs">
            Rotation: {Math.round(selected.rotation)}°
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={selected.rotation}
              onChange={(e) => updateSelected("rotation", parseInt(e.target.value, 10))}
            />
          </label>

          <label className="block text-xs">
            Scale: {selected.scale.toFixed(2)}x
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.05}
              value={selected.scale}
              onChange={(e) => updateSelected("scale", parseFloat(e.target.value))}
            />
          </label>

          <label className="block text-xs">
            Opacity: {selected.opacity.toFixed(2)}
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.opacity}
              onChange={(e) => updateSelected("opacity", parseFloat(e.target.value))}
            />
          </label>

          {selected.type === "text" && (
            <>
              <label className="block text-xs mt-2">
                Text
                <input
                  className="w-full px-2 py-1 rounded border"
                  value={selected.text}
                  onChange={(e) => updateSelectedText("text", e.target.value)}
                />
              </label>

              <label className="block text-xs">
                Font family
                <select
                  className="w-full px-2 py-1 rounded border"
                  value={selected.fontFamily}
                  onChange={(e) => updateSelectedText("fontFamily", e.target.value)}
                >
                  <option>Georgia, serif</option>
                  <option>Times New Roman, serif</option>
                  <option>Great Vibes, cursive</option>
                  <option>Inter, system-ui, sans-serif</option>
                  <option>Arial, sans-serif</option>
                </select>
              </label>

              <label className="block text-xs">
                Font size: {selected.fontSize}px
                <input
                  type="range"
                  min={12}
                  max={96}
                  step={1}
                  value={selected.fontSize}
                  onChange={(e) => updateSelectedText("fontSize", parseInt(e.target.value, 10))}
                />
              </label>

              <div className="text-xs mt-2">Color</div>
              <SketchPicker
                color={selected.color}
                onChangeComplete={(c) => updateSelectedText("color", c.hex)}
              />

              <div className="flex gap-2 mt-2">
                <button
                  className={`px-2 py-1 rounded border ${selected.fontWeight >= 600 ? "bg-black text-white" : ""}`}
                  onClick={() => updateSelectedText("fontWeight", selected.fontWeight >= 600 ? 400 : 700)}
                >
                  B
                </button>
                <button
                  className={`px-2 py-1 rounded border ${selected.fontStyle === "italic" ? "bg-black text-white" : ""}`}
                  onClick={() => updateSelectedText("fontStyle", selected.fontStyle === "italic" ? "normal" : "italic")}
                >
                  i
                </button>
                <select
                  className="px-2 py-1 rounded border"
                  value={selected.align}
                  onChange={(e) => updateSelectedText("align", e.target.value as TextEl["align"])}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
                <label className="inline-flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={selected.shadow}
                    onChange={(e) => updateSelectedText("shadow", e.target.checked)}
                  />
                  Shadow
                </label>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs">BG</label>
                <input
                  type="color"
                  value={selected.bg ?? "#ffffff"}
                  onChange={(e) => updateSelectedText("bg", e.target.value)}
                />
                <button
                  className="px-2 py-1 rounded border"
                  onClick={() => updateSelectedText("bg", null)}
                >
                  Clear
                </button>
              </div>

              <label className="block text-xs">
                Padding: {selected.pad ?? 0}px
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={selected.pad ?? 0}
                  onChange={(e) => updateSelectedText("pad", parseInt(e.target.value, 10))}
                />
              </label>
            </>
          )}

          {selected.type === "emoji" && (
            <>
              <label className="block text-xs mt-2">
                Emoji
                <input
                  className="w-full px-2 py-1 rounded border"
                  value={selected.emoji}
                  onChange={(e) =>
                    setLayers((prev) => {
                      const next = { ...prev };
                      next[activeFace] = next[activeFace].map((x) =>
                        x.id === selected.id ? ({ ...x, emoji: e.target.value } as DesignEl) : x
                      );
                      return next;
                    })
                  }
                />
              </label>
              <label className="block text-xs">
                Size: {selected.fontSize}px
                <input
                  type="range"
                  min={24}
                  max={160}
                  step={1}
                  value={selected.fontSize}
                  onChange={(e) =>
                    setLayers((prev) => {
                      const next = { ...prev };
                      next[activeFace] = next[activeFace].map((x) =>
                        x.id === selected.id ? ({ ...x, fontSize: parseInt(e.target.value, 10) } as DesignEl) : x
                      );
                      return next;
                    })
                  }
                />
              </label>
            </>
          )}

          {selected.type === "image" && (
            <label className="block text-xs mt-2">
              Width: {(selected as ImageEl).widthPct}%
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={(selected as ImageEl).widthPct}
                onChange={(e) =>
                  setLayers((prev) => {
                    const next = { ...prev };
                    next[activeFace] = next[activeFace].map((x) =>
                      x.id === selected.id
                        ? ({ ...x, widthPct: parseInt(e.target.value, 10) } as DesignEl)
                        : x
                    );
                    return next;
                  })
                }
              />
            </label>
          )}

          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 rounded border" onClick={duplicate}>Duplicate</button>
            <button className="px-3 py-1 rounded border text-red-600" onClick={deleteSel}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
const faceRef =
  (face: FaceKey): React.RefCallback<HTMLDivElement> =>
  (el) => {
    faceRefs.current[face] = el;
  };

  // Render a face’s interactive overlay
  const renderDesignCanvas = (face: FaceKey, label: string) => {
    const list = layers[face].slice().sort((a, b) => a.z - b.z);
    return (
      <div
        ref={faceRef(face)}
        className="design-canvas"
        onClick={(e) => {
          if (!designMode) return;
          e.stopPropagation();
          setActiveFace(face);
        }}
        onDoubleClick={(e) => onCanvasDblClick(face, e)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={`face-badge ${activeFace === face ? "active" : ""}`}>{label}</div>
        {list.map((el) => {
          const isSel = el.id === selectedId && face === activeFace;
          const commonStyle: React.CSSProperties = {
            left: `${el.xPct}%`,
            top: `${el.yPct}%`,
            transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
            opacity: el.opacity,
            zIndex: el.z,
          };

          if (el.type === "text") {
            const t = el as TextEl;
            return (
              <div
                key={el.id}
                className={`design-el ${isSel ? "selected" : ""}`}
                style={commonStyle}
                onPointerDown={(e) => startDragging(e, el.id, face)}
                onClick={(e) => {
                  if (designMode) {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    setActiveFace(face);
                  }
                }}
              >
                <div
                  className="text-box"
                  style={{
                    fontFamily: t.fontFamily,
                    fontSize: t.fontSize,
                    fontWeight: t.fontWeight,
                    fontStyle: t.fontStyle,
                    color: t.color,
                    textAlign: t.align as any,
                    textShadow: t.shadow ? "0 2px 6px rgba(0,0,0,0.3)" : "none",
                    background: t.bg ?? "transparent",
                    padding: (t.pad ?? 0) + "px",
                    borderRadius: 8,
                    whiteSpace: "pre-wrap",
                    maxWidth: "80%",
                  }}
                  contentEditable={designMode && isSel}
                  suppressContentEditableWarning
                  onBlur={(e) => updateSelectedText("text", e.currentTarget.innerText)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {t.text}
                </div>
              </div>
            );
          }

          if (el.type === "emoji") {
            const m = el as EmojiEl;
            return (
              <div
                key={el.id}
                className={`design-el ${isSel ? "selected" : ""}`}
                style={commonStyle}
                onPointerDown={(e) => startDragging(e, el.id, face)}
                onClick={(e) => {
                  if (designMode) {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    setActiveFace(face);
                  }
                }}
              >
                <div style={{ fontSize: m.fontSize, lineHeight: 1 }}>{m.emoji}</div>
              </div>
            );
          }

          const im = el as ImageEl;
          return (
            <div
              key={el.id}
              className={`design-el ${isSel ? "selected" : ""}`}
              style={commonStyle}
              onPointerDown={(e) => startDragging(e, el.id, face)}
              onClick={(e) => {
                if (designMode) {
                  e.stopPropagation();
                  setSelectedId(el.id);
                  setActiveFace(face);
                }
              }}
            >
              <img
                src={im.url}
                alt="sticker"
                style={{
                  width: `${im.widthPct}%`,
                  height: "auto",
                  display: "block",
                  borderRadius: 8,
                }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {toolbar}
      {propPanel}

      {/* Card Preview */}
      <div
        id="card-preview"
        ref={cardRef}
        className={`realistic-card-container ${designMode ? "designing" : ""}`}
        style={{ width, height }}
        onClick={containerClick}
        title="Click to peek open/close. In Design Mode, click a face to select; double-click to add text."
      >
        <div
          className={`realistic-card ${isOpen ? "open" : ""} ${isFlipped ? "flipped" : ""}`}
          style={
            {
              ["--open-angle" as any]: `${openAngle}deg`,
              ["--book-tilt" as any]: `${isFlipped ? bookTilt : 0}deg`,
            } as React.CSSProperties
          }
        >
          <div className="card-spine" />

          {/* LEFT PANEL (outside-back / inside-left) */}
          <div className="card-panel left" style={{ backgroundColor: bgColor }}>
            {/* OUTSIDE BACK */}
            <div className="card-face face-outside-back">
              <div className="face-content">
                {backImageURL && (
                  <img src={backImageURL} alt="Outside Back" style={{ opacity: backImageOpacity }} />
                )}
                <div className="face-text" style={{ fontFamily: backFont }}>{backText}</div>
                {renderDesignCanvas("back", "Outside Back")}
              </div>
              <div className="inner-falloff-left" />
            </div>

            {/* INSIDE LEFT */}
            <div className="card-face face-inside-left">
              <div className="face-content">
                {insideLeftImageURL && (
                  <img src={insideLeftImageURL} alt="Inside Left" style={{ opacity: insideLeftImageOpacity }} />
                )}
                <div className="face-text" style={{ fontFamily: insideFont }}>{insideLeftText}</div>
                {renderDesignCanvas("inLeft", "Inside Left")}
              </div>
              <div className="inner-falloff-left" />
            </div>
          </div>

          {/* RIGHT PANEL (outside-front / inside-right) */}
          <div className="card-panel right" style={{ backgroundColor: bgColor }}>
            {/* OUTSIDE FRONT */}
            <div className="card-face face-outside-front">
              <div className="face-content">
                {frontImageURL && (
                  <img src={frontImageURL} alt="Outside Front" style={{ opacity: frontImageOpacity }} />
                )}
                <div className="face-text" style={{ fontFamily: frontFont, fontSize: 24 }}>
                  {frontText}
                </div>
                {renderDesignCanvas("front", "Outside Front")}
              </div>
              <div className="inner-falloff-right" />
            </div>

            {/* INSIDE RIGHT */}
            <div className="card-face face-inside-right">
              <div className="face-content">
                {insideRightImageURL && (
                  <img src={insideRightImageURL} alt="Inside Right" style={{ opacity: insideRightImageOpacity }} />
                )}
                <div className="face-text" style={{ fontFamily: insideFont }}>{insideRightText}</div>
                {renderDesignCanvas("inRight", "Inside Right")}
              </div>
              <div className="inner-falloff-right" />
            </div>
          </div>
        </div>
      </div>

      {toolbar}
    </div>
  );
}
