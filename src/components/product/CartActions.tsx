/*
  CartActions component: components/CartActions.tsx
  Displays proper Add/Remove text, loading state, and dynamic styling
*/
'use client';
import React from 'react';

export default function CartActions({
  inCart,
  loading,
  onToggleCart,
  onCheckout,
    disabled,

}: {
  inCart: boolean;
  loading: boolean;
  onToggleCart: () => void;
  onCheckout: () => void;
    disabled?: boolean; // 👈 add this line

}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={onToggleCart}
        disabled={!inCart && disabled || loading}
        className={
          `font-semibold px-6 py-3 rounded-lg shadow transition ${
            inCart
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } ${loading || !inCart && disabled ? 'opacity-50 cursor-not-allowed' : ''}`
        }
      >
        {loading ? (inCart ? 'Removing...' : 'Adding...') : inCart ? 'Remove from Cart' : 'Add Selected to Cart'}
      </button>
      <button
        onClick={onCheckout}
        className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
