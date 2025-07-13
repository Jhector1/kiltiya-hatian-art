// File: src/contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { MyProduct } from "@/types";
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
  cart: MyProduct[];
  loadingCart: boolean;
  loadingAdd: boolean;
  totalPrice: number;
  refreshCart: () => Promise<void>;
  addToCart: (
    productId: string,
    digitalType: string,
    printType: string,

    price: string, // 'Digital' or 'Print'
    quantity: 1,
    format: string, // e.g. 'jpg' or 'png'
    size: string, // e.g. '11x14 in'
    material: string,
    frame: string
  ) => Promise<void>;
  removeFromCart: (
    productId: string,
    variantId: string,
    type: "Digital" | "Print"
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
    printVariantId: string;
    digitalVariantId: string;
    updates: { [key: string]: string };
  }) => Promise<void>;
};

const CartContext = createContext<CartContextType>({} as any);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn } = useUser();
  const [cart, setCart] = useState<MyProduct[]>([]);
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
      const { items } = await res.json();
      setCart(items || []);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  const addToCart = async (
    //  userId: string,
    productId: string,
    digitalType: string,
    printType: string,

    price: string, // 'Digital' or 'Print'
    quantity: 1,
    format: string, // e.g. 'jpg' or 'png'
    size: string, // e.g. '11x14 in'
    material: string,
    frame: string
    // calculatePrice: (variantId: string) => string
  ) => {
    // console.log(888)
    if (!isLoggedIn || !user) return;
    setLoadingAdd(true);
    // const payloads: Array<{
    //   digitalVariantId?: string;
    //   printVariantId?: string;
    //   price: number;
    // }> = [];
    // if (options.digitalVariantId) {
    //   payloads.push({
    //     digitalVariantId: options.digitalVariantId,
    //     price: parseFloat(calculatePrice(options.digitalVariantId)),
    //   });
    // }
    // if (options.printVariantId) {
    //   payloads.push({
    //     printVariantId: options.printVariantId,
    //     price: parseFloat(calculatePrice(options.printVariantId)),
    //   });
    // }

    try {
      // await Promise.all(
      //   payloads.map((p) =>
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: productId,
          digitalType, // 'Digital'
          printType, // 'Print'
          price,
          quantity,
          format, // e.g. 'jpg' or 'png'
          size, // e.g. '11x14 in'
          material,
          frame,
        }),
      });

      await fetchCart();
    } catch (error) {
      console.error("Failed to add to cart:", error);
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
    printVariantId: string;
    digitalVariantId: string;
    updates: { [key: string]: string };
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
    (sum, item) => sum + item.price * item.quantity,
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
