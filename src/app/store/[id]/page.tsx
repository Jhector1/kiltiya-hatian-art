"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import ProductImage from "@/components/product/ProductImage";
import FormatSelector from "@/components/product/FormatSelector";
import SizeSelector from "@/components/product/SizeSelector";
import PurchaseOptions from "@/components/product/PurchaseOptions";
import CartActions from "@/components/product/CartActions";
import LikeButton from "@/components/product/LikeButton";
import PrintCustomizer from "@/components/product/PrintCustomizer";
import ProductImagePreviews from "@/components/product/ProductImagePreviews";
import ReviewsSection from "@/components/product/review/ReviewSection";
import { fetchProductById } from "@/utils/fetchProductById";
import { useUser } from "@/contexts/UserContext";
import UniversalModal from "@/components/modal/UniversalModal";
import AuthenticationForm from "@/components/authenticate/AuthenticationFom";
import { useCart } from "@/contexts/CartContext";
import {
  AddOptions,
  Format,
  FrameOption,
  MaterialOption,
  MyProduct,
} from "@/types";
import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn } = useUser();
  const {
    cart,
    loadingCart,
    loadingAdd,
    addToCart,
    updateCart,
    removeFromCart,
  } = useCart();
  const { user, loading: loadingUser } = useUser();

  const [product, setProduct] = useState<MyProduct | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(
    null
  );
  const [format, setFormat] = useState<string>("");
  const [size, setSize] = useState<{ label: string; multiplier: number }>({
    label: "11x14 in",
    multiplier: 1.25,
  });
  const [isCustom, setIsCustom] = useState(false);
  const [customSize, setCustomSize] = useState({ width: "", height: "" });
  const [material, setMaterial] = useState<MaterialOption>({
    label: "Matte Paper",
    multiplier: 1,
    thumbnail: "/images/textures/matte.png",
  });
  const [frame, setFrame] = useState<FrameOption | null>(null);
  const [options, setOptions] = useState<AddOptions>({
    digitalVariantId: "",
    printVariantId: "",
    digital: false,
    print: false,
  });
  const [liked, setLiked] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const materials = useMemo(
    () => [
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
    ],
    []
  );

  const frames = useMemo(
    () => [
      { label: "Black Wood", border: "8px solid #111" },
      { label: "Natural Wood", border: "8px solid #a35" },
      { label: "White", border: "8px solid #fff" },
    ],
    []
  );

  const optionSizes = useMemo(
    () => [
      { label: "8x10 in", multiplier: 1 },
      { label: "11x14 in", multiplier: 1.25 },
      { label: "16x20 in", multiplier: 1.5 },
      { label: "18x24 in", multiplier: 2 },
      { label: "Custom", multiplier: 0 },
    ],
    []
  );

  // async function updateCart({
  //   userId,
  //   productId,
  //   printVariantId,
  //   key,
  //   value,
  // }: {
  //   userId: string;
  //   productId: string;
  //   printVariantId: string;
  //   key: string;
  //   value: string;
  // }) {
  //   try {
  //     const res = await fetch("/api/cart", {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         userId,
  //         productId,
  //         printVariantId,
  //         updates: {
  //           [key]: value,
  //         },
  //       }),
  //     });

  //     const data = await res.json();
  //     if (!res.ok) {
  //       console.error("Failed to update cart:", data.error);
  //     } else {
  //       console.log("Cart updated:", data.message);
  //     }
  //   } catch (err) {
  //     console.error("Error updating cart:", err);
  //   }
  // }

  // Load product and initialize options
  useEffect(() => {
    if (!id || loadingUser) return;
    //  console.log(user,'66868868686')
    fetchProductById(id.toString(), user?.id || "")
      .then((p) => {
        setProduct(p);
        setPreview({ src: p.imageUrl || "", alt: p.title });

        const printVariant = p.variants?.find(
          (v) => v.type?.toUpperCase() === "PRINT" && v.inUserCart
        );
        const digitalVariant = p.variants?.find(
          (v) => v.type?.toUpperCase() === "DIGITAL" && v.inUserCart
        );

        setOptions({
          digital: !!digitalVariant,
          print: !!printVariant,
          digitalVariantId: digitalVariant?.id || "",
          printVariantId: printVariant?.id || "",
        });

        const currentSize =
          printVariant &&
          optionSizes.find(
            (s) => s.label.toLowerCase() === printVariant.size?.toLowerCase()
          );
        const currentMaterial =
          printVariant &&
          materials.find(
            (m) =>
              m.label.toLowerCase() === printVariant.material?.toLowerCase()
          );
        const currentFrame =
          printVariant &&
          frames.find(
            (f) => f.label.toLowerCase() === printVariant.frame?.toLowerCase()
          );

        setSize(currentSize || optionSizes[1]); // default to 11x14
        setMaterial(currentMaterial || materials[0]);
        setFrame(currentFrame || null);

        // Optional: default format
        if (p.formats.length) {
          const ext = p.formats[0].split(".").pop();
          if (ext) setFormat(ext);
        } else {
          setFormat(""); // fallback
        }
      })
      .catch(console.error);
  }, [id, loadingUser, materials, frames, optionSizes, user?.id]);

  if (!product || !preview) {
    return <div className="p-10 text-center">Loading product…</div>;
  }

  // Price calculation
  const calculatePrice = (type: string) => {
    const base = product.price;
    if (type === "Digital") return (base * 0.6).toFixed(2);
    const mul =
      isCustom && customSize.width && customSize.height
        ? (+customSize.width * +customSize.height) / 80
        : size.multiplier;

    return (base * mul).toFixed(2);
  };

  const formats: Format[] = product.formats.map((url) => {
    const parts = url.split(".");
    return { type: parts.pop() || "", resolution: "n/a", multiplier: 1 };
  });

  const seen = new Set<string>();
  const uniqueFormats = formats.filter(
    (f) => !seen.has(f.type) && seen.add(f.type)
  );

  const inCart = cart.find((item) => item.productId === product.id);
  const loading = loadingAdd;

  const handleToggleCart = async () => {
    if (!isLoggedIn) {
      setModalOpen(true);
      return;
    }

    if (!inCart) {
      await addToCart(
        id?.toString() || "",
        options.digital ? "Digital" : null,
        options.print ? "Print" : null,
        parseFloat(calculatePrice(options.digital ? "Digital" : "Print")),
        1,
        format,
        size.label,
        material?.label || "",
        frame?.label || ""
      );
    } else {
      await removeFromCart(product.id, inCart.digital?.id, inCart.print?.id);
    }
  };

  return (
    <>
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm closeModalAction={() => setModalOpen(false)} />
      </UniversalModal>

      <SEO title={product.title} description={product.description} />
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <ProductImagePreviews
            scenarios={product.thumbnails}
            onSelectAction={setPreview}
            selected={preview}
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between">
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <LikeButton liked={liked} onToggle={() => setLiked(!liked)} />
          </div>

          <ProductImage src={preview.src} alt={preview.alt} />
          <h3 className="font-bold">Description:</h3>
          <p className="pb-10">{product.description}</p>

          <FormatSelector
            formats={uniqueFormats}
            selected={format}
            onChangeAction={setFormat}
            inCart={inCart}
            updateCart={(updates) =>
              updateCart({
                userId: user?.id || "",
                productId: product.id,
                printVariantId: options.printVariantId,
                updates,
              })
            }
          />

          {options.print && (
            <SizeSelector
              options={optionSizes}
              selected={size}
              isCustom={isCustom}
              customSize={customSize}
              onSizeChange={(s, custom) => {
                setSize(s);
                setIsCustom(s.label === "Custom");
                if (custom) setCustomSize(custom);
              }}
              inCart={inCart}
              updateCart={(updates) =>
                updateCart({
                  userId: user?.id || "",
                  productId: product.id,
                  printVariantId: options.printVariantId,
                  updates,
                })
              }
            />
          )}

          <PurchaseOptions
            digitalPrice={calculatePrice("Digital")}
            printPrice={calculatePrice("Print")}
            options={options}
            onToggle={(t) => setOptions((o) => ({ ...o, [t]: !o[t] }))}
            inCart={inCart}
            updateCart={(updates) =>
              updateCart({
                userId: user?.id || "",
                productId: product.id,
                printVariantId: "ADD",
                updates,
              })
            }
            updateCart2={(updates) => {
              // alert(options.digitalVariantId)
              updateCart({
                userId: user?.id || "",
                productId: product.id,
                digitalVariantId: "ADD",
                updates,
              });
            }}
          />

          {options.print && (
            <PrintCustomizer
              basePrice={product.price}
              formatMultiplier={1}
              sizeMultiplier={size.multiplier}
              imageSrc={product.imageUrl}
              setFrameAction={setFrame}
              frame={frame}
              setMaterialAction={setMaterial}
              material={material}
              materials={materials}
              frames={frames}
              inCart={inCart}
              updateCart={(updates) =>
                updateCart({
                  userId: user?.id || "",
                  productId: product.id,
                  printVariantId: options.printVariantId,
                  updates,
                })
              }
            />
          )}

          <CartActions
            inCart={inCart}
            loading={loading}
            onToggleCart={handleToggleCart}
            onCheckout={async () => {
              if (!isLoggedIn) {
                setModalOpen(true);
                return;
              }

              const productId = product.id;
              const productItem = {
                quantity: 1,
                myProduct: {
                  id: productId,
                  title: product.title,
                  price: parseFloat(
                    calculatePrice(options.digital ? "Digital" : "Print")
                  ),
                  imageUrl: product.imageUrl || "/placeholder.png",
                  digital: options.digital
                    ? {
                        id: options.digitalVariantId || "temp-digital-id", // fallback if not in cart yet
                        format,
                      }
                    : undefined,
                  print: options.print
                    ? {
                        id: options.printVariantId || "temp-print-id",
                        format,
                        size: size.label,
                        material: material?.label,
                        frame: frame?.label || "",
                      }
                    : undefined,
                },
              };

              try {
                const res = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    customerId: user?.id,
                    cartProductList: [productItem],
                  }),
                });

                const data = await res.json();

                if (!res.ok) {
                  throw new Error(
                    data.error || "Failed to create checkout session"
                  );
                }

                const stripe = await loadStripe(
                  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
                );

                if (!stripe) throw new Error("Stripe failed to load");

                await stripe.redirectToCheckout({ sessionId: data.sessionId });
              } catch (err: any) {
                console.error("Checkout error:", err);
                alert(err.message || "Checkout failed");
              }
            }}
            disabled={!options.digital && !options.print}
          />
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </>
  );
}
