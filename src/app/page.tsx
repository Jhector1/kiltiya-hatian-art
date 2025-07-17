// 'use client';

// import { useEffect, useState } from 'react';
// import Layout from '@/components/Layout';
// import SEO from '@/components/SEO';
// import { motion } from 'framer-motion';
// import Link from 'next/link';

// const categories = [
//   {
//     title: 'Veve Symbols',
//     slug: 'veve',
//     image: '/icons/veve.jpg',
//     gradient: 'from-purple-500 via-pink-500 to-red-500',
//   },
//   {
//     title: 'Fruits',
//     slug: 'fruits',
//     image: '/icons/mango.png',
//     gradient: 'from-yellow-400 via-orange-400 to-red-400',
//   },
//   {
//     title: 'Cultural Icons',
//     slug: 'icons',
//     image: '/icons/flag.png',
//     gradient: 'from-blue-500 via-sky-400 to-teal-300',
//   },
//   {
//     title: 'Animals',
//     slug: 'animals',
//     image: '/icons/hibou.jpg',
//     gradient: 'from-green-500 via-lime-400 to-yellow-300',
//   },
//   {
//     title: 'Tools & Crafts',
//     slug: 'crafts',
//     image: '/icons/tools.webp',
//     gradient: 'from-orange-500 via-amber-500 to-yellow-400',
//   },
//   {
//     title: 'People & Figures',
//     slug: 'figures',
//     image: '/icons/figure.avif',
//     gradient: 'from-rose-500 via-fuchsia-500 to-purple-500',
//   },
// ];

// export default function Home() {
//   return (
//     <Layout>
//       <SEO
//         title="Haitian Digital Art Gallery"
//         description="Buy and explore uniquely crafted Haitian vector artworks."
//       />

//       <motion.div
//         className="text-center my-16"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//       >
//         <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">
//           Haitian Digital Art Market
//         </h1>
//         <p className="text-lg text-gray-700 max-w-2xl mx-auto">
//           Explore a vibrant collection of veve symbols, fruits, animals, and cultural icons inspired by Haitian heritage.
//         </p>
//       </motion.div>

//       <motion.div
//         className="mb-32 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.4, duration: 0.6 }}
//       >
//         {categories.map((cat) => (
//           <Link href={`/category/${cat.slug}`} key={cat.slug}>
//             <div className={`rounded-xl p-6 cursor-pointer bg-gradient-to-r ${cat.gradient} text-white shadow-lg hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center`}>
//               <img src={cat.image} alt={cat.title} className="w-24 h-24 mb-4 bg-white rounded-full p-2" />
//               <h2 className="text-2xl font-bold text-center">{cat.title}</h2>
//             </div>
//           </Link>
//         ))}
//       </motion.div>
//     </Layout>
//   );
// }'use client';
import AboutComponent from "@/components/AboutComponent";
import SEO from "@/components/SEO";
// import DigitalCard from "@/components/digitalCard/DigitalCard";
import DigitalCardWrapper from "@/components/digitalCard/DigitalCardWrapper";

import CategoryGrid from "@/components/home/CategoryGrid";
import CategorySlider from "@/components/home/CategorySlider";
import Hero from "@/components/home/Hero";
import PromoBanner from "@/components/home/PromoBanner";
import Testimonial from "@/components/home/Testimonial";
import WhyHaitianArt from "@/components/home/WhyHaitianArt";
import ProductForm from "@/components/upload/ProductForm";
import categories from "@/data/categories";

export default function Home() {
  return (
    <>
    {/* <h1 className="brush-logo">Strain</h1> */}

      <SEO
        title="Haitian Digital Art Gallery"
        description="Buy and explore uniquely crafted Haitian vector artworks."
      />
      <Hero />
      <PromoBanner />
      <CategorySlider categories={categories} />
      <CategoryGrid categories={categories} />

      <WhyHaitianArt />
      <AboutComponent/>
      <Testimonial />
      <ProductForm/>
      <DigitalCardWrapper />
      
    </>
  );
}
