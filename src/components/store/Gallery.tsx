"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import UniversalModal from "../modal/UniversalModal";
import AuthenticationForm from "../authenticate/AuthenticationFom";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useUser } from "@/contexts/UserContext";
import type {
  CartSelectedItem,
  ProductListAndOrderCount,
  ProductListItem,
} from "@/types";
import { useCart } from "@/contexts/CartContext";

// ⬇️ Add this import
import { applyBundleIfBoth, getEffectiveSale, roundMoney } from "@/lib/pricing";

interface GalleryProps {
  products:
    | Array<ProductListAndOrderCount>
    | ProductListItem[]
    | Array<CartSelectedItem>;
  showCartItem?: boolean;
  showLikeButton?: boolean;
  onLikeToggle?: (id: string, liked: boolean) => void;
}

export default function Gallery({
  products,
  showLikeButton = true,
  onLikeToggle,
  showCartItem = false,
}: GalleryProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isLoggedIn } = useUser();
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const { removeFromCart } = useCart();

  const handleLikeClick = (id: string) => {
    if (!isLoggedIn) {
      setModalOpen(true);
      return;
    }
    const liked = !isFavorite(id);
    toggleFavorite(id);
    onLikeToggle?.(id, liked);
  };

  // ⬇️ Small helper to compute effective gallery price per product card
  function derivePricing(
    p: ProductListItem | ProductListAndOrderCount | CartSelectedItem
  ) {
    const anyP = p as any;
    const base = typeof anyP.price === "number" ? anyP.price : 0;

    const starts = anyP.saleStartsAt ? new Date(anyP.saleStartsAt) : null;
    const ends = anyP.saleEndsAt ? new Date(anyP.saleEndsAt) : null;

    const saleRes = getEffectiveSale({
      price: base,
      salePrice: anyP.salePrice ?? null,
      salePercent: anyP.salePercent ?? null,
      saleStartsAt: starts,
      saleEndsAt: ends,
    });

    // Bundle is computed off the base; UI and API both choose the cheaper of sale vs bundle.
    const priceWithBundle = applyBundleIfBoth(
      base,
      (p as any).digital,
      (p as any).print
    );
    const priceWithSale = saleRes.price;
    const finalUnitPrice = roundMoney(Math.min(priceWithSale, priceWithBundle));

    const hasBundle = Boolean((p as any).digital && (p as any).print);
    const bundleWins = hasBundle && priceWithBundle < priceWithSale;

    const baseRounded = roundMoney(base);
    const compareAtForUI = bundleWins
      ? baseRounded
      : saleRes.compareAt ?? baseRounded;
    const pricing = {
      price: finalUnitPrice,
      compareAt: bundleWins ? compareAtForUI : saleRes.compareAt ?? null,
      onSale: bundleWins ? true : saleRes.onSale,
      endsAt: bundleWins ? null : saleRes.endsAt,
    } as const;

    const pctOff = pricing.compareAt
      ? Math.max(0, Math.round(100 * (1 - pricing.price / pricing.compareAt)))
      : 0;

    return { ...pricing, pctOff };
  }

  return (
    <>
      <UniversalModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm />
      </UniversalModal>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
        }}
      >
        {products.map((p, i) => {
          const liked = isFavorite(p.id);
          const imgSrc = getPrimaryImage(p);
          // alert(imgSrc)
          const isCartItem = isCartSelectedItem(p);

          // ⬇️ Compute pricing for this tile
          const pricing = derivePricing(p);
          // current and compare values for display
          const current = isCartItem
            ? (p as CartSelectedItem).price
            : pricing.price;
          const compare = isCartItem
            ? (p as CartSelectedItem).originalPrice
            : pricing.compareAt ?? null;
          const discounted = compare != null && current < compare;
          return (
            <motion.div
              key={`${p.id}-${
                isCartItem ? (p as CartSelectedItem).previewUrl : ""
              }`}
              className="gap-3 items-center flex w-full"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <motion.div
                key={`${p.id}-${i}`}
                className="w-3/3 relative group bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden py-8 px-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {" "}
                <div className=" flex items-center">
                  {/* <motion.div
                    key={`${p.id}-${i}`}
                    className="w-3/3 relative group bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden py-8 px-6"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  > */}
                  {showLikeButton && (
                    <button
                      onClick={() => handleLikeClick(p.id)}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow"
                      aria-label="Toggle favorite"
                    >
                      {liked ? (
                        <HeartSolid className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <HeartOutline className="w-5 h-5 text-gray-400 hover:text-yellow-500 transition" />
                      )}
                    </button>
                  )}

                  {/* Customized badge (optional) */}
                  {isCartItem && (p as CartSelectedItem).isUserDesign && (
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white">
                      Customized
                    </span>
                  )}

                  {/* 🔻 Sale badge */}
                  {pricing.onSale && pricing.pctOff > 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                      -{pricing.pctOff}%
                    </span>
                  )}

                  {/* Image */}
                  <div
                    className="w-full relative bg-gray-100  overflow-hidden cursor-pointer"
                    style={{ paddingBottom: "75%" }}
                    onClick={() => router.push(`/store/${p.id}`)}
                  >
                    <Image
                      key={imgSrc}
                      src={imgSrc}
                      alt={(p as any).title}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      onLoadingComplete={() =>
                        setLoaded((prev) => ({ ...prev, [p.id]: true }))
                      }
                      style={{ opacity: loaded[p.id] ? 1 : 0 }}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                    {!loaded[p.id] && (
                      <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                    )}
                  </div>
                  {/* </motion.div> */}

                  {/* Optional frame tile (when cart item has a frame) */}
                  {isCartItem && (p as CartSelectedItem).print?.frame && (
                    <>
                      <h1 className="px-1"> +</h1>
                      <div
                        className="w-2/3 relative overflow-hidden cursor-pointer"
                        style={{ paddingBottom: "75%" }}
                        onClick={() => router.push(`/store/${p.id}`)}
                      >
                        <Image
                          src={`/images/${(p as CartSelectedItem)
                            .print!.frame!.toLowerCase()
                            .split(" ")
                            .join("-")}.png`}
                          alt={(p as any).title}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          onLoadingComplete={() =>
                            setLoaded((prev) => ({ ...prev, [p.id]: true }))
                          }
                          style={{ opacity: loaded[p.id] ? 1 : 0 }}
                        />
                        <p className="w-1/3 text-xs text-gray-500">
                          {(p as CartSelectedItem).print?.material || ""}
                        </p>

                        {!loaded[p.id] && (
                          <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                        )}
                      </div>
                    </>
                  )}
                </div>
                {/* Metadata */}
                <div className="flex justify-between items-center">
                  <div className="mt-6 space-y-2 text-left">
                    <h3
                      onClick={() => router.push(`/store/${p.id}`)}
                      className="text-base font-semibold text-gray-900 hover:underline cursor-pointer"
                    >
                      {(p as any).title}
                    </h3>

                    {"dimensions" in p && (
                      <p className="text-xs text-gray-500">
                        {(p as any).dimensions}
                      </p>
                    )}

                    {/* 💰 Price block (sale-aware) */}
                    <p className="text-sm font-bold text-gray-900">
                      {discounted ? (
                        <>
                          <span>${current.toFixed(2)}</span>
                          <span className="ml-2 line-through text-gray-400">
                            ${compare!.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>${current.toFixed(2)}</span>
                      )}
                    </p>

                    {/* Variant summary when this is a cart item */}
                    {isCartItem && (
                      <p className="text-xs text-gray-600">
                        {(p as CartSelectedItem).print ? "Print" : ""}
                        {(p as CartSelectedItem).digital
                          ? (p as CartSelectedItem).print
                            ? " & Digital"
                            : "Digital"
                          : ""}
                      </p>
                    )}

                    {"artistName" in p && (
                      <p className="text-xs text-gray-500">
                        {(p as any).artistName}
                      </p>
                    )}
                    {"purchaseCount" in p && (
                      <p className="text-xs text-gray-500">
                        Purchased: {(p as any).purchaseCount}
                      </p>
                    )}
                  </div>

                  {showCartItem && isCartItem && (
                    <small
                      onClick={async () => {
                        const { digital, print, id } = p as CartSelectedItem;
                        await removeFromCart(
                          id,
                          digital?.id ?? "",
                          print?.id ?? ""
                        );
                      }}
                      className="cursor-pointer text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </small>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
}

/** Prefer snapshot (user design) > explicit imageUrl > svg preview > first thumbnail */
/** Prefer snapshot (user design) > explicit imageUrl > svg preview > first thumbnail */
function getPrimaryImage(
  p: ProductListItem | ProductListAndOrderCount | CartSelectedItem
): string {
  const anyP = p as any;

  if (anyP.previewUrl) return anyP.previewUrl;
  if (anyP.thumbnails[0]) return anyP.thumbnails[0]; // ← user design (cart/API)
  if (anyP.imageUrl) return anyP.imageUrl;
  if (anyP.svgPreview) return anyP.svgPreview;
  if (Array.isArray(anyP.thumbnails) && anyP.thumbnails.length)
    return anyP.thumbnails[0];

  return "/placeholder.png";
}

/** Narrowing guard that works for both digital-only and print-only cart lines */
function isCartSelectedItem(
  p: ProductListItem | ProductListAndOrderCount | CartSelectedItem
): p is CartSelectedItem {
  return !!p && typeof p === "object" && "cartItemId" in p;
}
