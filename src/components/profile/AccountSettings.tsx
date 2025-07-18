'use client';
import { KeyIcon } from '@heroicons/react/24/outline';

export default function AccountSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Account Settings</h3>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" className="mt-1 w-full border-gray-300 rounded-md shadow-sm" />
          </div>
          <button
            type="submit"
            className="bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <KeyIcon className="h-4 w-4 inline mr-1" />
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
