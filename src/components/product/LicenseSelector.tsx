'use client';
import Image from 'next/image';
import { PriceOptionsProps } from '@/hooks/usePriceCalculator';
import { CartSelectedItem, CartUpdates, LicenseOption } from '@/types';
import React from 'react';

const ICON_SRC: Record<string, string> = {
  personal:   '/license-icons/personal.png',
  commercial: '/icons/license-icons/commercial.png',
  extended:   '/icons/license-icons/extended.png',
};

export default function LicenseSelector({
  onSelect,
  selected,
  licenses,
  updateCart,
  inCart,
  calculatePrice,
}: {
  onSelect: React.Dispatch<React.SetStateAction<LicenseOption>>;
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
        {licenses.map((license) => {
          const isSelected = selected.type === license.type;

          return (
            <button
              type="button"
              key={license.type}
              aria-pressed={isSelected}
              onClick={() => {
                onSelect(license);

                if (inCart) {
                  const print = calculatePrice('Print');
                  const digital = calculatePrice('Digital', 'license', license.price);
                  updateCart({
                    license: license.type,
                    price: String(Number(print.printPrice) + Number(digital.digitalPrice)),
                  });
                }
              }}
              className={[
                'group text-left rounded-2xl border-2 p-4 transition-all',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/5',
                isSelected
                  ? 'border-black shadow-md bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="shrink-0 rounded-full ring-1 ring-black/10 p-1 bg-white/70">
                  <Image
                    src={ICON_SRC[license.type] ?? ICON_SRC.personal}
                    alt={`${license.name} icon`}
                    width={44}
                    height={44}
                    className="h-10 w-10 object-contain"
                    priority={false}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4
                      className="text-sm sm:text-base font-medium text-gray-900 truncate"
                      title={license.name}
                    >
                      {license.name}
                    </h4>
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {license.type === 'personal' ? 'FREE' : `$${license.price}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{license.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
