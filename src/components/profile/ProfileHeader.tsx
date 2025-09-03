

// ============================================================
// File: src/components/profile/ProfileHeader.tsx
// Polished header with avatar, meta, and soft background
// ============================================================
"use client";

import Image from "next/image";

export default function ProfileHeader({ user }: { user: any }) {
  return (
    <header className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <Image src={user.avatar} alt="User Avatar" fill className="rounded-full object-cover ring-4 ring-white shadow-sm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600 text-sm">{user.email}</p>
              {user.location && <p className="text-gray-500 text-sm">{user.location}</p>}
            </div>
          </div>

          {user.memberSince && (
            <div className="text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Member since</span> {new Date(user.memberSince).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

