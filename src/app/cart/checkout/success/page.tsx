// src/app/cart/artworks/checkout/success/page.tsx

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
  const sessionId = searchParams.get("session_id");
  const [artworks, setArtworks] = useState<PurchasedArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchDownloads() {
      try {
        const res = await fetch(
          `/api/checkout/success?session_id=${sessionId}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Could not fetch downloads.");
        }

        setArtworks(data.digitalDownloads);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    }

    fetchDownloads();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="p-10 text-center">Loading your purchased items…</div>
    );
  }

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
            {artworks.map((art) => (
              <li
                key={art.id}
                className="flex gap-4 items-center border-b pb-4"
              >
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
                  <a
                    href={art.downloadUrl}
                    download
                    className="inline-block bg-green-600 text-white px-4 py-1 rounded-full hover:bg-green-700 transition"
                  >
                    Download
                  </a>
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
          </div>
        </>
      )}
    </div>
  );
}
