'use client';

import Image from 'next/image';
import { CollectionItem, VariantType } from '@/types';
import { useRouter } from 'next/navigation';

interface CollectionGalleryProps {
  items: CollectionItem[];
  filter: VariantType;
  setFilter: (f: VariantType) => void;
}

export default function CollectionGallery({ items, filter, setFilter }: CollectionGalleryProps) {
  const router = useRouter();

  // Apply filter
  const filtered = items.filter(item =>
    filter === 'ALL' ? true : item.type === filter
  );

  // Group by purchase date
  const grouped = filtered.reduce<Record<string, CollectionItem[]>>((acc, item) => {
    const dateKey = item.order.placedAt.split('T')[0];
    (acc[dateKey] ||= []).push(item);
    return acc;
  }, {});

  const entries = Object.entries(grouped);
  const tabs: VariantType[] = ['ALL', 'DIGITAL', 'PRINT'];

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
          Your Purchased Art
        </h3>
        <div className="flex space-x-3">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={
                `px-5 py-2 rounded-full font-medium transition ` +
                (filter === tab
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-gray-500">No items to display.</p>
      ) : (
        entries.map(([date, group]) => (
          <section key={date} className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              {new Date(date).toLocaleDateString()}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.map(item => {
                const imgUrl =
                  item.type === 'DIGITAL'
                    ? item.digitalVariant?.url
                    : item.printVariant?.url;
                const fallback = item.product.thumbnails[0];
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/cart/checkout/success?session_id=${item.order.stripeSessionId}`
                      )
                    }
                    className="group bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition cursor-pointer"
                  >
                    <div className="relative h-56 w-full">
                      <Image
                        src={imgUrl ?? fallback}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h5 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                        {item.product.title}
                      </h5>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
