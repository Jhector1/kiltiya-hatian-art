'use client'

import SEO from '@/components/SEO';
import Gallery from '@/components/store/Gallery';
import {  ProductListItem } from '@/types';
import { fetchProducts } from '@/utils/fetchProducts';
import { useEffect, useState } from 'react';


export default function Home() {
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  return (
    <>
      <SEO title="Haitian Digital Art Gallery" description="Buy and explore uniquely crafted Haitian vector artworks." />
      <Gallery products={products}  />
    </>
  );
}