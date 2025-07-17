// File: src/contexts/UserContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

export type User = {
  id:       string;
  email:    string;
  name?:    string;
  createdAt: string;
  updatedAt?: string;
  
};

export type UserContextType = {
  user:       User | null;
  loading:    boolean;
  isLoggedIn: boolean;
  // Optional helpers:
  login:      () => void;
  logout:     () => void;
};

const UserContext = createContext<UserContextType>({
  user:       null,
  loading:    true,
  isLoggedIn: false,
  login:      () => {},
  logout:     () => {},
});

export const useUser = () => useContext(UserContext);

/**
 * Wrap your app in <UserProvider> (inside app/layout.tsx)
 * so that `useUser()` works everywhere.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

/**
 * Internal provider that reads NextAuth’s session and exposes
 * a simpler `user` + `isLoggedIn` + `loading` API.
 */
export function UserContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading    = status === 'loading';
  const isLoggedIn = status === 'authenticated';
  const user       = session?.user as User | undefined;

  // Optional: you can extend the session callback to include `createdAt`
  // in `session.user` if you store that in your JWT.

  const login  = () => signIn('credentials'); // or open your modal
  const logout = () => signOut({ redirect: false });

  return (
    <UserContext.Provider value={{ user: user ?? null, loading, isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
