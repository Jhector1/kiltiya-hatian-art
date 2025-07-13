// File: src/context/UserContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useCart } from './CartContext';

export type User = {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
};

export type UserContextType = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isLoggedIn: false,
  setUser: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const {refreshCart}= useCart();

  useEffect(() => {
    const token = localStorage.getItem('token');
    // console.log('token',token, user)
    if (!token) {
      setLoading(false);
      setIsLoggedIn(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
                console.log(res)

        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        // console.log(data)
                  // await refreshCart(); // 🔥 This will manually load the correct cart after login

        return data.user;
      })
      .then((u: User) => {
        // console.log(u, '000=====')
        setUser(u);
        
        setIsLoggedIn(true);
      })
      .catch(() => {
        setUser(null);
        setIsLoggedIn(false);
      })
      .finally(() => setLoading(false));

  }, [isLoggedIn]);

  return (
    <UserContext.Provider value={{ user, loading, isLoggedIn, setUser }}>
      {children}
    </UserContext.Provider>
  );
};