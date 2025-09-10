"use client";

import React, { useState } from "react";
import ProductImageGallery from "@/components/product/detail/ProductImageGallery";
import ProductConfigurator from "@/components/product/detail/ProductConfigurator";
// import ProductDescriptionBlock from "@/components/product/detail/ProductDescriptionBlock";
import UniversalModal from "@/components/modal/UniversalModal";
import AuthenticationForm from "@/components/authenticate/AuthenticationFom";
import CartActions from "@/components/product/CartActions";
// import ReviewsSection from "@/components/product/review/ReviewsSection";
// import Link from "next/link";

import type { MaterialOption, FrameOption, LicenseOption } from "@/types";
import { allFrames, allLicenses, allMaterials, allSizes } from "@/data/helpers";
import { useUser } from "@/contexts/UserContext";
import { useProductData } from "@/components/studio/hooks/useProductData";

// ⬇️ NEW: sale helper
import { getEffectiveSale } from "@/lib/pricing";
import ReviewsSection from "@/components/product/review/ReviewSection";
import { useRouter } from "next/navigation";
// import { cleanSizes } from "@/utils/helpers";
// import { SaleAndCountdown, SaleCountdown } from "@/components/shared/core/SalePriceAndCountDown";

interface ProductDetailProps {
  productId: string;
  showProduct?: boolean;
  showReviews?: boolean;
}

