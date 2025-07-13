'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { MyProduct } from '@/types';

interface FavoriteContextProps {
  favorites: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  refreshFavorites: () => void;
}

const FavoriteContext = createContext<FavoriteContextProps | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useUser();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const refreshFavorites = async () => {
    if (!isLoggedIn || !user?.id) return;

    try {
      const res = await fetch(`/api/favorite?userId=${user.id}`);
      const data = await res.json();
      const ids = new Set(data.map((product: MyProduct) => product.id));
      setFavorites(ids);
    } catch (err) {
      console.error("Failed to refresh favorites:", err);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [user?.id, isLoggedIn]);

  const isFavorite = (productId: string) => favorites.has(productId);

  const addFavorite = async (productId: string) => {
    if (!user?.id) return;

    const res = await fetch('/api/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId }),
    });

    if (res.ok) {
      setFavorites((prev) => new Set(prev).add(productId));
    }
  };

  const removeFavorite = async (productId: string) => {
    if (!user?.id) return;

    const res = await fetch('/api/favorite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, productId }),
    });

    if (res.ok) {
      setFavorites((prev) => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
    }
  };

  const toggleFavorite = (productId: string) => {
    if (isFavorite(productId)) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        refreshFavorites, // ✅ now available to consumers
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = (): FavoriteContextProps => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
};
