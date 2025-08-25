import { signIn } from "next-auth/react";

export async function login(credentials: { email: string; password: string }) {
  const result = await signIn("credentials", {
    redirect: false,
    email: credentials.email,
    password: credentials.password,
  });
  if (!result || result.error) throw new Error(result?.error || "Login failed");
}