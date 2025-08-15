"use client";

import SEO from "@/components/SEO";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileInfo from "@/components/profile/ProfileInfo";
import CollectionGallery from "@/components/profile/CollectionGallery";
import AccountSettings from "@/components/profile/AccountSettings";
import Achievements from "@/components/profile/Achievements";
import StatCard from "@/components/profile/StatCard";

import {
  ArrowDownTrayIcon,
  HeartIcon,
  StarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

import { useEffect, useMemo, useState } from "react";
import { VariantType } from "@/types";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useUser } from "@/contexts/UserContext";
import { useDashboard } from "@/hooks/useDashboard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Tab = "Profile" | "Collections" | "Settings";

const TAB_SLUG: Record<Tab, string> = {
  Profile: "profile",
  Collections: "collections",
  Settings: "settings",
};

const fromSlug = (slug?: string): Tab =>
  slug === "collections" ? "Collections" :
  slug === "settings"    ? "Settings"    : "Profile";

export default function ProfilePageClient({ initialTab }: { initialTab: Tab }) {
  // 1) Hooks (order must be stable on every render)
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<VariantType>("DIGITAL");

  const { user } = useUser();
  const { favorites } = useFavorites();
  const { data: dashboard, loading: dlLoading } = useDashboard();
  const { data: grouped, loading: ordLoading, error } = useUserOrders(filter);
  const { data: allOrders } = useUserOrders("ALL");

  // Keep state in sync with ?tab=... when user uses back/forward or manual edits
  useEffect(() => {
    const next = fromSlug((searchParams?.get("tab") || "").toLowerCase());
    if (next !== activeTab) setActiveTab(next);
  }, [searchParams, activeTab]);

  // Update the URL when the tab changes (preserve other query params)
  const onTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", TAB_SLUG[tab]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Safe items memo (runs every render; never after an early return)
  const items = useMemo(
    () => (grouped ? Object.values(grouped).flat() : []),
    [grouped]
  );

  // 2) Early returns (after all hooks)
  if (ordLoading || dlLoading) return <p>Loading your dashboard…</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;
  if (items.length === 0) return <p>No purchases found.</p>;

  // 3) Derived data
  const purchasedArtworks = items.length;
  const ordersPlaced = allOrders ? Object.keys(allOrders).length : 0;

  const profile = {
    name: user?.name,
    email: user?.email,
    avatar: "/images/default_avatar.png",
    location: "Port-au-Prince, Haiti",
    memberSince: user?.createdAt,
    achievements: ["First Purchase", "Top Collector", "Supporter of Haitian Artists"],
  };

  return (
    <>
      <SEO title="Your Profile" description="Manage your account and collection." />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <ProfileHeader user={profile} />
          <ProfileTabs activeTab={activeTab} setActiveTab={onTabChange} />
        </div>

{/* Stats */}
<div
  className="
    flex gap-3 overflow-x-auto snap-x
    md:overflow-visible md:grid md:grid-cols-4 md:gap-4
    -mx-2 px-2 md:mx-0 md:px-0
    [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
  "
>
  <StatCard icon={<HeartIcon className="h-6 w-6" />} value={favorites.size} label="Favorites" />
  <StatCard icon={<ArrowDownTrayIcon className="h-6 w-6" />} value={dashboard?.downloadCount ?? '0'} label="Downloads" />
  <StatCard icon={<StarIcon className="h-6 w-6" />} value={purchasedArtworks} label="Purchased Artworks" />
  <StatCard icon={<ShoppingBagIcon className="h-6 w-6" />} value={ordersPlaced} label="Orders Placed" />
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
