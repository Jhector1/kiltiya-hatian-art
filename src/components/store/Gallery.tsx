"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  HeartIcon as HeartSolid,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import ImageModal from "./ImageModal";
import { useRouter } from "next/navigation";
import { MyProduct } from "@/types";
import { useFavorites } from "@/contexts/FavoriteContext";
import UniversalModal from "../modal/UniversalModal";
import AuthenticationForm from "../authenticate/AuthenticationFom";
import { useUser } from "@/contexts/UserContext";

const sizeOptions = {
  small: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  medium: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  large: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
};

type Props = {
  products: MyProduct[];
  showViewSizeControls?: boolean;
  showBuyButton?: boolean;
  showLikeButton?: boolean;
  showCommentButton?: boolean;
  onLikeToggle?: (id: string, liked: boolean) => void;
  rounded?: boolean;
};

export default function Gallery({
  products,
  showViewSizeControls = true,
  showBuyButton = true,
  showLikeButton = true,
  showCommentButton = false,
  rounded = false,
  onLikeToggle,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [zoomImage, setZoomImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const [viewSize, setViewSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [isModalOpen, setModalOpen] = useState(false);

  const router = useRouter();
  const { isLoggedIn } = useUser();

  const handleLikeClick = (productId: string) => {
    if (isLoggedIn) {
      const liked = !isFavorite(productId);
      toggleFavorite(productId);
      onLikeToggle?.(productId, liked);
    } else {
      setModalOpen(true);
    }
  };
  console.log('producyoofkfjjf', products)

  return (
    <>
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm closeModalAction={() => setModalOpen(false)} />
      </UniversalModal>
      {showViewSizeControls && (
        <div className="flex gap-3 mt-6 justify-end pr-4">
          {(["small", "medium", "large"] as const).map((s) => (
            <button
              key={s}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 ${
                viewSize === s
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600"
              }`}
              onClick={() => setViewSize(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      <motion.div
        className={`grid ${sizeOptions[viewSize]} gap-x-8 gap-y-14 mt-10 justify-items-center`}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
      >
        {products.map((product) => {
          const isLoaded = !!loadedImages[product.id];
          const liked = isFavorite(product.id);

          return (
            <motion.div
              key={product.productId || product.id }
              className="relative max-w-xs w-full group"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {showLikeButton && (
                <button
                  onClick={() => handleLikeClick(product.id)}
                  className="absolute top-2 right-2 p-2 rounded-full z-10 bg-white"
                  aria-label="Like this artwork"
                >
                  {liked ? (
                    <HeartSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartOutline className="w-5 h-5 text-gray-400 hover:text-red-400 transition" />
                  )}
                </button>
              )}

              <div
                className={`relative w-full h-[20rem] bg-gray-100 overflow-hidden ${
                  rounded && "rounded-xl"
                } shadow-sm cursor-pointer`}
                onClick={() =>
                  router.push(`/store/${product.productId || product.id}`)
                }
              >
                {/* Inner padded container */}
                <div className="w-full h-full p-[1rem]">
                  <div className="relative w-full h-full">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.title}
                      fill
                      unoptimized
                      className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
                      style={{ opacity: isLoaded ? 1 : 0 }}
                      onLoadingComplete={() =>
                        setLoadedImages((prev) => ({
                          ...prev,
                          [product.id]: true,
                        }))
                      }
                    />
                  </div>
                </div>

                {!isLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}
              </div>

              <div className="mt-4 space-y-0">
                <h2 className="font-semibold text-gray-800 text-base">
                  {product.title}
                </h2>
                <p className="text-sm text-gray-500">Size: 30×30in</p>
                <div className="text-gray-700  font-semibold">
                  Price: ${product.price}
                </div>

                {showBuyButton && (
                  <button
                    onClick={() => router.push(`/store/${product.id}`)}
                    className="mt-2 bg-purple-600 text-white text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition"
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {showCommentButton && (
                <div className="mt-2 text-center">
                  <button
                    className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-green-600 transition"
                    aria-label="Comment on this artwork"
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                    Comment
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {zoomImage && (
        <ImageModal
          image={zoomImage.src}
          title={zoomImage.title}
          isOpen
          onClose={() => setZoomImage(null)}
        />
      )}
    </>
  );
}
