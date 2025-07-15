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
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");
  const [artworks, setArtworks] = useState<PurchasedArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  // helper to download any URL as a file
  const downloadFile = async (url: string, filename: string) => {
    try {
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
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/success?session_id=${sessionId}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not fetch downloads.");
        setArtworks(data.digitalDownloads);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        console.error(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) return <div className="p-10 text-center">Loading your purchased items…</div>;

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
            {artworks.map((art, i) => (
              <li key={`${art.id}-${i}`} className="flex gap-4 items-center border-b pb-4">
                <img
                  src={art.downloadUrl}
                  alt={art.title}
                  className="w-24 h-24 object-cover rounded shadow"
                />
                <div className="flex-1">
                  <p className="font-semibold">{art.title}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Format: {art.format}
                  </p>
                  <button
                    onClick={() =>
                      downloadFile(art.downloadUrl, `${art.title}.${art.format}`)
                    }
                    className="inline-block bg-green-600 text-white px-4 py-1 rounded-full hover:bg-green-700 transition"
                  >
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
             <div className="mt-8"> 
  <a
             href={`/api/downloads/zip?session_id=${sessionId}`}
             className="bg-blue-700 text-white px-6 py-2 rounded-full hover:bg-blue-800 transition"
           >
             Download All as ZIP
           </a>
      
            {/* <button
              onClick={() =>
                downloadFile(
                  `/api/downloads/zip?session_id=${sessionId}`,
                  `all-artworks-${sessionId}.zip`
                )
              }
              className="bg-blue-700 text-white px-6 py-2 rounded-full hover:bg-blue-800 transition"
            >
              Download All as ZIP
            </button>  */}
          </div>
        </>
      )}
    </div>
  );
}
