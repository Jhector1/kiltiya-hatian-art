'use client';
import Image from 'next/image';

export default function CollectionGallery({ items }: { items: any[] }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Purchased Art</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition">
            <Image src={item.image} alt={item.title} width={400} height={300} className="object-cover w-full h-56" />
            <div className="p-4">
              <h4 className="font-semibold text-gray-700">{item.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
