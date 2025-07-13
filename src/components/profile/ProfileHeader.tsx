'use client';
import Image from 'next/image';

export default function ProfileHeader({ user }: { user: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div className="flex items-center gap-4">
        <Image src={user.avatar} alt="User Avatar" width={80} height={80} className="rounded-full" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
