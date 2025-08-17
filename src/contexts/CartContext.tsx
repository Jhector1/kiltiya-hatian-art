"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  AddToCartResponse,
  CartSelectedItem,
  CartUpdates,
  DesignPayload,
} from "@/types";
import { usePathname } from "next/navigation";

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
        originalPrice:number,

    format: string,
    size: string,
    material: string,
    frame: string,
    license: string,
    quantity?: number
  ) => Promise<AddToCartResponse>;

  addToCartWithDesign: (args: {
    productId: string;
    digitalType: string | null;
    printType: string | null;
    price: number;
        originalPrice:number,

    format: string;
    size: string | null;
    material: string | null;
    frame: string | null;
    license: string;
    quantity?: number;
    design?: DesignPayload; // NEW
    snapshot?: boolean; // default true (freeze the cart line)
  }) => Promise<AddToCartResponse>;

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
  addToCart: async () => ({ result: undefined }),
  removeFromCart: async () => {},
  updateCart: async () => {},
  addToCartWithDesign: async () => ({ result: undefined }),
};

const CartContext = createContext<CartContextType>(
  defaultContext as CartContextType
);
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, guestId } = useUser();

  const [cart, setCart] = useState<CartSelectedItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const pathname = usePathname();

  const fetchCart = async () => {
    setLoadingCart(true);
    try {
      const res = await fetch("/api/cart?liveDesignPreview=1", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  // existing: on auth change
  useEffect(() => {
    void fetchCart();
  }, [isLoggedIn]);

  // NEW: when you navigate to /cart (SPA), fetch again
  useEffect(() => {
    if (pathname?.startsWith("/cart")) {
      void fetchCart();
    }
  }, [pathname]);

  // NEW: when window regains focus / tab becomes visible, fetch again
  useEffect(() => {
    const onFocus = () => {
      void fetchCart();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // const { isLoggedIn, guestId } = useUser();

  const addToCart = async (
    productId: string,
    digitalType: string | null,
    printType: string | null,
    price: number,
    originalPrice: number,

    format: string,
    size: string,

    material: string,
    frame: string,
    license: string,
    quantity: number = 1
  ): Promise<AddToCartResponse> => {
    if (!isLoggedIn && !guestId) return { result: undefined }; // ⛔️ block only if both are missing

    setLoadingAdd(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          digitalType,
          printType,
          price,
          originalPrice,

          quantity,
          format,
          size,
          material,
          license,
          frame,
          guestId, // ✅ send guestId to backend
        }),
      });

      const data = await res.json();
      await fetchCart();

      return {
        result: {
          cartItemId: data?.result?.cartItemId,
          digitalVariantId: data?.result?.digitalVariantId,
          printVariantId: data?.result?.printVariantId,
        },
      };
    } catch (err) {
      console.error("Failed to add to cart:", err);
      return { result: undefined };
    } finally {
      setLoadingAdd(false);
    }
  };

  const addToCartWithDesign = async ({
    productId,
    digitalType,
    printType,
    price,
    originalPrice,
    format,
    size,
    material,
    frame,
    license,
    quantity = 1,
    design,
    snapshot = true,
  }: {
    productId: string;
    digitalType: string | null;
    printType: string | null;
    price: number;
    originalPrice: number;
    format: string;
    size: string | null;
    material: string | null;
    frame: string | null;
    license: string;
    quantity?: number;
    design?: DesignPayload;
    snapshot?: boolean;
  }): Promise<AddToCartResponse> => {
    if (!isLoggedIn && !guestId) return { result: undefined };

    setLoadingAdd(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          digitalType,
          printType,
          price,
          originalPrice,
          quantity,
          format,
          size,
          material,
          license,
          frame,
          // NOTE: you don't need to send guestId if your server derives it from cookies
          design, // ← NEW: server will upsert and overwrite preview
          snapshot, // ← NEW: freeze cart line image/style
        }),
      });

      const data = await res.json();
      await fetchCart();

      return {
        result: data?.result
          ? {
              cartItemId: data.result.cartItemId,
              digitalVariantId: data.result.digitalVariantId ?? null,
              printVariantId: data.result.printVariantId ?? null,
              designId: data.result.designId ?? null,
              previewUrl: data.result.previewUrl ?? null,
            }
          : undefined,
      };
    } catch (err) {
      console.error("Failed to add to cart (with design):", err);
      return { result: undefined };
    } finally {
      setLoadingAdd(false);
    }
  };

  const removeFromCart = async (
    productId: string,
    digitalVariantId: string,
    printVariantId: string
  ) => {
    if (!isLoggedIn && !guestId) return;
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
    if (!isLoggedIn && !guestId) return;
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          printVariantId,
          digitalVariantId,
          updates,
        }),
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
        addToCartWithDesign, // NEW
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
