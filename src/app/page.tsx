
'use client';

import AboutComponent from "@/components/AboutComponent";
import SEO from "@/components/SEO";
// import DigitalCard from "@/components/digitalCard/DigitalCard";
// import dynamic from "next/dynamic";

// const DigitalCardWrapper = dynamic(
//   () => import("@/components/digitalCard/DigitalCardWrapper"),
//   { ssr: false }
// );

import CategoryGrid from "@/components/home/CategoryGrid";
import CategorySlider from "@/components/home/CategorySlider";
import Hero from "@/components/home/Hero";
import PromoBanner from "@/components/home/PromoBanner";
import Testimonial from "@/components/home/Testimonial";
import WhyHaitianArt from "@/components/home/WhyHaitianArt";
import categories from "@/data/categories";
// import ImageSlider from "@/components/product/ImageSlider";

export default function Home() {

  return (
    <>
    {/* <h1 className="brush-logo">Strain</h1> */}

      <SEO
        title="Haitian Digital Art Gallery"
        description="Buy and explore uniquely crafted Haitian vector artworks."
      />
      <Hero />
       {/* <ImageSlider images={images} />; */}
      <PromoBanner />
      <CategorySlider categories={categories} />
      <CategoryGrid categories={categories} />

      <WhyHaitianArt />
      <AboutComponent/>
      <Testimonial />
 
      {/* <DigitalCardWrapper /> */}
      
    </>
  );
}
