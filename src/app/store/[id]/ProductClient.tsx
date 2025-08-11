'use client';

import React, { useEffect, useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import ProductImageGallery from '@/components/product/detail/ProductImageGallery';
import ProductConfigurator from '@/components/product/detail/ProductConfigurator';
import ProductDescriptionBlock from '@/components/product/detail/ProductDescriptionBlock';
import UniversalModal from '@/components/modal/UniversalModal';
import AuthenticationForm from '@/components/authenticate/AuthenticationFom';
import CartActions from '@/components/product/CartActions';
import { fetchProductById } from '@/utils/fetchProductById';
import { useUser } from '@/contexts/UserContext';
import { useCart } from '@/contexts/CartContext';
import type { ProductDetailResult, AddOptions, LicenseOption, FrameOption, MaterialOption } from '@/types';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { handleCheckout } from '@/utils/handleCheckout';
import ReviewsSection from '@/components/product/review/ReviewSection';
import Link from 'next/link';

interface ProductDetailProps{
  productId: string;
  showProduct?: boolean
  showReviews?: boolean;
  showFormat?: boolean;
}
export default function ProductDetail({ productId , showFormat=true, showReviews=true, showProduct=true}: ProductDetailProps) {
  const { user, isLoggedIn, guestId } = useUser();
  const { cart, loadingAdd, addToCart, updateCart, removeFromCart } = useCart();

  const [product, setProduct] = useState<ProductDetailResult | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const [options, setOptions] = useState<AddOptions>({ digital: false, print: false, digitalVariantId: '', printVariantId: '' });
  const [license, setLicense] = useState<LicenseOption>({
    type: 'personal', name: 'Personal Use', price: 0, description: 'For personal projects and non-commercial use.',
  });

  const [size, setSize] = useState({ label: '11x14 in', multiplier: 1.25 });
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [isCustom, setIsCustom] = useState(false);
  const [material, setMaterial] = useState<MaterialOption>({ label: 'Matte Paper', multiplier: 1, thumbnail: '/images/textures/matte.png' });
  const [frame, setFrame] = useState<FrameOption | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const materials = useMemo(() => ([
    { label: 'Matte Paper', multiplier: 1, thumbnail: '/images/textures/matte.png' },
    { label: 'Glossy Paper', multiplier: 1, thumbnail: '/images/textures/glossy.png' },
    { label: 'Canvas', multiplier: 1.5, thumbnail: '/images/textures/canvas.png' },
  ]), []);

  const licenses = [
    { type: 'personal',  name: 'Personal Use',  price: 0,   description: 'For personal projects and non-commercial use.' },
    { type: 'commercial', name: 'Commercial Use', price: 50,  description: 'For business use: websites, client work, etc.' },
    { type: 'extended',  name: 'Extended License', price: 200, description: 'For resale or merchandise with unlimited copies.' },
  ];

  const frames = useMemo(() => ([
    { label: 'Black Wood',   border: '8px solid #111', multiplier: 1.25 },
    { label: 'Natural Wood', border: '8px solid #a35', multiplier: 1.5  },
    { label: 'White',        border: '8px solid #fff', multiplier: 1.75 },
  ]), []);

  const optionSizes = useMemo(() => ([
    { label: '8x10 in',  multiplier: 1 },
    { label: '11x14 in', multiplier: 1.25 },
    { label: '16x20 in', multiplier: 1.5 },
    { label: '18x24 in', multiplier: 2 },
    { label: 'Custom',   multiplier: 0 },
  ]), []);

  const calculatePrice = usePriceCalculator(
    product!, size, material, frame, options, customSize, isCustom, license
  );

  useEffect(() => {
    if (!productId) return;
    fetchProductById(productId.toString(), user?.id || guestId || '')
      .then((p) => {
        setProduct(p);
        setPreview({ src: p.imageUrl || '', alt: p.title });

        const printVariant = p.variants?.find((v) => v.type?.toUpperCase() === 'PRINT' && v.inUserCart);
        const digitalVariant = p.variants?.find((v) => v.type?.toUpperCase() === 'DIGITAL' && v.inUserCart);

        setOptions({
          digital: !!digitalVariant,
          print: !!printVariant,
          digitalVariantId: digitalVariant?.id || '',
          printVariantId: printVariant?.id || '',
        });

        const currentSize = printVariant && optionSizes.find((s) => s.label.toLowerCase() === printVariant.size?.toLowerCase());
        const currentMaterial = printVariant && materials.find((m) => m.label.toLowerCase() === printVariant.material?.toLowerCase());
        const currentFrame = printVariant && frames.find((f) => f.label.toLowerCase() === printVariant.frame?.toLowerCase());
        const currentLicense = digitalVariant && licenses.find((l) => l.type.toLowerCase() === (digitalVariant.license || '').toLowerCase());

        if (currentLicense) setLicense(currentLicense);
        setSize(currentSize || optionSizes[1]);
        setMaterial(currentMaterial || materials[0]);
        setFrame(currentFrame || null);
      })
      .catch(console.error);
  }, [productId, user, guestId, frames, materials, optionSizes]);

  useEffect(() => {
    if (!product) return;
    const price =
      (options.digital ? parseFloat(calculatePrice('Digital').digitalPrice) : 0) +
      (options.print ? parseFloat(calculatePrice('Print').printPrice) : 0);
    setFinalPrice(price);
  }, [product, license, size, customSize, isCustom, options, material, frame, calculatePrice]);

  if (!product) return <div className="p-10 text-center">Loading product…</div>;
  const inCart = cart.find((item) => item.id === product.id);

  return (
    <>
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm
          isGuest={true}
          handlerAction={async () => {
            if (!isLoggedIn && !guestId) setModalOpen(true);
            if (!inCart) {
              await addToCart(
                productId?.toString() || '',
                options.digital ? 'Digital' : null,
                options.print ? 'Print' : null,
                finalPrice,
                product.formats[0]?.split('.').pop() || '',
                size.label,
                material.label,
                frame?.label || '',
                license.type,
                1
              );
            } else {
              await removeFromCart(product.id, options.digitalVariantId!, options.printVariantId!);
            }
          }}
        />
      </UniversalModal>

      <SEO title={product.title} description={product.description} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {showProduct&&<ProductImageGallery product={product} preview={preview} setPreview={setPreview} />}

          <div className="flex flex-col gap-6 w-full">
            <ProductDescriptionBlock product={product} />

{product.category.toLowerCase()+'9900'}
            {product.category.toLowerCase() && product.svgPreview==='spiritual & vodou imagery' &&<div className="rounded-2xl ring-1 ring-black/5 bg-white p-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-black/70 text-center sm:text-left">Want different colors or gradients?</p>
                <Link
                href={`${productId}/studio`}
                  // type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  ✨ Customize this piece
                </Link>
              </div>
            </div>

            }
            <ProductConfigurator
              product={product}
              inCart={inCart!}
              materials={materials}
              frames={frames}
              licenses={licenses}
              optionSizes={optionSizes}
              formatData={{ options, setOptions }}
              licenseData={{ license, setLicense }}
              sizeData={{ size, setSize, customSize, setCustomSize, isCustom, setIsCustom }}
              materialData={{ material, setMaterial }}
              frameData={{ frame, setFrame }}
              updateCart={(updates) =>
                updateCart({
                  productId: product.id,
                  printVariantId: options.print ? options.printVariantId : undefined,
                  digitalVariantId: options.digital ? options.digitalVariantId : undefined,
                  updates,
                })
              }
              calculatePrice={calculatePrice}
              finalPrice={finalPrice}
            />

            <CartActions
              inCart={inCart || null}
              loading={loadingAdd}
              disabled={!options.digital && !options.print}
              onToggleCart={async () => {
                if (!isLoggedIn && !guestId) setModalOpen(true);
                if (!inCart) {
                  await addToCart(
                    productId?.toString() || '',
                    options.digital ? 'Digital' : null,
                    options.print ? 'Print' : null,
                    finalPrice,
                    product.formats[0]?.split('.').pop() || '',
                    size.label,
                    material.label,
                    frame?.label || '',
                    license.type,
                    1
                  );
                } else {
                  await removeFromCart(product.id, options.digitalVariantId!, options.printVariantId!);
                }
              }}
              onCheckout={() =>
                handleCheckout({
                  user,
                  guestId,
                  inCart,
                  addToCart,
                  product,
                  options,
                  format: product.formats[0]?.split('.').pop() || '',
                  size,
                  material,
                  frame,
                  license,
                  setModalOpen,
                  id: productId?.toString() || '',
                  finalPrice: String(
                    Number(calculatePrice('Print').printPrice) + Number(calculatePrice('Digital').digitalPrice)
                  ),
                })
              }
            />
          </div>
        </div>

        <div className="mt-14">
           {showReviews&&<ReviewsSection productId={product.id} />}
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
    </>
  );
}
