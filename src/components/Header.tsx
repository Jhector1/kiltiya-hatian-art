"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartIcon,
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
// import UserMenu from './UserMenu';
import { useUser } from "@/contexts/UserContext";
import UserMenu from "./UserMenu";
import { useCart } from "@/contexts/CartContext";
import UniversalModal from "./modal/UniversalModal";
import AuthenticationForm from "./authenticate/AuthenticationFom";
import { useFavorites } from "@/contexts/FavoriteContext";

// Reusable navigation links
const navLinks = [
  { label: "Home", href: "/" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// Icon action props
interface IconActionProps {
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  count?: number;
  badgeColor?: string;
}

function IconAction({
  href,
  Icon,
  count = 0,
  badgeColor = "bg-blue-600",
}: IconActionProps) {
  return (
    <Link href={href} className="relative text-gray-600 hover:text-current">
      <Icon className="h-6 w-6" />
      {count > 0 && (
        <span
          className={`absolute -top-2 -right-2 ${badgeColor} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden md:flex space-x-8">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-gray-700 hover:text-black"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNav({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="md:hidden px-4 pb-4 space-y-2">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block text-gray-700 hover:text-black"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

import { signOut } from "next-auth/react";          // ← import this


// ...IconAction, DesktopNav, MobileNav as before...

export default function Header() {
  useEffect(() => {
  const handleContextMenu = (e: MouseEvent) => e.preventDefault();
  document.addEventListener("contextmenu", handleContextMenu);
  return () => {
    document.removeEventListener("contextmenu", handleContextMenu);
  };
}, []);

  const { user, loading, isLoggedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart } = useCart();
  const { favorites } = useFavorites();
  const [isModalOpen, setModalOpen] = useState(false);

  const likeCount = favorites.size;
  const cartCount = cart.length;

  if (loading) return null;

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <UniversalModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <AuthenticationForm closeModalAction={() => setModalOpen(false)} />
      </UniversalModal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          <span>Zile</span><span>Digital</span>
        </Link>

        <DesktopNav />

        <div className="flex items-center space-x-4">
          <IconAction
            href="/favorites"
            Icon={HeartIcon}
            count={likeCount}
            badgeColor="bg-red-500"
          />
          <IconAction
            href="/cart"
            Icon={ShoppingCartIcon}
            count={cartCount}
            badgeColor="bg-blue-600"
          />

          {isLoggedIn ? (
            <UserMenu
              userName={user?.name || "User"}
              userImage="/placeholder.png"
              userEmail={user?.email || ""}
              userRole="Pro User"
              menuItems={[
                { label: "Dashboard", href: "/profile" },
                { label: "Settings", href: "/settings" },
                { label: "Earnings", href: "/earnings" },
                // add a logout entry here:
                // { label: "Sign Out", href: "#" },
              ]}
              onSignOut={() => {
                // ← replace localStorage hack with NextAuth signOut
                signOut({ callbackUrl: "/" });
              }}
            />
          ) : (
            <button
              className="text-gray-600 hover:text-gray-800"
              onClick={() => setModalOpen(true)}
            >
              <UserCircleIcon className="h-7 w-7" />
            </button>
          )}

          <button
            className="md:hidden text-gray-800"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} />
    </header>
  );
}
