'use client'
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { CartSelectedItem, CartUpdates } from "@/types";

export type CartContextType = {
  cart: CartSelectedItem[];
  loadingCart: boolean;
  loadingAdd: boolean;
  totalPrice: number;
  refreshCart: () => Promise<void>;
  addToCart: (
    productId: string,
    digitalType: string | null,
    printType: string | null,
    price: number,
    format: string,
    size: string,
    material: string,
    frame: string,
    quantity?: number
  ) => Promise<void>;
  removeFromCart: (
    productId: string,
    digitalVariantId: string,
    printVariantId: string
  ) => Promise<void>;
  updateCart: (args: {
    productId: string;
    printVariantId?: string;
    digitalVariantId?: string;
    updates: CartUpdates;
  }) => Promise<void>;
};

const defaultContext = {
  cart: [],
  loadingCart: false,
  loadingAdd: false,
  totalPrice: 0,
  refreshCart: async () => {},
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateCart: async () => {},
};

const CartContext = createContext<CartContextType>(defaultContext as CartContextType);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useUser();

  const [cart, setCart] = useState<CartSelectedItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const fetchCart = async () => {
    setLoadingCart(true);
    if (!isLoggedIn) {
      setCart([]);
      setLoadingCart(false);
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  const addToCart = async (
    productId: string,
    digitalType: string | null,
    printType: string | null,
    price: number,
    format: string,
    size: string,
    material: string,
    frame: string,
    quantity: number = 1
  ) => {
    if (!isLoggedIn) return;
    setLoadingAdd(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          digitalType,
          printType,
          price,
          quantity,
          format,
          size,
          material,
          frame,
        }),
      });
      await fetchCart();
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const removeFromCart = async (
    productId: string,
    digitalVariantId: string,
    printVariantId: string
  ) => {
    if (!isLoggedIn) return;
    setLoadingAdd(true);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, digitalVariantId, printVariantId }),
      });
      await fetchCart();
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const updateCart = async ({
    productId,
    printVariantId,
    digitalVariantId,
    updates,
  }: {
    productId: string;
    printVariantId?: string;
    digitalVariantId?: string;
    updates: CartUpdates;
  }) => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, printVariantId, digitalVariantId, updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to update cart:", data.error);
      } else {
        await fetchCart();
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  const totalPrice = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + item.cartPrice * item.cartQuantity, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loadingCart,
        loadingAdd,
        totalPrice,
        refreshCart: fetchCart,
        addToCart,
        removeFromCart,
        updateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
