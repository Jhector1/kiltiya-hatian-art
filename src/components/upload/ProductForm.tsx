"use client";

import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import categories from "@/data/categories";

// Accepts: 10x12, 10 x 12, 10" x 12", 10 in x 12 in, 10.5×12.25
const SIZE_PATTERN = String.raw`^\s*\d+(\.\d+)?\s*(?:"|in(?:ches)?)?\s*[x×]\s*\d+(\.\d+)?\s*(?:"|in(?:ches)?)?\s*$`;
const SIZE_RE = new RegExp(SIZE_PATTERN, "i");

function formatSizeLive(input: string): string {
  // "credit-card style" gentle formatting while typing (1 'x' max, allow ×)
  let v = input.replace(/[×]/g, "x");
  // Keep only digits, dot, x, quotes, letters of "in"/"inches", and spaces
  v = v.replace(/[^0-9.x"inches\s]/gi, "");

  // Enforce a single 'x'
  const firstX = v.indexOf("x");
  if (firstX !== -1) {
    const before = v.slice(0, firstX).replace(/x/gi, "");
    const after = v.slice(firstX + 1).replace(/x/gi, "");
    v = `${before}x${after}`;
  }

  // Collapse spaces
  v = v.replace(/\s+/g, " ");

  // If user typed two numbers separated by any space, gently insert ` x `
  if (!/x/i.test(v)) {
    const m = v.match(/^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (m) v = `${m[1]} x ${m[2]}`;
  }

  return v;
}

function normalizeSizeOnBlur(input: string): string {
  const raw = input.replace(/[×]/g, "x").replace(/\s+/g, " ").trim();
  const m = raw.match(
    /^\s*(\d+(?:\.\d+)?)(?:\s*(?:"|in(?:ches)?))?\s*[x]\s*(\d+(?:\.\d+)?)(?:\s*(?:"|in(?:ches)?))?\s*$/i
  );
  if (!m) return raw; // don't force if not valid; the border/message will show why
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  // Canonical output: 10" x 12"
  return `${w}" x ${h}"`;
}

// ---------- helpers for appending / removing files ----------
const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

function appendFiles(
  files: FileList | null,
  setter: Dispatch<SetStateAction<File[]>>
) {
  if (!files) return;
  const incoming = Array.from(files);
  setter((prev) => {
    const next = [...prev];
    for (const f of incoming) if (!prev.some((p) => sameFile(p, f))) next.push(f);
    return next;
  });
}

export default function ProductForm() {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [main, setMain] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<File[]>([]);
  const [formats, setFormats] = useState<File[]>([]);
  const [svgFile, setSvgFile] = useState<File | null>(null);

  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [thumbPreviews, setThumbPreviews] = useState<string[]>([]);
  const [formatPreviews, setFormatPreviews] = useState<{ url: string; type: string }[]>(
    []
  );
  const [svgPreviewUrl, setSvgPreviewUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  // sizes
  const [sizes, setSizes] = useState<string[]>([]);
  const CATEGORY_OPTIONS = useMemo(() => categories, []);

  const addSizeField = () => setSizes((s) => [...s, ""]);
  const updateSize = (idx: number, val: string) => {
    setSizes((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };
  const removeSizeField = (idx: number) =>
    setSizes((prev) => prev.filter((_, i) => i !== idx));

  // remove handlers
  const removeThumbnail = (idx: number) =>
    setThumbnails((prev) => prev.filter((_, i) => i !== idx));
  const removeFormat = (idx: number) =>
    setFormats((prev) => prev.filter((_, i) => i !== idx));

  // ---------- preview URL effects with cleanup ----------
  useEffect(() => {
    if (!main) {
      setMainPreview(null);
      return;
    }
    const url = URL.createObjectURL(main);
    setMainPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [main]);

  useEffect(() => {
    const urls = thumbnails.map((f) => URL.createObjectURL(f));
    setThumbPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [thumbnails]);

  useEffect(() => {
    const previews = formats.map((f) => ({ url: URL.createObjectURL(f), type: f.type }));
    setFormatPreviews(previews);
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [formats]);

  useEffect(() => {
    if (!svgFile) {
      setSvgPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(svgFile);
    setSvgPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svgFile]);

  // ---------- submit ----------
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!main) {
      alert("Please select a main image");
      return;
    }

    // Validate sizes before uploading
    const firstBad = sizes.findIndex(
      (s) => s.trim() !== "" && !SIZE_RE.test(s.trim())
    );
    if (firstBad !== -1) {
      const badVal = sizes[firstBad];
      alert(
        `Invalid size at row ${firstBad + 1}: "${badVal}".\nUse a format like 10" x 12".`
      );
      return;
    }

    setUploading(true);

    const data = new FormData();
    data.append("category", category);
    data.append("title", title);
    data.append("description", description);
    data.append("price", price);
    data.append("main", main);

    sizes.forEach((sz) => data.append("sizes", sz));
    thumbnails.forEach((f) => data.append("thumbnails", f));
    formats.forEach((f) => data.append("formats", f));
    if (svgFile) data.append("svg", svgFile);

    const res = await fetch("/api/products/upload", { method: "POST", body: data });
    setUploading(false);

    if (res.ok) {
      alert("Product uploaded!");
      setCategory("");
      setTitle("");
      setDescription("");
      setPrice("");
      setMain(null);
      setThumbnails([]);
      setFormats([]);
      setSizes([]);
      setSvgFile(null);
      setSvgPreviewUrl(null);
    } else {
      const err = await res.text().catch(() => "");
      alert("Upload failed");
      console.error(err);
    }
  }

  return (
    <motion.form
      noValidate   // ← add this

      onSubmit={submit}
      encType="multipart/form-data"
      className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-2xl space-y-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Category & Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            required
            disabled={uploading}
          >
            <option value="" disabled>
              Select category
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.title} value={opt.title}>
                {opt.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            placeholder="Enter title"
            required
            disabled={uploading}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="mb-2 font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-24 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition resize-none"
            placeholder="Product description..."
            required
            disabled={uploading}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            placeholder="0.00"
            required
            disabled={uploading}
          />
        </div>
      </div>

      {/* Available Sizes */}
      <div className="flex flex-col space-y-2">
        <label className="font-medium text-gray-700">Available Sizes</label>

        {sizes.map((size, idx) => {
          const valid = size.trim() === "" ? true : SIZE_RE.test(size.trim());
          return (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={size}
                  onChange={(e) => updateSize(idx, formatSizeLive(e.target.value))}
                  onBlur={(e) => updateSize(idx, normalizeSizeOnBlur(e.target.value))}
                  placeholder={`e.g. 10" x 12"`}
                  pattern={SIZE_PATTERN}
                  title={`Enter size like 10" x 12", 10x12, 10 in x 12 in, 10.5×12.25`}
                  className={[
                    "w-full px-4 py-2 border rounded-xl transition",
                    valid
                      ? "border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      : "border-red-400 focus:ring-2 focus:ring-red-400",
                  ].join(" ")}
                  disabled={uploading}
                />
                <div className="mt-1 text-xs">
                  {valid ? (
                    <span className="text-gray-500">
                      Formats accepted: <code>10&quot; x 12&quot;</code>,{" "}
                      <code>10x12</code>, <code>10 in x 12 in</code>,{" "}
                      <code>10.5×12.25</code>
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Invalid format. Try <code>10&quot; x 12&quot;</code>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeSizeField(idx)}
                className="h-10 px-3 py-1 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addSizeField}
          className="self-start px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
          disabled={uploading}
        >
          + Add Size
        </button>
      </div>

      {/* Main Image Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Main Image</label>
          <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
            {main ? "Change Main Image" : "Select Main Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setMain(e.target.files?.[0] || null);
                (e.currentTarget as HTMLInputElement).value = "";
              }}
              required
              disabled={uploading}
            />
          </label>
        </div>

        {mainPreview && (
          <div className="relative h-40 w-40 rounded-xl overflow-hidden shadow-lg group">
            <img
              src={mainPreview}
              alt="Main Preview"
              className="object-cover h-full w-full"
            />
            <button
              type="button"
              onClick={() => setMain(null)}
              className="absolute top-2 right-2 h-7 px-2 rounded bg-white/90 text-red-600 text-sm font-semibold shadow opacity-0 group-hover:opacity-100 transition"
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails (append; one-by-one or bulk) */}
      <div>
        <label className="mb-2 block font-medium text-gray-700">Thumbnails</label>
        <label className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
          {thumbnails.length ? "Add More Thumbnails" : "Select Thumbnails"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              appendFiles(e.target.files, setThumbnails);
              (e.currentTarget as HTMLInputElement).value = ""; // allow same file again
            }}
            disabled={uploading}
          />
        </label>

        {thumbPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
            {thumbPreviews.map((src, idx) => (
              <div
                key={idx}
                className="relative h-24 w-24 rounded-lg overflow-hidden shadow-md hover:scale-105 transform transition group"
              >
                <img
                  src={src}
                  alt={`Thumb ${idx + 1}`}
                  className="object-cover h-full w-full"
                />
                <button
                  type="button"
                  aria-label={`Remove thumbnail ${idx + 1}`}
                  onClick={() => removeThumbnail(idx)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 text-red-600 text-sm leading-6 font-bold shadow opacity-0 group-hover:opacity-100 transition"
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SVG Upload (single) */}
      <div>
        <label className="mb-2 block font-medium text-gray-700">
          SVG File
          <span className="block text-sm text-gray-500">
            Upload one SVG file. A preview with watermark will be generated automatically.
          </span>
        </label>
        <label className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
          {svgFile ? "Change SVG File" : "Select SVG File"}
          <input
            type="file"
            accept="image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSvgFile(file);
              (e.currentTarget as HTMLInputElement).value = "";
            }}
            disabled={uploading}
          />
        </label>

        {svgPreviewUrl && (
          <div className="relative mt-4 h-40 w-40 rounded-xl overflow-hidden shadow-lg group">
            <img
              src={svgPreviewUrl}
              alt="SVG Preview"
              className="object-contain h-full w-full"
            />
            <button
              type="button"
              onClick={() => {
                setSvgFile(null);
                setSvgPreviewUrl(null);
              }}
              className="absolute top-2 right-2 h-7 px-2 rounded bg-white/90 text-red-600 text-sm font-semibold shadow opacity-0 group-hover:opacity-100 transition"
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Other Formats (append; one-by-one or bulk) */}
      <div>
        <label className="mb-2 block font-medium text-gray-700">
          Other Formats (PDF, SVG, Images)
        </label>
        <label className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
          {formats.length ? "Add More Formats" : "Select Other Formats"}
          <input
            type="file"
            accept=".pdf,.svg,image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              appendFiles(e.target.files, setFormats);
              (e.currentTarget as HTMLInputElement).value = "";
            }}
            disabled={uploading}
          />
        </label>

        {formatPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {formatPreviews.map(({ url, type }, idx) => (
              <div
                key={idx}
                className="relative h-20 w-20 rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-gray-50 p-2 group"
              >
                {type.startsWith("image/") ? (
                  <img
                    src={url}
                    alt={`Format ${idx + 1}`}
                    className="object-contain h-full w-full"
                  />
                ) : type === "application/pdf" ? (
                  <iframe src={url} title={`PDF ${idx + 1}`} className="h-full w-full" />
                ) : (
                  <span className="text-xs text-gray-600 text-center break-words">
                    {type || "Unsupported"}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove file ${idx + 1}`}
                  onClick={() => removeFormat(idx)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 text-red-600 text-sm leading-6 font-bold shadow opacity-0 group-hover:opacity-100 transition"
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-lg font-semibold rounded-2xl shadow-xl hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Create Product"}
      </motion.button>
    </motion.form>
  );
}
