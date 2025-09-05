// src/app/profile/ProfilePageClient.tsx
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
import type { VariantType } from "@/types";
import { useFavorites } from "@/contexts/FavoriteContext";
import { useUser } from "@/contexts/UserContext";

import {
  useUserOrdersData,
  selectFlat,
  selectFiltered,
  groupByDate,
  type OrdersFilter,
} from "@/hooks/useUserOrders";

import { computeStats } from "@/lib/achievements";
import type { CollectionItem as BaseItem } from "@/types";
import type { CollectionItem as GalleryItem } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";

export type Tab = "Profile" | "Collections" | "Settings";
const TAB_SLUG: Record<Tab, string> = {
  Profile: "profile",
  Collections: "collections",
  Settings: "settings",
} as const;
const fromSlug = (slug?: string): Tab =>
  slug === "collections"
    ? "Collections"
    : slug === "settings"
    ? "Settings"
    : "Profile";

function toGalleryItem(i: BaseItem): GalleryItem {
  const price =
    (i as any).price ??
    (i as any).unitPrice ??
    ((i as any).unitAmountCents ?? 0) / 100;
  const quantity = (i as any).quantity ?? (i as any).qty ?? 1;
  const previewUrl =
    (i as any).previewUrl ??
    (i as any).thumbnailUrl ??
    (i as any).imageUrl ??
    (i as any).product?.thumbnails?.[0] ??
    null;
  return { ...(i as any), price, quantity, previewUrl };
}

export default function ProfilePageClient({ initialTab }: { initialTab: Tab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<OrdersFilter>("DIGITAL");

  const { user } = useUser();
  const { favorites } = useFavorites();
  const { data: dashboard } = useDashboard();

  // Fetch once
  const { rawData, loading, error } = useUserOrdersData();

  // Derived views
  const allFlat = useMemo(() => selectFlat(rawData), [rawData]);
  const filteredFlat = useMemo(
    () => selectFiltered(allFlat, filter),
    [allFlat, filter]
  );
  const grouped = useMemo(() => groupByDate(filteredFlat), [filteredFlat]);

  // For gallery
  const baseItems: BaseItem[] = filteredFlat;
  const galleryItems: GalleryItem[] = useMemo(
    () => baseItems.map(toGalleryItem),
    [baseItems]
  );

  // Stats
  const stats = useMemo(() => computeStats(allFlat), [allFlat]);
  const purchasedArtworks = filteredFlat.length; // visible count in current tab/filter
  // after you have rawData and allFlat:
  const ordersPlaced = useMemo(() => {
    // try from embedded order ids on items
    const fromItems = new Set(
      allFlat.map((i: any) => i?.order?.id).filter(Boolean)
    ).size;

    // fallback: number of groups (if API groups by orderId or date)
    const fromGroups = Object.keys(rawData).length;

    return fromItems || fromGroups;
  }, [allFlat, rawData]);
  // URL ↔ tab sync
  useEffect(() => {
    const next = fromSlug((searchParams?.get("tab") || "").toLowerCase());
    if (next !== activeTab) setActiveTab(next);
  }, [searchParams, activeTab]);

  const onTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", TAB_SLUG[tab]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (loading) return <p className="px-4">Loading your dashboard…</p>;
  if (error) return <p className="px-4 text-red-500">Error: {error.message}</p>;
  if (!user)
    return <p className="px-4">Please sign in to view your profile.</p>;

  const profile = {
    name: user?.name,
    email: user?.email,
    avatar: "/images/default_avatar.png",
    location: "Port-au-Prince, Haiti",
    memberSince: user?.createdAt,
  };

  return (
    <>
      <SEO
        title="Your Profile"
        description="Manage your account and collection."
      />

      <div className="max-w-6xl mx-auto  py-10 space-y-10">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <ProfileHeader user={profile} />
          <ProfileTabs activeTab={activeTab} setActiveTab={onTabChange} />
        </div>

        {/* Stats */}
        <div className="flex gap-3 overflow-x-auto snap-x md:overflow-visible md:grid md:grid-cols-4 md:gap-4 -mx-2 px-2 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <StatCard
            icon={<HeartIcon className="h-6 w-6" />}
            value={favorites.size}
            label="Favorites"
          />
          <StatCard
            icon={<ArrowDownTrayIcon className="h-6 w-6" />}
            value={dashboard?.downloadCount ?? 0}
            label="Downloads"
          />{" "}
          <StatCard
            icon={<StarIcon className="h-6 w-6" />}
            value={purchasedArtworks}
            label="Purchased Artworks"
          />
          <StatCard
            icon={<ShoppingBagIcon className="h-6 w-6" />}
            value={ordersPlaced}
            label="Orders Placed"
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "Profile" && (
            <>
              {/* // ProfilePageClient.tsx
// You already compute stats via computeStats(allFlat) */}
              <Achievements
                metric="artworks" // primary track
                uniqueArtworks={stats.uniqueArtworks}
                ordersPlaced={stats.ordersPlaced} // optional, if you want to switch later
              />
              <ProfileInfo user={profile} />
            </>
          )}

          {activeTab === "Collections" && (
            <CollectionGallery
              // If CollectionGallery expects VariantType only,
              // you can constrain UI to 'DIGITAL' | 'PRINT' in this tab,
              // or widen its prop to accept 'ALL'.
              filter={filter as VariantType}
              setFilter={(val: VariantType) => setFilter(val as any)}
              items={galleryItems}
            />
          )}

          {activeTab === "Settings" && <AccountSettings />}
        </div>
      </div>
    </>
  );
}
