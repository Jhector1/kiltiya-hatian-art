// File: src/lib/api/auth.ts

import { AuthResponse, Credentials, SignupData } from "@/types";



const API_BASE = '/api/auth';

/**
 * Generic request helper for auth endpoints
 */
async function authRequest<T>(
  path: string,
  data: object
): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }
  return payload as T;
}

/**
 * Sign up a new user
 */
export function signup(data: SignupData): Promise<AuthResponse> {
  return authRequest<AuthResponse>('signup', data);
}

/**
 * Log in an existing user
 */
export function login(data: Credentials): Promise<AuthResponse> {
  return authRequest<AuthResponse>('login', data);
}

/**
 * Log out user (client-side)
 */
export function logout(): void {
  localStorage.removeItem('token');
  // Optionally notify server or clear cookies
}
