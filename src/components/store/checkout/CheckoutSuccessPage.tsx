"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface PurchasedArtwork {
  id: string;
  title: string;
  format: string;
  downloadUrl: string;
}

export default function CheckoutSuccessPage() {
  const searchParams     = useSearchParams();
  const sessionId        = searchParams?.get("session_id");
  const [artworks, setArtworks] = useState<PurchasedArtwork[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  /** ID of the item currently downloading.
   *  • an artwork's id  → single-item button is busy
   *  • "zip"           → ZIP button is busy
   *  • null            → nothing is downloading
   */
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      const link     = document.createElement("a");
      link.href      = blobUrl;
      link.download  = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      // OPTIONAL fire-and-forget API call
      fetch("/api/downloads", { method: "POST", credentials: "include" })
        .catch(() => {/* silently ignore */});
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ---------------------------------------------------------- */
  /*  Fetch purchased artworks once we have a session_id         */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res  = await fetch(`/api/checkout/success?session_id=${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch downloads.");
        setArtworks(data.digitalDownloads);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        console.error(msg);
        toast.error(msg);
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [sessionId]);

  /* ---------------------------------------------------------- */
  /*  RENDER                                                    */
  /* ---------------------------------------------------------- */
  if (loadingPage)
    return <div className="p-10 text-center">Loading your purchased items…</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Thank you for your purchase!
      </h1>

      {artworks.length === 0 ? (
        <p>You didn’t purchase any digital items this time.</p>
      ) : (
        <>
          <p className="mb-4">You purchased the following digital artwork:</p>

          <ul className="space-y-4">
            {artworks.map((art, i) => {
              const busy = downloadingId === art.id;
              return (
                <li
                  key={`${art.id }-${i}`}
                  className="flex gap-4 items-center border-b pb-4"
                >
                  {art.format.toLowerCase() === "pdf" ? (
                    <iframe
                      src={art.downloadUrl}
                      title={art.title}
                      className="w-24 h-24 rounded shadow border"
                    />
                  ) : (
                    <img
                      src={art.downloadUrl}
                      alt={art.title}
                      className="w-24 h-24 object-cover rounded shadow"
                    />
                  )}

                  <div className="flex-1">
                    <p className="font-semibold">{art.title}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Format: {art.format.toUpperCase()}
                    </p>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        downloadFile(
                          art.downloadUrl,
                          `${art.title}.${art.format}`,
                          art.id            // <- UNIQUE button ID
                        )
                      }
                      className={`inline-block px-4 py-1 rounded-full transition 
                        ${
                          busy
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                      {busy ? "Downloading…" : "Download"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* -------- ZIP download -------- */}
          <div className="mt-8">
            <button
              type="button"
              disabled={downloadingId === "zip"}
              onClick={() =>
                downloadFile(
                  `/api/downloads/zip?session_id=${sessionId}`,
                  `all-artworks-${sessionId}.zip`,
                  "zip"               // <- ID for ZIP button
                )
              }
              className={`px-6 py-2 rounded-full transition
                ${
                  downloadingId === "zip"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
            >
              {downloadingId === "zip" ? "Preparing Zip…" : "Download All as ZIP"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
