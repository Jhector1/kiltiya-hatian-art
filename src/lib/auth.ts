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




// File: src/lib/auth.ts
import{ NextAuthOptions } from "next-auth";
import CredentialsProvider          from "next-auth/providers/credentials";
import { PrismaClient }             from "@prisma/client";
import { verifyPassword } from "@/lib/password";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "text"     },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        console.log("[Auth] authorize() called for:", creds?.email);
        if (!creds?.email || !creds?.password) {
          console.log("[Auth] Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user) {
          console.log("[Auth] No user found for:", creds.email);
          return null;
        }

        const isValid = await verifyPassword(creds.password, user.password);
        console.log("[Auth] password valid?", isValid);
        if (!isValid) {
          console.log("[Auth] Invalid password for:", creds.email);
          return null;
        }

        // success
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    jwt:     ({ token, user }) => (user ? { ...token, ...user } : token),
    session: ({ session, token }) => ({ ...session, user: token }),
  },

  pages: {
    signIn: "/login",
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // This is critical to sign/verify the JWT
  secret: process.env.NEXTAUTH_SECRET,
};