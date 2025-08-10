"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { AnimatePresence,motion } from "framer-motion";
import SaveOrderCta from "@/components/orders/SaveOrderCta";

/* ------------ Types from /api/checkout/success ------------- */
interface PurchasedArtwork {
  id: string;
  title: string;
  format: string; // "png" | "jpg" | "svg" | "pdf" | ...
  downloadUrl: string; // short-lived signed URL
  previewUrl?: string; // optional preview (thumb/watermarked)
  width?: number; // px (for raster)
  height?: number; // px (for raster)
  dpi?: number; // typical 300 for print-ready rasters
  colorProfile?: string; // "sRGB" | "Adobe RGB" | etc.
  sizeBytes?: number; // file size in bytes
  license?: string; // "Personal" | "Commercial" | etc.
  isVector?: boolean; // true for SVG/PDF vector content
  checksum?: string; // sha256:... (optional)
  expiresAt?: string; // ISO date string for guest links
  remainingUses?: number | null; // optional rate-limit counter
}

/* ----------- Helper utils (no deps, a11y friendly) ---------- */
function toTitle(s?: string) {
  return (s || "").toUpperCase();
}

function humanBytes(b?: number) {
  if (!b || b <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0,
    n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspect(width?: number, height?: number) {
  if (!width || !height) return "—";
  const g = gcd(width, height);
  return `${Math.round(width / g)}:${Math.round(height / g)}`;
}

function pxToInches(px?: number, dpi = 300) {
  if (!px || !dpi) return 0;
  return +(px / dpi).toFixed(2);
}

function maxPrintAt300(width?: number, height?: number, dpi = 300) {
  if (!width || !height) return "—";
  const wIn = pxToInches(width, dpi);
  const hIn = pxToInches(height, dpi);
  if (!wIn || !hIn) return "—";
  return `${wIn}" × ${hIn}" @ ${dpi} DPI`;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (String(d) === "Invalid Date") return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isExpiringSoon(iso?: string) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t - Date.now() < 72 * 3600 * 1000; // < 72h
}

function safeFilename(title: string, ext: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "artwork"}.${ext.toLowerCase()}`;
}

/* --------------------- Component ---------------------------- */
export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  const [artworks, setArtworks] = useState<PurchasedArtwork[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);

  /** Which button is currently downloading:
   *  • an artwork's id  → single-item button busy
   *  • "zip"            → ZIP button busy
   *  • null             → idle
   */
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // optional: track expanded details
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((m) => ({ ...m, [id]: !m[id] }));

  const anyVector = useMemo(
    () => artworks.some((a) => a.isVector || /^(svg|pdf)$/i.test(a.format)),
    [artworks]
  );

  // helper to download any URL as a file
  const downloadFile = async (
    url: string,
    filename: string,
    buttonId: string
  ) => {
    try {
      setDownloadingId(buttonId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      // OPTIONAL fire-and-forget (analytics/audit)
      fetch("/api/downloads", { method: "POST", credentials: "include" }).catch(
        () => {}
      );
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  /* Fetch purchased artworks once we have a session_id */
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/success?session_id=${sessionId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.status === 401) {
          setNotAuthorized(true);
          setArtworks([]);
          return;
        }
        if (!res.ok)
          throw new Error(data.error || "Could not fetch downloads.");
        setNotAuthorized(false);
        setArtworks(data.digitalDownloads || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        console.error(msg);
        toast.error(msg);
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [sessionId]);

  if (loadingPage) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
          <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-40 w-full bg-gray-200 rounded-2xl"></div>
          <div className="h-24 w-full bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          We couldn’t verify this purchase
        </h1>
        <p className="mt-2 text-gray-600">
          Make sure you’re signed in with the account used at checkout, or open
          the download link from your receipt email.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-green-700">
          Your downloads are ready
        </h1>
        <p className="text-gray-600 mt-2">
          Save your files below. Guests get time-limited links—create an account
          to keep access forever.
        </p>
        {/* Kreyòl helper line */}
        <p className="text-gray-500 text-sm mt-1">
          <span className="font-medium">Kreyòl:</span> Lyen yo ekspire pou
          envite. Kreye yon kont pou w kenbe yo pou tout tan.
        </p>
              {sessionId && <SaveOrderCta sessionId={sessionId} />}

      </header>

      {/* Summary card */}
      <section className="rounded-2xl border bg-white/60 backdrop-blur p-5 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            label={`${artworks.length} file${artworks.length === 1 ? "" : "s"}`}
          />
          {anyVector && <Badge label="Includes vector formats" tone="indigo" />}
          <Badge label="Watermarks removed in downloads" tone="emerald" />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Tip: Keep the original downloads safe. You can re-download from your{" "}
          <span className="font-medium">Order Library</span> if you created an
          account.
        </p>
      </section>

      {artworks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="space-y-6">
            {artworks.map((art, i) => {
              const busy = downloadingId === art.id;
              const isPdf = /pdf/i.test(art.format);
              const isSvg = /svg/i.test(art.format);
              const isRaster = !isPdf && !isSvg;

              const labelFmt = toTitle(art.format);
              const ratio = aspect(art.width, art.height);
              const size = humanBytes(art.sizeBytes);
              const dpi = art.dpi || (isRaster ? 300 : undefined);
              const maxPrint =
                art.isVector || isPdf || isSvg
                  ? "Unlimited scale (vector)"
                  : maxPrintAt300(art.width, art.height, dpi || 300);

              const isExpired = art.expiresAt
                ? new Date(art.expiresAt).getTime() < Date.now()
                : false;
              const noRemaining =
                typeof art.remainingUses === "number" && art.remainingUses <= 0;

              const expiresBadge = art.expiresAt ? (
                <span
                  className={`ml-2 inline-flex items-center gap-1 text-xs px-2 py-[2px] rounded-full border
                  ${
                    isExpired || isExpiringSoon(art.expiresAt)
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
                >
                  {isExpired
                    ? "Expired"
                    : isExpiringSoon(art.expiresAt)
                    ? "Expires soon"
                    : "Expires"}
                  <span className="font-medium">{fmtDate(art.expiresAt)}</span>
                </span>
              ) : null;

              return (
                <li
                  key={`${art.id}-${i}`}
                  className="flex gap-4 items-stretch border rounded-2xl p-4 shadow-sm bg-white/70"
                >
                  {/* Preview: never use the downloadUrl to avoid burning a 'use' */}
                  <div className="w-28 shrink-0">
                    {art.previewUrl ? (
                      <img
                        src={art.previewUrl}
                        alt={art.title}
                        className="w-28 h-28 object-cover rounded-xl border"
                      />
                    ) : isPdf ? (
                      <div className="w-28 h-28 rounded-xl border grid place-items-center text-xs text-gray-500">
                        PDF
                      </div>
                    ) : isSvg ? (
                      <div className="w-28 h-28 rounded-xl border grid place-items-center text-xs text-gray-500">
                        SVG
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-xl border grid place-items-center text-xs text-gray-500">
                        No preview
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg truncate">
                        {art.title}
                      </p>
                      <span className="text-xs px-2 py-[2px] rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        {labelFmt}
                      </span>
                      {expiresBadge}
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      <p className="flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          {isRaster
                            ? `${art.width || "—"}×${art.height || "—"} px`
                            : "Vector (resolution-independent)"}
                        </span>
                        <Dot />
                        <span>{size}</span>
                        {isRaster && (
                          <>
                            <Dot />
                            <span>{dpi ? `${dpi} DPI` : "DPI —"}</span>
                            <Dot />
                            <span>Aspect {ratio}</span>
                          </>
                        )}
                        {art.colorProfile && (
                          <>
                            <Dot />
                            <span>{art.colorProfile}</span>
                          </>
                        )}
                        {art.license && (
                          <>
                            <Dot />
                            <span>License: {art.license}</span>
                          </>
                        )}
                        {typeof art.remainingUses === "number" && (
                          <>
                            <Dot />
                            <span>{art.remainingUses} downloads left</span>
                          </>
                        )}
                      </p>

                      {/* Max print guidance */}
                      <p className="mt-1 text-xs text-gray-500">
                        Max recommended print size:{" "}
                        <span className="font-medium">{maxPrint}</span>
                      </p>
                    </div>

                    {/* Details toggle */}
                    <button
                      onClick={() => toggle(art.id)}
                      className="mt-3 text-xs text-gray-600 hover:text-gray-900 underline underline-offset-4"
                    >
                      {expanded[art.id] ? "Hide details" : "Show details"}
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded[art.id] && (
                        <motion.div
                          key="print-settings"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 1.0, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="mt-3 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700 space-y-2">
                            <DetailRow
                              k="File name"
                              v={safeFilename(art.title, art.format)}
                            />
                            <DetailRow k="Format" v={labelFmt} />
                            <DetailRow
                              k="Resolution"
                              v={
                                isRaster
                                  ? `${art.width || "—"} × ${
                                      art.height || "—"
                                    } px`
                                  : "Vector"
                              }
                            />
                            {isRaster && (
                              <DetailRow k="DPI" v={dpi ? `${dpi}` : "—"} />
                            )}
                            <DetailRow
                              k="Color profile"
                              v={art.colorProfile || "—"}
                            />
                            <DetailRow k="File size" v={size} />
                            <DetailRow
                              k="Aspect ratio"
                              v={isRaster ? aspect(art.width, art.height) : "—"}
                            />
                            <DetailRow k="Checksum" v={art.checksum || "—"} />
                            <DetailRow k="License" v={art.license || "—"} />
                            <DetailRow
                              k="Link expires"
                              v={fmtDate(art.expiresAt)}
                            />
                            {isRaster && (
                              <DetailRow
                                k="Max print (300DPI)"
                                v={maxPrintAt300(
                                  art.width,
                                  art.height,
                                  dpi || 300
                                )}
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      disabled={busy || isExpired || noRemaining}
                      onClick={() =>
                        downloadFile(
                          art.downloadUrl,
                          safeFilename(art.title, art.format),
                          art.id
                        )
                      }
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition
                        ${
                          busy || isExpired || noRemaining
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                      {isExpired ? (
                        "Link expired"
                      ) : noRemaining ? (
                        "No downloads left"
                      ) : busy ? (
                        <>
                          <Spinner /> Downloading…
                        </>
                      ) : (
                        "Download"
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

        {/* ZIP download */}
<div className="mt-10 flex flex-wrap items-center gap-3">
  <button
    type="button"
  disabled={downloadingId === "zip" || artworks.length === 0}
    onClick={() => {
      setDownloadingId("zip");
const url = `/api/downloads/archive?session_id=${sessionId}`;
      // Let the browser follow the redirect and download
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // clear the spinner after a moment (page stays; download starts)
      setTimeout(() => setDownloadingId(null), 2000);
    }}
    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full transition ${
      downloadingId === "zip"
        ? "bg-gray-300 cursor-not-allowed"
        : "bg-blue-700 hover:bg-blue-800 text-white"
    }`}
  >
    {downloadingId === "zip" ? (<><Spinner /> Preparing ZIP…</>) : "Download All (ZIP)"}
  </button>

            <p className="text-xs text-gray-600">
              Having trouble?{" "}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/orders/resend-email?session_id=${sessionId}`,
                      { method: "POST" }
                    );
                    if (!res.ok) throw new Error();
                    toast.success("Email sent.");
                  } catch {
                    toast.error("Could not resend email right now.");
                  }
                }}
                className="underline underline-offset-4 hover:text-gray-900"
              >
                Email me the links
              </button>
              .
            </p>
          </div>

          {/* Tiny disclosures */}
          <p className="mt-6 text-[11px] leading-5 text-gray-500">
            Colors vary across displays and printers. Vector formats (SVG/PDF)
            scale without quality loss. Rasters are best printed at their max
            recommended size.
          </p>
        </>
      )}
    </div>
  );
}

/* --------------------- Small UI bits ------------------------ */
function Dot() {
  return (
    <span aria-hidden className="text-gray-300">
      •
    </span>
  );
}

function Badge({
  label,
  tone = "gray",
}: {
  label: string;
  tone?: "gray" | "indigo" | "emerald";
}) {
  const tones: Record<string, string> = {
    gray: "border-gray-200 bg-gray-50 text-gray-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-[2px] rounded-full border ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DetailRow({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium text-gray-800">{v}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border p-8 text-center bg-white/60">
      <h2 className="text-lg font-semibold">No digital items this time</h2>
      <p className="text-gray-600 mt-2">
        If you purchased a print, you’ll get separate shipping emails with
        tracking.
      </p>
    </div>
  );
}
