'use client';

import { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { User } from '@prisma/client';

export default function ProfileInfo({ user }: { user: Partial<User> }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    // 🔒 You can send this to your API here
    console.log('Saving...', formData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setFormData({ name: user.name, email: user.email });
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Profile Info</h3>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        {/* Username */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Username</span>
          {editMode ? (
            <input
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
            />
          ) : (
            <span className="text-gray-600">{user.name}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Email</span>
          {editMode ? (
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
            />
          ) : (
            <span className="text-gray-600">{user.email}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 text-green-600 font-medium hover:underline"
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 font-medium"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
