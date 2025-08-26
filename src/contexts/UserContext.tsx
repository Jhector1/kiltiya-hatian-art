"use client";

import React, { createContext, useContext } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { getOrCreateGuestId } from "@/utils/client-only/getOrCreateGuestId";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserContextType = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  guestId: string | null;
  login: () => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isLoggedIn: false,
  guestId: null,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <UserContextInner>{children}</UserContextInner>
    </SessionProvider>
  );
}

function UserContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const isLoggedIn = status === "authenticated";
  const user = (session?.user as User) ?? null;

  const guestId = !isLoggedIn ? getOrCreateGuestId() : null;

  const login = () => {
    const cb =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
    // NextAuth will route to pages.signIn
    signIn(undefined, { callbackUrl: cb });
  };
// in your UserProvider logout:
const logout = async () => {
  // Clear your own front-end cookies
  document.cookie = "guest_id=; max-age=0; path=/; SameSite=Lax";

  // Optional: nuke callback-url helpers if they exist
  document.cookie = "next-auth.callback-url=; max-age=0; path=/";
  document.cookie = "__Secure-next-auth.callback-url=; max-age=0; path=/";

  // Now let NextAuth clear its httpOnly cookies
await fetch("/api/auth/clear", { method: "POST" });
await signOut({ redirect: true, callbackUrl: "/" });
};


  return (
    <UserContext.Provider value={{ user, loading, isLoggedIn, guestId, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
