'use client';

import { useState } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileInfo from '@/components/profile/ProfileInfo';
import CollectionGallery from '@/components/profile/CollectionGallery';
import AccountSettings from '@/components/profile/AccountSettings';
import Achievements from '@/components/product/Achievements';
import StatCard from '@/components/product/StatCard';
import {
  ArrowDownTrayIcon,
  HeartIcon,
  StarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import SEO from '@/components/SEO';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Profile');

  const user = {
    name: 'Jean Hector',
    email: 'jean@example.com',
    avatar: '/images/haitian-artists.jpg',
    location: 'Port-au-Prince, Haiti',
    memberSince: 'Jan 2024',
    totalSpent: '$1,240',
    downloads: 14,
    favorites: 7,
    collections: [
      { id: 1, title: 'Veve Spirit', image: '/icons/veve.jpg' },
      { id: 2, title: 'Mystic Sunset', image: '/icons/mango.png' },
      { id: 3, title: 'Haitian Rhythm', image: '/icons/drums.jpg' },
    ],
    achievements: ['First Purchase', 'Top Collector', 'Supporter of Haitian Artists'],
  };

  return (
    <>
      <SEO
        title="Haitian Digital Art Gallery"
        description="Buy and explore uniquely crafted Haitian vector artworks."
      />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <ProfileHeader user={user} />
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<HeartIcon className="h-6 w-6" />}
            value={user.favorites}
            label="Favorites"
          />
          <StatCard
            icon={<ArrowDownTrayIcon className="h-6 w-6" />}
            value={user.downloads}
            label="Downloads"
          />
          <StatCard
            icon={<StarIcon className="h-6 w-6" />}
            value={user.collections.length}
            label="Purchased Artworks"
          />
          <StatCard
            icon={<UserCircleIcon className="h-6 w-6" />}
            value={user.totalSpent}
            label="Total Spent"
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'Profile' && <Achievements achievements={user.achievements} />}
          {activeTab === 'Profile' && <ProfileInfo user={user} />}
          {activeTab === 'Collections' && <CollectionGallery items={user.collections} />}
          {activeTab === 'Settings' && <AccountSettings />}
        </div>
      </div>
    </>
  );
}
