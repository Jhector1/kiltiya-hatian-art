import { HomeCategory } from "@/types";

const categories: HomeCategory[] = [
  {
    title: 'Veve Symbols',
    slug: 'veve',
    image: '/icons/veve.jpg',
    gradient: 'from-purple-500 via-pink-500 to-red-500',
  },
  {
    title: 'Fruits',
    slug: 'fruits',
    image: '/icons/mango.png',
    gradient: 'from-yellow-400 via-orange-400 to-red-400',
  },
  {
    title: 'Cultural Icons',
    slug: 'icons',
    image: '/icons/flag.png',
    gradient: 'from-blue-500 via-sky-400 to-teal-300',
  },
  {
    title: 'Animals',
    slug: 'animals',
    image: '/icons/hibou.jpg',
    gradient: 'from-green-500 via-lime-400 to-yellow-300',
  },
  {
    title: 'Tools & Crafts',
    slug: 'crafts',
    image: '/icons/tools.webp',
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
  },
  {
    title: 'People & Figures',
    slug: 'figures',
    image: '/icons/figure.avif',
    gradient: 'from-rose-500 via-fuchsia-500 to-purple-500',
  },
];

export default categories;





  const materials =
    [
      {
        label: "Matte Paper",
        multiplier: 1,
        thumbnail: "/images/textures/matte.png",
      },
      {
        label: "Glossy Paper",
        multiplier: 1.2,
        thumbnail: "/images/textures/glossy.png",
      },
      {
        label: "Canvas",
        multiplier: 1.5,
        thumbnail: "/images/textures/canvas.png",
      },
    ];

  const frames =[
      
      { label: "Black Wood", border: "8px solid #111", multiplier: 1.25 },
      { label: "Natural Wood", border: "8px solid #a35" ,  multiplier: 1.5},
      { label: "White", border: "8px solid #fff" ,  multiplier: 1.75},
    ];

  const optionSizes = 
    [
      { label: "8x10 in", multiplier: 1 },
      { label: "11x14 in", multiplier: 1.25 },
      { label: "16x20 in", multiplier: 1.5 },
      { label: "18x24 in", multiplier: 2 },
      { label: "Custom", multiplier: 0 },
    ]
    

  export {optionSizes, materials, frames}