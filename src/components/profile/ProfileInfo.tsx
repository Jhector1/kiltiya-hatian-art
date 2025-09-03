// ============================================================
// File: src/components/profile/ProfileInfo.tsx
// Clean editable profile card
// ============================================================
"use client";

import { useState } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { User } from "@prisma/client";

export default function ProfileInfo({ user }: { user: Partial<User> & { location?: string } }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: user.name || "", email: user.email || "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    // TODO: send to API
    setEditMode(false);
  };

  const handleCancel = () => {
    setFormData({ name: user.name || "", email: user.email || "" });
    setEditMode(false);
  };

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Profile Info</h3>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 gap-5 max-w-2xl">
          {/* Username */}
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 shrink-0 w-36">Username</label>
            {editMode ? (
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <span className="text-gray-700">{user.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 shrink-0 w-36">Email</label>
            {editMode ? (
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <span className="text-gray-700">{user.email}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {editMode ? (
              <>
                <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                  <CheckIcon className="h-4 w-4" /> Save
                </button>
                <button onClick={handleCancel} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  <XMarkIcon className="h-4 w-4" /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
                <PencilIcon className="h-4 w-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

