// import React, { useCallback, useMemo, useRef, useState } from "react";

// export default function SvgEditor() {
//   const [rawSvg, setRawSvg] = useState<string | null>(null);
//   const [stroke, setStroke] = useState<string | null>(null);
//   const [fill, setFill] = useState<string | null>(null);
//   const [bg, setBg] = useState<string>("#ffffff");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const recolorSvg = useCallback(
//     (svg: string, s: string | null, f: string | null, b: string) => {
//       const parser = new DOMParser();
//       const doc = parser.parseFromString(svg, "image/svg+xml");
//       const root = doc.documentElement;

//       const applyStyle = (
//         el: Element,
//         prop: "stroke" | "fill",
//         color: string
//       ) => {
//         el.setAttribute(prop, color);
//         (el as HTMLElement).style.setProperty(prop, color, "important");
//       };

//       root.querySelectorAll("*").forEach((el) => {
//         if (s) applyStyle(el, "stroke", s);
//         if (f) applyStyle(el, "fill", f);
//       });

//       let bgRect = root.querySelector("rect[data-bg]") as SVGRectElement | null;
//       if (!bgRect) {
//         bgRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
//         bgRect.setAttribute("data-bg", "true");
//         root.insertBefore(bgRect, root.firstChild);
//       }
//       bgRect.setAttribute("x", "0");
//       bgRect.setAttribute("y", "0");
//       bgRect.setAttribute("width", "100%");
//       bgRect.setAttribute("height", "100%");
//       bgRect.setAttribute("fill", b);

//       root.setAttribute("style", "max-width:100%;height:auto");

//       return root.outerHTML;
//     },
//     []
//   );

//   const processedSvg = useMemo(
//     () => (rawSvg ? recolorSvg(rawSvg, stroke, fill, bg) : null),
//     [rawSvg, stroke, fill, bg, recolorSvg]
//   );

