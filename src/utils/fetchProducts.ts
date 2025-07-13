// src/utils/fetchProducts.ts

import { MyProduct } from "@/types";

export async function fetchProducts(): Promise<MyProduct[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`could not fetch products: ${res.status}`);
  return res.json();
}