export default function ProductDetail({
  productId,
  showReviews = true,
  showProduct = true,
}: ProductDetailProps) {
  const { isLoggedIn, guestId } = useUser();
  const [isModalOpen, setModalOpen] = useState(false);

  const {
    product,
    inCart,
    options,
    setOptions,
    size,
    setSize,
    customSize,
    setCustomSize,
    isCustom,
    setIsCustom,
    material,
    setMaterial,
    frame,
    setFrame,
    license,
    setLicense,
    wantDigital,
    setWantDigital,
    wantPrint,
    setWantPrint,
    addToCart,
    removeFromCart,
    handleCheckoutAction,
    loadingAdd,
    preview,
    setPreview,
    calculatePrice,
    finalPrice, // base total (we'll apply sale below)
  } = useProductData({ productId });
  const router = useRouter();
  const loadingUI = <div className="p-10 text-center">Loading product…</div>;

  // ⬇️ Compute sale-aware price for current selection
  // finalPrice might be string; coerce to number
  const baseTotal = (() => {
    const n =
      typeof finalPrice === "string" ? parseFloat(finalPrice) : finalPrice;
    return Number.isFinite(n) ? n : 0;
  })();

  // normalize date fields if they arrive as strings
  const saleStartsAt = product?.saleStartsAt
    ? new Date(product.saleStartsAt as any)
    : null;
  const saleEndsAt = product?.saleEndsAt
    ? new Date(product.saleEndsAt as any)
    : null;
  //  alert(JSON.stringify(product))
  // alert(saleEndsAt)
  const saleInfo = product
    ? getEffectiveSale({
        price: baseTotal,
        salePrice: (product as any).salePrice ?? null,
        salePercent: (product as any).salePercent ?? null,
        saleStartsAt,
        saleEndsAt,
     
      })
    : {
        price: baseTotal,
        compareAt: null,
        onSale: false,
        endsAt: null as Date | null,
      };
  // alert(JSON.stringify(getEffectiveSale({
  //         price: baseTotal,
  //         salePrice: (product as any).salePrice ?? null,
  //         salePercent: (product as any).salePercent ?? null,
  //         saleStartsAt,
  //         saleEndsAt,
  //       })))
  // const pctOff = saleInfo.compareAt
  //   ? Math.max(0, Math.round(100 * (1 - saleInfo.price / saleInfo.compareAt)))
  //   : 0;
 const handleClick = () => {
    // if (!isLoggedIn) return setModalOpen(true);
    if (!productId) return; // guard
    router.push(`${encodeURIComponent(String(productId))}/studio`);
  };
  return (
    <>
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm

        onSuccess={()=>setModalOpen(false)}
        
          isGuest={true}
          handlerAction={async () => {
            if (!isLoggedIn && !guestId) setModalOpen(true);
            if (!product) return;
            if (!inCart) {
              await addToCart(
                productId,
                wantDigital ? "Digital" : null,
                wantPrint ? "Print" : null,
                saleInfo.price, // ✅ pass discounted price
               finalPrice,
                product.formats[0]?.split(".").pop() || "",
                size.label,
                material.label,
                frame?.label || "",
                license.type,
                1
              );
            } else {
              await removeFromCart(
                product.id,
                options.digitalVariantId!,
                options.printVariantId!
              );
            }
          }}
        />
      </UniversalModal>

      {!product ? (
        loadingUI
      ) : (
        <main className="max-w-7xl mx-auto pt-10 lg:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {showProduct && (
              <ProductImageGallery
                product={product}
                preview={preview}
                setPreview={setPreview}
              />
            )}
            
       

            <div className="flex relative flex-col gap-6 w-full">
              {/* <div className="w-full left-0 top-0 h-full absolute bg-black p-5 opacity-50"></div> */}
              {/* <ProductDescriptionBlock product={product} /> */}

              {/* <SaleAndCountdown {...saleInfo}/> */}
{/* 
              ⬇️ SALE-AWARE PRICE BLOCK
              <div className="rounded-2xl ring-1 ring-black/5 bg-white p-4 flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-semibold">
                    ${saleInfo.price.toFixed(2)}
                  </span>
                  {saleInfo.onSale && saleInfo.compareAt && (
                    <span className="text-lg text-gray-400 line-through">
                      ${saleInfo.compareAt.toFixed(2)}
                    </span>
                  )}
                  {saleInfo.onSale && pctOff > 0 && (
                    <span className="text-xs font-semibold text-white bg-red-600 rounded-full px-2 py-0.5">
                      -{pctOff}%
                    </span>
                  )}
                </div>
                {saleInfo.onSale && saleInfo.endsAt && (
                  <SaleCountdown endsAt={saleInfo.endsAt} />
                )}
              </div> */}

              {product.category.toLowerCase() === "spiritual & vodou imagery" &&
                product.svgPreview && (
                  <div className="rounded-2xl ring-1 ring-black/5 bg-white p-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-sm text-black/70 text-center sm:text-left">
                        Want different colors or gradients?
                      </p>
                      <button
                      onClick={handleClick}
                 
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        ✨ Customize this piece
                      </button>
                    </div>
                  </div>
                )} 

              <ProductConfigurator
                showFormat={true}
                product={product}
                inCart={inCart || null}
                materials={allMaterials as MaterialOption[]}
                frames={allFrames as FrameOption[]}
                licenses={allLicenses as LicenseOption[]}
                optionSizes={allSizes}
                formatData={{ options, setOptions }}
                licenseData={{ license, setLicense }}
                sizeData={{
                  size,
                  setSize,
                  customSize,
                  setCustomSize,
                  isCustom,
                  setIsCustom,
                }}
                materialData={{ material, setMaterial }}
                frameData={{ frame, setFrame }}
                selection={{
                  wantDigital,
                  setWantDigital,
                  wantPrint,
                  setWantPrint,
                }}
                calculatePrice={calculatePrice}
                finalPrice={saleInfo.price} // ✅ show discounted price inside configurator
              />

              <CartActions
                inCart={Boolean(inCart || null)}
                loading={loadingAdd}
                disabled={!wantDigital && !wantPrint}
                onToggleCart={async () => {
                  if (!isLoggedIn && !guestId) setModalOpen(true);
                  if (!inCart) {
                    await addToCart(
                      productId,
                      wantDigital ? "Digital" : null,
                      wantPrint ? "Print" : null,
                      saleInfo.price, // ✅ discounted
                      finalPrice,
                      product.formats[0]?.split(".").pop() || "",
                      size.label,
                      material.label,
                      frame?.label || "",
                      license.type,
                      1
                    );
                  } else {
                    await removeFromCart(
                      product.id,
                      options.digitalVariantId!,
                      options.printVariantId!
                    );
                  }
                }}
                onCheckout={async () => {
                  const result = await handleCheckoutAction({
                    openUI: false,
                    exportHref: "/account/orders",
                  });
                  if (result?.status !== "ok") return;

                  await new Promise((r) => requestAnimationFrame(r));
                  if (result?.flow === "embedded") {
                    window.dispatchEvent(
                      new CustomEvent("open-checkout", {
                        detail: {
                          clientSecret: result.clientSecret,
                          exportHref: "/account/orders",
                        },
                      })
                    );
                  } else if (result.flow === "redirect") {
                    window.location.href = result.url;
                  } else if (result.flow === "sessionId") {
                    const stripe = await import("@stripe/stripe-js").then((m) =>
                      m.loadStripe(
                        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
                      )
                    );
                    await stripe?.redirectToCheckout({
                      sessionId: result.sessionId,
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-14">
            {showReviews && <ReviewsSection productId={product.id} />}
          </div>
        </main>
      )}

      {/* (Optional) enrich JSON-LD with sale-aware offer */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.title,
              image: product.thumbnails ?? [],
              description: product.description,
              sku: product.id,
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: saleInfo.price.toFixed(2),
                ...(saleInfo.onSale && saleInfo.endsAt
                  ? { priceValidUntil: saleInfo.endsAt.toISOString() }
                  : {}),
                availability: "https://schema.org/InStock",
                url: `/store/${product.id}`,
              },
            }),
          }}
        />
      )}
    </>
  );
}

