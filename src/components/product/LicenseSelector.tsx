'use client';
import { PriceOptionsProps } from '@/hooks/usePriceCalculator';
import { CartSelectedItem, CartUpdates, LicenseOption } from '@/types';
import React from 'react';

export default function LicenseSelector({
  onSelect,
  selected,
  licenses,
  updateCart,
  inCart,
  calculatePrice,
}: {
  onSelect:React.Dispatch<React.SetStateAction<LicenseOption>>;
  selected: LicenseOption;
  licenses: LicenseOption[];
  updateCart: (updates: CartUpdates) => void;
  inCart: CartSelectedItem | null;
  calculatePrice: (
    type: 'Digital' | 'Print',
    eraser?: 'material' | 'frame' | 'size' | 'license' | '',
    newMultiplier?: number
  ) => PriceOptionsProps;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Choose License</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {licenses.map((license) => (
          <button
            type="button"
            key={license.type}
            onClick={() => {
              onSelect(license);
              if (inCart) {
                updateCart({
                  license: license.type,
                  price: String(
                    Number(calculatePrice('Print').printPrice) +
                    Number(calculatePrice('Digital', 'license', license.price).digitalPrice)
                  ),
                });
              }
            }}
            className={[
              'text-left rounded-xl border-2 p-4 transition-all',
              selected.type === license.type
                ? 'border-black shadow-md bg-gray-50'
                : 'border-gray-200 hover:border-gray-400',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-medium text-gray-900">{license.name}</h4>
              <span className="text-sm font-semibold text-gray-600">
                {license.type === 'personal' ? 'FREE' : `$${license.price}`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{license.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