//   const previewSrc = useMemo(
//     () =>
//       processedSvg
//         ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(processedSvg)}`
//         : null,
//     [processedSvg]
//   );

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file || file.type !== "image/svg+xml") {
//       alert("Please upload a valid SVG file.");
//       return;
//     }
//     const svgText = await file.text();
//     setRawSvg(svgText);
//   };

//   const triggerUpload = () => fileInputRef.current?.click();

//   const downloadSvg = () => {
//     if (!processedSvg) return;
//     const blob = new Blob([processedSvg], { type: "image/svg+xml" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "edited.svg";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <section className="mx-auto max-w-5xl p-6 font-sans">
//       <div className="rounded-2xl bg-white p-8 shadow-xl">
//         {!rawSvg ? (
//           <UploadPrompt
//             triggerUpload={triggerUpload}
//             handleFileChange={handleFileChange}
//             fileInputRef={fileInputRef}
//           />
//         ) : (
//           <EditorUI
//             stroke={stroke}
//             setStroke={setStroke}
//             fill={fill}
//             setFill={setFill}
//             bg={bg}
//             setBg={setBg}
//             previewSrc={previewSrc}
//             downloadSvg={downloadSvg}
//           />
//         )}
//       </div>
//     </section>
//   );
// }

// function UploadPrompt({ triggerUpload, handleFileChange, fileInputRef }: any) {
//   return (
//     <div className="flex flex-col items-center gap-5 text-center">
//       <button
//         onClick={triggerUpload}
//         className="rounded-lg border border-indigo-500 bg-indigo-50 px-8 py-2 text-indigo-700 transition hover:bg-indigo-500 hover:text-white"
//       >
//         Select SVG File
//       </button>
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept=".svg"
//         onChange={handleFileChange}
//         className="hidden"
//       />
//     </div>
//   );
// }

// function EditorUI({
//   stroke,
//   setStroke,
//   fill,
//   setFill,
//   bg,
//   setBg,
//   previewSrc,
//   downloadSvg,
// }: any) {
//   return (
//     <div className="grid gap-8 md:grid-cols-2">
//       <div className="space-y-6">
//         <ColorPicker label="Stroke" value={stroke} onChange={setStroke} />
//         <ColorPicker label="Fill" value={fill} onChange={setFill} />
//         <ColorPicker label="Background" value={bg} onChange={setBg} />
//         <button
//           onClick={downloadSvg}
//           className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"
//         >
//           Download SVG
//         </button>
//       </div>
//       <div className="flex h-[32rem] items-center justify-center overflow-auto rounded-xl border bg-gray-50">
//         {previewSrc ? (
//           <img
//             key={previewSrc}
//             src={previewSrc}
//             alt="SVG preview"
//             className="max-h-full max-w-full"
//           />
//         ) : (
//           <p className="text-gray-400">Preview unavailable</p>
//         )}
//       </div>
//     </div>
//   );
// }

// function ColorPicker({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: string | null;
//   onChange: (v: string) => void;
// }) {
//   return (
//     <div>
//       <label className="mb-2 block text-sm font-medium text-gray-600">
//         {label} Color
//       </label>
//       <input
//         type="color"
//         value={value || "#ffffff"}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full h-12 cursor-pointer rounded-lg border"
//       />
//     </div>
//   );
// }

// import { useEffect } from "react";

// interface SvgEditorProps {
//   useCanvas?: boolean; // optional flag to render via <canvas>

//   svgUrl?: string; // You can also extract from URL query param
// }

// export function SvgUrlEditor({ svgUrl, useCanvas }: SvgEditorProps) {
//   const [rawSvg, setRawSvg] = useState<string | null>(null);
//   const [stroke, setStroke] = useState<string | null>(null);
//   const [fill, setFill] = useState<string | null>(null);
//   const [bg, setBg] = useState<string>("#ffffff");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // 🔁 Load SVG from URL if provided
//   useEffect(() => {
//     if (!svgUrl) return;

//     const fetchSvg = async () => {
//       try {
//         const res = await fetch(svgUrl);
//         if (!res.ok) throw new Error("Failed to fetch SVG");
//         const text = await res.text();
//         setRawSvg(text);
//       } catch (err) {
//         alert("Error loading SVG from URL");
//         console.error(err);
//       }
//     };

//     fetchSvg();
//   }, [svgUrl]);

//   // 🧼 Add watermark and obfuscate IDs
//   const protectedSvg = useMemo(() => {
//     if (!rawSvg) return null;

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(rawSvg, "image/svg+xml");
//     const svg = doc.documentElement;

//     // Obfuscate IDs and classes
//     svg.querySelectorAll("[id], [class]").forEach((el) => {
//       el.removeAttribute("id");
//       el.removeAttribute("class");
//     });

//     // Add watermark <text>
//     const ns = "http://www.w3.org/2000/svg";
//     const watermark = doc.createElementNS(ns, "text");
//     watermark.textContent = "© ZileDigital";
//     watermark.setAttribute("x", "50%");
//     watermark.setAttribute("y", "97%");
//     watermark.setAttribute("text-anchor", "middle");
//     watermark.setAttribute("fill", "rgba(0, 0, 0, 0.05)");
//     watermark.setAttribute("font-size", "36");
//     watermark.setAttribute("font-family", "sans-serif");
//     watermark.setAttribute("pointer-events", "none");

//     svg.appendChild(watermark);

//     // Lock pointer interactions
//     svg.setAttribute(
//       "style",
//       "width: 100%; height: auto; pointer-events: none;"
//     );

//     return svg.outerHTML;
//   }, [rawSvg]);

//   // // 🖼 Canvas fallback rendering (if enabled)
//   // if (useCanvas && rawSvg) {
//   //   return <SvgCanvasRenderer svgString={protectedSvg || rawSvg} />;
//   // }

//   // if (!protectedSvg) {
//   //   return <p className="text-center text-gray-400">Loading preview…</p>;
//   // }

//   //   return (
//   //     <div
//   //       className="select-none svg-preview"
//   //       onContextMenu={(e) => e.preventDefault()}
//   //       style={{
//   //         pointerEvents: "none",
//   //         userSelect: "none",
//   //         WebkitUserDrag: "none",
//   //         touchAction: "none",
//   //       }}
//   //       dangerouslySetInnerHTML={{ __html: protectedSvg }}
//   //     />
//   //   );
//   // }

//   // Optional Canvas fallback
//   function SvgCanvasRenderer({ svgString }: { svgString: string }) {
//     const canvasRef = React.useRef<HTMLCanvasElement>(null);

//     useEffect(() => {
//       if (!svgString || !canvasRef.current) return;

//       const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
//       const url = URL.createObjectURL(svgBlob);
//       const img = new Image();

//       img.onload = () => {
//         const canvas = canvasRef.current!;
//         canvas.width = img.width;
//         canvas.height = img.height;
//         const ctx = canvas.getContext("2d")!;
//         ctx.drawImage(img, 0, 0);
//         URL.revokeObjectURL(url);
//       };

//       img.src = url;

//       return () => {
//         URL.revokeObjectURL(url);
//       };
//     }, [svgString]);}

//     // 🔁 Color-transform logic...
//     const recolorSvg = useCallback(
//       (svg: string, s: string | null, f: string | null, b: string) => {
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(svg, "image/svg+xml");
//         const root = doc.documentElement;

//         const applyStyle = (
//           el: Element,
//           prop: "stroke" | "fill",
//           color: string
//         ) => {
//           el.setAttribute(prop, color);
//           (el as HTMLElement).style.setProperty(prop, color, "important");
//         };

//         root.querySelectorAll("*").forEach((el) => {
//           if (s) applyStyle(el, "stroke", s);
//           if (f) applyStyle(el, "fill", f);
//         });

//         let bgRect = root.querySelector(
//           "rect[data-bg]"
//         ) as SVGRectElement | null;
//         if (!bgRect) {
//           bgRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
//           bgRect.setAttribute("data-bg", "true");
//           root.insertBefore(bgRect, root.firstChild);
//         }
//         bgRect.setAttribute("x", "0");
//         bgRect.setAttribute("y", "0");
//         bgRect.setAttribute("width", "100%");
//         bgRect.setAttribute("height", "100%");
//         bgRect.setAttribute("fill", b);

//     const ns = "http://www.w3.org/2000/svg";

//          const watermark = doc.createElementNS(ns, "text");
//     watermark.textContent = "© ZileDigital";
//     watermark.setAttribute("x", "50%");
//     watermark.setAttribute("y", "97%");
//     watermark.setAttribute("text-anchor", "middle");
//     watermark.setAttribute("fill", "rgba(0, 0, 0, 0.05)");
//     watermark.setAttribute("font-size", "36");
//     watermark.setAttribute("font-family", "sans-serif");
//     watermark.setAttribute("pointer-events", "none");

//     root.appendChild(watermark);
//         root.setAttribute("style", "max-width:100%;height:auto");

//         return root.outerHTML;
//       },
//       []
//     );

//     const processedSvg = useMemo(
//       () => (rawSvg ? recolorSvg(rawSvg, stroke, fill, bg) : null),
//       [rawSvg, stroke, fill, bg, recolorSvg]
//     );

//     const previewSrc = useMemo(
//       () =>
//         processedSvg
//           ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
//               processedSvg
//             )}`
//           : null,
//       [processedSvg]
//     );

//     const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//       const file = e.target.files?.[0];
//       if (!file || file.type !== "image/svg+xml") {
//         alert("Please upload a valid SVG file.");
//         return;
//       }
//       const svgText = await file.text();
//       setRawSvg(svgText);
//     };

//     const triggerUpload = () => fileInputRef.current?.click();

//     const downloadSvg = () => {
//       if (!processedSvg) return;
//       const blob = new Blob([processedSvg], { type: "image/svg+xml" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "edited.svg";
//       a.click();
//       URL.revokeObjectURL(url);
//     };
//     // return SvgCanvasRenderer(svgUrl)

//     return (
//       <section className="mx-auto max-w-5xl p-6 font-sans">
//         <div className="rounded-2xl bg-white p-8 shadow-xl" >
      
//           {!rawSvg ? (
//             <UploadPrompt
//               triggerUpload={triggerUpload}
//               handleFileChange={handleFileChange}
//               fileInputRef={fileInputRef}
//             />
//           ) : (
//             <EditorUI
//               stroke={stroke}
//               setStroke={setStroke}
//               fill={fill}
//               setFill={setFill}
//               bg={bg}
//               setBg={setBg}
//               previewSrc={previewSrc}
//               downloadSvg={downloadSvg}
//             />
//           )}
//         </div>
//       </section>
//     );
//   }
// File: components/EditableCanvas.tsx
// File: components/EditableCanvas.tsx




// File: components/EditableCanvas.tsx
// File: components/EditableCanvas.tsx
// File: components/EditableCanvas.tsx
// File: components/EditableCanvas.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

interface StyleState {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
}

export default function EditableCanvas({ productId }: { productId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("placeholder.png");
  const [style, setStyle] = useState<StyleState>({
    fillColor: "#FFD700",
    strokeColor: "#000000",
    strokeWidth: 2,
    backgroundColor: "#ffffff",
  });
  const [loading, setLoading] = useState<boolean>(true);
const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch initial PNG preview
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/live-preview`);
        if (!res.ok) throw new Error("Failed to load preview");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  // Draw PNG on canvas when previewUrl changes
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = previewUrl;
  }, [previewUrl]);

  // Debounced style update
  const handleChange = <K extends keyof StyleState>(field: K, value: StyleState[K]) => {
    const updated = { ...style, [field]: value };
    setStyle(updated);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/live-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error("Failed to update preview");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-4 w-[40vw] flex items-center justify-center flex-col ">
      <div className="relative">
        <canvas ref={canvasRef} className="border shadow-md max-w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        <label>
          Fill:
          <input type="color" value={style.fillColor} onChange={e => handleChange('fillColor', e.target.value)} />
        </label>
        <label>
          Stroke:
          <input type="color" value={style.strokeColor} onChange={e => handleChange('strokeColor', e.target.value)} />
        </label>
        <label>
          BG:
          <input type="color" value={style.backgroundColor} onChange={e => handleChange('backgroundColor', e.target.value)} />
        </label>
        <label className="flex items-center">
          Width:
          <input type="range" min={1} max={10} value={style.strokeWidth} onChange={e => handleChange('strokeWidth', parseInt(e.target.value, 10))} />
        </label>
      </div>
    </div>
  );
}