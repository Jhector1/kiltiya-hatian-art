// File: src/lib/api/auth.ts
import { signIn, signOut, SignOutResponse } from "next-auth/react";
import { SignupData }      from "@/types";

const API_BASE = "/api/auth";


export async function signup(data: SignupData): Promise<void> {
  const res = await fetch(`${API_BASE}/signup`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || "Signup failed");

  const result = await signIn("credentials", {
    redirect: false,
    email:    data.email,
    password: data.password,
  });
  if (!result || result.error) {
    throw new Error(result?.error || "Automatic login failed");
  }
}

export async function login(credentials: { email: string; password: string; }): Promise<void> {
  const result = await signIn("credentials", {
    redirect: false,
    email:    credentials.email,
    password: credentials.password,
  });
  if (!result || result.error) {
    throw new Error(result?.error || "Login failed");
  }
}

/**
 * Log out the current user.
 * Returns the signOut response (so you can inspect or await navigation).
 */
export function logout(): Promise<SignOutResponse> {
  return signOut({ redirect: false });
}

