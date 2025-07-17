// File: components/Gallery.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  HeartIcon as HeartSolid,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import UniversalModal from '../modal/UniversalModal';
import AuthenticationForm from '../authenticate/AuthenticationFom';
import { useFavorites } from '@/contexts/FavoriteContext';
import { useUser } from '@/contexts/UserContext';
import type { ProductListItem } from '@/types';

interface GalleryProps {
  products: Array<
    ProductListItem & {
      purchaseCount: number;
      artistName: string;
      dimensions: string;
      originalPrice?: number;
      description: string;
    }
  >;
  showLikeButton?: boolean;
  onLikeToggle?: (id: string, liked: boolean) => void;
}

export default function Gallery({
  products,
  showLikeButton = true,
  onLikeToggle,
}: GalleryProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isLoggedIn } = useUser();
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const handleLikeClick = (id: string) => {
    if (!isLoggedIn) {
      setModalOpen(true);
      return;
    }
    const liked = !isFavorite(id);
    toggleFavorite(id);
    onLikeToggle?.(id, liked);
  };

  return (
    <>
      <UniversalModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm closeModalAction={() => setModalOpen(false)} />
      </UniversalModal>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4 mt-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
        }}
      >
        {products.map((p) => {
          const liked = isFavorite(p.id);
          return (
            <motion.div
              key={p.id}
              className="relative group bg-gray-100 rounkded-lg shadow-sm hover:shadow-md transition overflow-hidden py-8 px-6"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {showLikeButton && (
                <button
                  onClick={() => handleLikeClick(p.id)}
                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow"
                  aria-label="Toggle favorite"
                >
                  {liked ? (
                    <HeartSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartOutline className="w-5 h-5 text-gray-400 hover:text-red-400 transition" />
                  )}
                </button>
              )}

              {/* Image container */}
              <div
                className="w-full relative bg-grbay-100 p-4 overflow-hidden cursor-pointer"
                style={{ paddingBottom: '75%' }}
                onClick={() => router.push(`/store/${p.id}`)}
              >
                <Image
                  src={p.thumbnails[0] || '/placeholder.png'}
                  alt={p.title}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  onLoadingComplete={() =>
                    setLoaded((prev) => ({ ...prev, [p.id]: true }))
                  }
                  style={{ opacity: loaded[p.id] ? 1 : 0 }}
                />
                {!loaded[p.id] && (
                  <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                )}
              </div>

              {/* Metadata */}
              <div className="mt-6 space-ny-2 text-left">
                <p className="text-xs text-gray-500">{p.artistName}</p>
                <h3
                  onClick={() => router.push(`/store/${p.id}`)}
                  className="text-base font-semibold text-gray-900 hover:underline cursor-pointer"
                >
                  {p.title}
                </h3>
                {/* <p className="text-sm text-gray-600">{p.description}</p> */}
                <p className="text-xs text-gray-500">{p.dimensions}</p>
                <p className="text-sm font-bold text-gray-900">
                  {p.originalPrice ? (
                    <>
                      <span className="line-through text-gray-400">
                        ${p.originalPrice.toFixed(2)}
                      </span>{' '}
                      <span>${p.price.toFixed(2)}</span>{' '}
                      <span className="text-red-600">
                        -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                      </span>
                    </>
                  ) : (
                    <>${p.price.toFixed(2)}</>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Purchased: {p.purchaseCount}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}
