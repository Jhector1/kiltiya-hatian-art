'use client';
import { AddOptions, CartSelectedItem, CartUpdates } from '@/types';
import React from 'react';

export default function PurchaseOptions({
  digitalPrice,
  printPrice,
  options,
  onToggle,
  updateCart,
  updateCart2,
  removeFromCart,
  removeFromCart2,
  inCart,
}: {
  digitalPrice: string;
  printPrice: string;
  options: AddOptions;
  onToggle: (key: 'digital' | 'print') => void;
  updateCart: (updates: CartUpdates) => void;
  updateCart2: (updates: CartUpdates) => void;
  removeFromCart: (updates: CartUpdates) => void;
  removeFromCart2: (updates: CartUpdates) => void;
  inCart: CartSelectedItem | null;
}) {
  return (
    <fieldset className="w-full">
      <legend className="block text-sm font-medium text-gray-700 mb-2">Purchase Options</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Digital */}
        <label className="cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={options.digital}
            onChange={() => {
              onToggle('digital');
              if (inCart) {
                if (options.digital) removeFromCart2({ price: printPrice });
                else updateCart2({ format: 'jpg', price: Number(digitalPrice) + Number(printPrice) });
              }
            }}
          />
          <div className="flex items-center justify-between px-4 py-3 border rounded-xl transition peer-checked:bg-purple-600 peer-checked:text-white border-gray-300">
            <span>Digital</span>
            <span className="font-medium">${digitalPrice}</span>
          </div>
        </label>

        {/* Print */}
        <label className="cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={options.print}
            onChange={() => {
              onToggle('print');
              if (inCart) {
                if (options.print) removeFromCart({ price: digitalPrice });
                else
                  updateCart({
                    format: 'jpg',
                    size: '11x14 in',
                    material: 'Matte Paper',
                    frame: null,
                    quantity: 1,
                    price: Number(digitalPrice) + Number(printPrice),
                  });
              }
            }}
          />
          <div className="flex items-center justify-between px-4 py-3 border rounded-xl transition peer-checked:bg-purple-600 peer-checked:text-white border-gray-300">
            <span>Print</span>
            <span className="font-medium">${printPrice}</span>
          </div>
        </label>
      </div>
    </fieldset>
  );
}
