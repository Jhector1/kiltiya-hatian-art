// File: src/components/profile/ProfileTabs.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = "Profile" | "Collections" | "Settings";

export default function ProfileTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}) {
  const tabs: Tab[] = ["Profile", "Collections", "Settings"];
  const slug = (t: Tab) =>
    ({ Profile: "profile", Collections: "collections", Settings: "settings" }[
      t
    ]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // preserve existing query params except `tab`
  const baseQP = new URLSearchParams(searchParams?.toString());
  baseQP.delete("tab");
  const base = baseQP.toString();
  const withTab = (t: Tab) =>
    `${pathname}?tab=${slug(t)}${base ? `&${base}` : ""}`;

  return (
    <nav className="inline-flex gap-3 rounded-xl bg-white/40 p-1">
      {tabs.map((tab) => {
        const selected = tab === activeTab;
        return (
          <Link
            key={tab}
            href={withTab(tab)}
            // remove `replace` if you want back/forward history entries
            replace
            scroll={false}
            onClick={() => setActiveTab(tab)}
            className={[
              "px-4 py-2 rounded-lg text-sm transition",
              selected ? "bg-black text-white" : "hover:bg-black/5",
            ].join(" ")}
            aria-current={selected ? "page" : undefined}
          >
            {tab}
          </Link>
        );
      })}
    </nav>
  );
}
