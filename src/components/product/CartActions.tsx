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
  onCheckout: () => Promise<void>;
  disabled?: boolean;
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckoutClick = async () => {
    setCheckoutLoading(true);
    try {
      await onCheckout();
    } finally {
      setCheckoutLoading(false);
    }
  };

  const addRemoveDisabled = (!!disabled && !inCart) || loading;

  return (
    <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <button
        onClick={onToggleCart}
        disabled={addRemoveDisabled}
        aria-disabled={addRemoveDisabled}
        className={[
          'w-full font-semibold px-5 py-3 rounded-xl shadow-sm transition',
          inCart
            ? 'bg-white hover:bg-gray-100 text-purple-600 border-2 border-purple-600'
            : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300',
          addRemoveDisabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {loading ? (inCart ? 'Removing…' : 'Adding…') : inCart ? 'Remove from Cart' : 'Add Selected to Cart'}
      </button>

      <button
        disabled={!!disabled || checkoutLoading}
        aria-busy={checkoutLoading}
        onClick={handleCheckoutClick}
        className={[
          'w-full bg-purple-600 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition',
          'hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
          (disabled || checkoutLoading) ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {checkoutLoading ? 'Processing…' : 'Proceed to Checkout'}
      </button>
    </div>
  );
}
