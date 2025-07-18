"use client";

import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import Gallery from "@/components/store/Gallery";
import { useUser } from "@/contexts/UserContext";
import { useFavorites } from "@/contexts/FavoriteContext";
// import { Product } from "@prisma/client";
import {  ProductListItem } from "@/types";


export default function FavoritePage() {
  const { user, isLoggedIn } = useUser();
  const { favorites,  removeFavorite } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (!user?.id || !isLoggedIn) return;

    const fetchFavorites = async () => {
      const res = await fetch(`/api/favorite?userId=${user.id}`);
      const data = await res.json();
      setFavoriteProducts(data); // Assumes data is array of full product objects
    };

    fetchFavorites();
  }, [user?.id, isLoggedIn, favorites]);

  const handleLikeToggle = (id: string, liked: boolean) => {
    if (!liked) {
      removeFavorite(id);
      setFavoriteProducts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <>
      <SEO
        title="Haitian Digital Art Gallery"
        description="Buy and explore uniquely crafted Haitian vector artworks."
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-purple-700 mb-4">
          Your Favorites
        </h1>
        <p className="text-gray-600 mb-8">
          Explore the artworks you’ve liked. Tap any image to view details, or
          click ❤️ to remove.
        </p>

        <Gallery
          products={favoriteProducts}
          
          showLikeButton
          // showViewSizeControls
          // showCommentButton={false}
          onLikeToggle={handleLikeToggle}
        />
      </div>
    </>
  );
}
