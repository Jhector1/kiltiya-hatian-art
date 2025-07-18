/*
  CartActions component: components/CartActions.tsx
  Displays proper Add/Remove text, loading state, and dynamic styling
*/
'use client';
import { CartSelectedItem } from '@/types';
import React from 'react';

export default function CartActions({
  inCart,
  loading,
  onToggleCart,
  onCheckout,
    disabled,

}: {
  inCart: CartSelectedItem | null;
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
              ? 'bg-white-500 hover:bg-gray-100 text-purple-600 border-2 border-color-purple '
              : 'bg-white-600 hover:bg-gray-100 text-black'
          } ${loading || !inCart && disabled ? 'opacity-50 cursor-not-allowed' : ''}`
        }
      >
        {loading ? (inCart ? 'Removing...' : 'Adding...') : inCart ? 'Remove from Cart' : 'Add Selected to Cart'}
      </button>
      <button
      disabled={disabled}
        onClick={onCheckout}
        className={`bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-700 transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
