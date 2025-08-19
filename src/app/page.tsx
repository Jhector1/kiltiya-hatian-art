"use client";

import AboutComponent from "@/components/AboutComponent";
// import EditableCanvas from "@/components/studio/EditableCanvas";
// import PngEditor from "@/components/PNGEditor";
import SEO from "@/components/SEO";
import VeveDrawFromSvg from "@/components/animation/VeveDrawFromSvg";
// import SvgEditor from "@/components/SvgEditor";
// import DigitalCard from "@/components/digitalCard/DigitalCard";
// import dynamic from "next/dynamic";

// const DigitalCardWrapper = dynamic(
//   () => import("@/components/digitalCard/DigitalCardWrapper"),
//   { ssr: false }
// );

import CategoryGrid from "@/components/home/CategoryGrid";
import CategorySlider from "@/components/home/CategorySlider";
import Hero from "@/components/home/Hero";
import EditorPromo from "@/components/home/HeroVideoLooTeaser";
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
   


      {/* <div className="flex justify-around w-[min(90vw,900px)]"> */}
        <div className="m-auto pb-4 w-[min(90vw,900px)]">
          <VeveDrawFromSvg
            loop
            src="/erzulie_freda.svg" // put your file in /public/veves/
            sortByAttr="data-order" // optional: control draw sequence
            delayStep={0.08}
            duration={1.2}
          />
        </div>
        <CategorySlider categories={categories} />
      {/* </div> */}
      <CategoryGrid categories={categories} />

      <WhyHaitianArt />
         <EditorPromo />
      <AboutComponent />
      <Testimonial />

     {/* <EditableCanvas/> */}
      {/*  <PngEditor/>
  */}

      {/* <DigitalCardWrapper /> */}
    </>
  );
}
