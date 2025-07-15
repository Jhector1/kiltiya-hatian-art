// File: src/contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { CartSelectedItem, CartUpdates } from "@/types";
// import { type } from 'os';
// import { ProductVariant } from '@prisma/client';

// export interface CartItem {
//   id: string;
//   productId: string;
//   digitalVariantId?: string;
//   printVariantId?: string;
//   title?: string;
//   image?: string;
//   description?: string;
//   price: number;
//   quantity: number;
// }

type CartContextType = {
  cart: CartSelectedItem[];
  loadingCart: boolean;
  loadingAdd: boolean;
  totalPrice: number;
  refreshCart: () => Promise<void>;
  addToCart: (
    productId: string,
    digitalType: string | null,
    printType: string | null,

    price: number, // 'Digital' or 'Print'

    format: string, // e.g. 'jpg' or 'png'
    size: string, // e.g. '11x14 in'
    material: string,
    frame: string,
    quantity?: 1
  ) => Promise<void>;
  removeFromCart: (
    productId: string,
    digitalVariantId: string,
    printVariantId: string
  ) => Promise<void>;
  updateCart: ({
    userId,
    productId,
    printVariantId,
    digitalVariantId,
    updates,
  }: {
    userId: string;
    productId: string;
    printVariantId?: string;
    digitalVariantId?: string;
    updates: CartUpdates;
  }) => Promise<void>;
};
const defaultCartContext: CartContextType = {
  cart: [],
  loadingCart: false,
  loadingAdd: false,
  totalPrice: 0,
  refreshCart: async () => {},
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateCart: async () => {},
};
const CartContext = createContext<CartContextType>(defaultCartContext);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn } = useUser();
  const [cart, setCart] = useState<CartSelectedItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  // const {loadingAdd, setLoadingAdd} = useState<ProductV>(false);

  const fetchCart = async () => {
    setLoadingCart(true);
    if (!isLoggedIn || !user) {
      setCart([]);
      setLoadingCart(false);
      return;
    }
    try {
      const res = await fetch(`/api/cart?userId=${user.id}`);
      if (!res.ok) throw new Error(res.statusText);
      const items = await res.json();
      // alert(JSON.stringify(items))
      setCart(items || []);
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
    quantity?: number
  ) => {
    if (!isLoggedIn || !user) return;
    setLoadingAdd(true);

    // if your caller is sending a string price, turn it into a number here:
    // const numericPrice = typeof price === "string" ? parseFloat(price) : price;

    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId,
          digitalType,
          printType,
          price, // now a number
          quantity,
          format,
          size,
          material,
          frame,
        }),
      });
      await fetchCart();
    } finally {
      setLoadingAdd(false);
    }
  };
  async function updateCart({
    userId,
    productId,
    printVariantId,
    digitalVariantId,
    updates,
  }: {
    userId: string;
    productId: string;
    printVariantId?: string; // now matches the interface
    digitalVariantId?: string; // now matches the interface
    updates: CartUpdates;
  }) {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          productId,
          printVariantId,
          digitalVariantId,
          updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to update cart:", data.error);
      } else {
        console.log("Cart updated:", data.message);
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  }

  const removeFromCart = async (
    productId: string,
    digitalVariantId: string,
    printVariantId: string

    // type: 'Digital' | 'Print'
  ) => {
    console.log(productId, digitalVariantId, printVariantId);
    if (!isLoggedIn || !user) return;
    setLoadingAdd(true);
    try {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId,
          digitalVariantId,
          printVariantId,
        }),
      });
      await fetchCart();
    } catch (error) {
      console.error("Failed to remove from cart:", error);
    } finally {
      setLoadingAdd(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchCart();
    }
  }, [user, isLoggedIn]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.cartPrice * item.cartQuantity,
    0
  );

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
