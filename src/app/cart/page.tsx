'use client'
import SEO from '@/components/SEO';
import Gallery from '@/components/store/Gallery';
import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext'; // assuming this gives you user.id
// import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast'; // optional but nice
import { loadStripe } from '@stripe/stripe-js';

export default function CartPage() {
  const { cart, loadingCart, totalPrice } = useCart();
  const { user } = useUser();

// Outside the component so it's only loaded once
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const handleCheckout = async () => {
  if (!user) {
    toast.error("You must be logged in to checkout.");
    return;
  }

  const stripe = await stripePromise;

  if (!stripe) {
    toast.error("Stripe failed to initialize.");
    return;
  }

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: user.id,
        cartProductList: cart.map((product) => ({
          quantity: product.quantity,
          myProduct: {
            id: product.productId,
            title: product.title,
            price: product.price,
            imageUrl: product.image || '/placeholder.png',
            digital: product.digital
              ? {
                  id: product.digital.id,
                  format: product.digital.format,
                }
              : undefined,
            print: product.print
              ? {
                  id: product.print.id,
                  format: product.print.format,
                  size: product.print.size,
                  material: product.print.material,
                  frame: product.print.frame,
                }
              : undefined,
          },
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Checkout failed');
    }

    const result = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (result.error) {
      toast.error(result.error.message || 'Redirect failed');
      console.error('Stripe redirect error:', result.error);
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to start checkout');
    console.error('Checkout error:', error);
  }
};

  if (loadingCart) {
    return <div className="text-center py-10">Loading your cart…</div>;
  }

  return (
    <>
      <SEO title="Your Cart" description="Review and manage items in your cart before checkout." />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Your Cart</h1>
        {cart.length === 0 ? (
          <p className="text-gray-600">Your cart is empty.</p>
        ) : (
          <>
            <Gallery
              products={cart}
              showBuyButton={false}
              showLikeButton={false}
              showViewSizeControls={false}
            />
            <div className="mt-10 flex justify-between items-center border-t pt-6">
              <span className="text-xl font-semibold text-gray-800">
                Total: ${totalPrice.toFixed(2)}
              </span>
              <button
                onClick={handleCheckout}
                className="bg-green-600 text-white px-6 py-2 rounded-full shadow hover:bg-green-700 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
