"use client";

import React, { useState } from "react";
// import SEO from "@/components/SEO";
import ProductImageGallery from "@/components/product/detail/ProductImageGallery";
import ProductConfigurator from "@/components/product/detail/ProductConfigurator";
import ProductDescriptionBlock from "@/components/product/detail/ProductDescriptionBlock";
import UniversalModal from "@/components/modal/UniversalModal";
import AuthenticationForm from "@/components/authenticate/AuthenticationFom";
import CartActions from "@/components/product/CartActions";
import ReviewsSection from "@/components/product/review/ReviewSection";
import Link from "next/link";

import type { MaterialOption, FrameOption, LicenseOption } from "@/types";
import { allFrames, allLicenses, allMaterials, allSizes } from "@/data/helpers";
import { useUser } from "@/contexts/UserContext";
import { useProductData } from "@/components/studio/hooks/useProductData";
// import { handleCheckout } from "@/utils/handleCheckout";

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
    finalPrice, // ⬅️ from unified flow
  } = useProductData({ productId });

  const loadingUI = <div className="p-10 text-center">Loading product…</div>;

  return (
    <>
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm
          isGuest={true}
          handlerAction={async () => {
            if (!isLoggedIn && !guestId) setModalOpen(true);
            if (!product) return;
            if (!inCart) {
              await addToCart(
                productId,
                wantDigital ? "Digital" : null,
                wantPrint ? "Print" : null,
                finalPrice, // ✅ unified flow total
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {showProduct && (
              <ProductImageGallery
                product={product}
                preview={preview}
                setPreview={setPreview}
              />
            )}

            <div className="flex flex-col gap-6 w-full">
              <ProductDescriptionBlock product={product} />

              {product.category.toLowerCase() === "spiritual & vodou imagery" &&
                product.svgPreview && (
                  <div className="rounded-2xl ring-1 ring-black/5 bg-white p-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-sm text-black/70 text-center sm:text-left">
                        Want different colors or gradients?
                      </p>
                      <Link
                        href={`${productId}/studio`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        ✨ Customize this piece
                      </Link>
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
                finalPrice={finalPrice}
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

                  if (result.status === "error") {
                    // setErr(result.message || "Checkout failed. Please try again.");
                    return;
                  }
                  if (result.status === "auth_required") {
                    // show login if you want
                    return;
                  }
                  // Close THIS modal so the overlay never sits above Stripe
                  // onClose();
                  await new Promise((r) => requestAnimationFrame(r));

                  if (result.flow === "embedded") {
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product ?? {}) }}
      />
    </>
  );
}
