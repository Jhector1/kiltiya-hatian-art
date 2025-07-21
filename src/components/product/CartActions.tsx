'use client';
import { CartSelectedItem } from '@/types';
import React, { useState } from 'react';

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
  onCheckout: () => Promise<void>; // 🧠 make sure it's async
  disabled?: boolean;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckoutClick = async () => {
    setCheckoutLoading(true);
    try {
      await onCheckout(); // 👈 async logic lives in parent
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col sm:flex-row gap-4">
      <button
        onClick={onToggleCart}
        disabled={!inCart && disabled || loading}
        className={`font-semibold px-6 py-3 rounded-lg shadow transition ${
          inCart
            ? 'bg-white hover:bg-gray-100 text-purple-600 border-2 border-purple-600'
            : 'bg-white hover:bg-gray-100 text-black'
        } ${loading || (!inCart && disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (inCart ? 'Removing...' : 'Adding...') : inCart ? 'Remove from Cart' : 'Add Selected to Cart'}
      </button>

      <button
        disabled={disabled || checkoutLoading}
        onClick={handleCheckoutClick}
        className={`bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-700 transition ${
          disabled || checkoutLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
    </div>
  );
}
