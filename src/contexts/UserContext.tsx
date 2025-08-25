"use client";

import React, { createContext, useContext } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { getOrCreateGuestId } from "@/utils/client-only/getOrCreateGuestId";

export type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string;   // optional unless you add to session callback
  updatedAt?: string;   // optional unless you add to session callback
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

/**
 * Wrap your app in <UserProvider> (in app/layout.tsx) so useUser() works everywhere.
 * We include SessionProvider here and expose a simplified user state.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <UserContextInner>{children}</UserContextInner>
    </SessionProvider>
  );
}

/**
 * Internal provider that reads NextAuth’s session and exposes:
 * user, isLoggedIn, loading, guestId, login(), logout()
 */
function UserContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const isLoggedIn = status === "authenticated";
  const user = (session?.user as User) ?? null;

  // Generate/return a guestId only if not logged in
  const guestId = !isLoggedIn ? getOrCreateGuestId() : null;

  const login = () => {
    // Build a RELATIVE callbackUrl based on current location
    const cb = typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";
    // pages.signIn is "/authenticate", NextAuth will route to it
    // Passing undefined provider opens the signIn page
    signIn(undefined, { callbackUrl: cb });
  };

  const logout = () => {
    // If you prefer to land on home after logout:
    signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <UserContext.Provider
      value={{ user, loading, isLoggedIn, guestId, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}
