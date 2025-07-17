// File: src/app/(profile)/page.tsx
"use client";

import SEO from "@/components/SEO";
import ProfileHeader  from "@/components/profile/ProfileHeader";
import ProfileTabs    from "@/components/profile/ProfileTabs";
import ProfileInfo    from "@/components/profile/ProfileInfo";
import CollectionGallery from "@/components/profile/CollectionGallery";
import AccountSettings   from "@/components/profile/AccountSettings";
import Achievements      from "@/components/profile/Achievements";
import StatCard          from "@/components/profile/StatCard";

import {
  ArrowDownTrayIcon,
  HeartIcon,
  StarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

import { useState } from "react";
import { VariantType } from "@/types";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useUser } from "@/contexts/UserContext";
import { useDashboard } from "@/hooks/useDashboard";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [filter,    setFilter]    = useState<VariantType>("DIGITAL");
  const {user}=useUser();
  const { favorites }      = useFavorites();
  const { data, loading: dlLoading } = useDashboard();

  // purchased items (flattened) and orders placed
  const { data: grouped, loading: ordLoading, error } = useUserOrders(filter);
  const { data: allOrders } = useUserOrders("ALL");

  if (ordLoading || dlLoading) return <p>Loading your dashboard…</p>;
  if (error)                   return <p className="text-red-500">Error: {error.message}</p>;
  if (!grouped)                return <p>No purchases found.</p>;

  // derive metrics
  const purchasedArtworks = Object.values(grouped).flat().length;
  const ordersPlaced      = allOrders ? Object.keys(allOrders).length : 0;

  // placeholder profile info (you might fetch /api/auth/me instead)
  const profile = {
    name:        user?.name,
    email:       user?.email,
    avatar:      "/images/default_avatar.png",
    location:    "Port-au-Prince, Haiti",
    memberSince: user?.createdAt,
    achievements:[
      "First Purchase",
      "Top Collector",
      "Supporter of Haitian Artists",
    ],
  };

  // Collection items for “Collections” tab
  const items = Object.values(grouped).flat();

  return (
    <>
      <SEO title="Your Profile" description="Manage your account and collection." />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <ProfileHeader user={profile} />
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<HeartIcon className="h-6 w-6 text-red-500" />}
            value={favorites.size}
            label="Favorites"
          />
          <StatCard
            icon={<ArrowDownTrayIcon className="h-6 w-6 text-blue-500" />}
            value={data?.downloadCount||'0'}
            label="Downloads"
          />
          <StatCard
            icon={<StarIcon className="h-6 w-6 text-yellow-500" />}
            value={purchasedArtworks}
            label="Purchased Artworks"
          />
          <StatCard
            icon={<ShoppingBagIcon className="h-6 w-6 text-green-500" />}
            value={ordersPlaced}
            label="Orders Placed"
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "Profile" && (
            <>
              <Achievements ordersPlaced={ordersPlaced} />
              <ProfileInfo user={profile} />
            </>
          )}

          {activeTab === "Collections" && (
            <CollectionGallery items={items} filter={filter} setFilter={setFilter} />
          )}

          {activeTab === "Settings" && <AccountSettings />}
        </div>
      </div>
    </>
  );
}
