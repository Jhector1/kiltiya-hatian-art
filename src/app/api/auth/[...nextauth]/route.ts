// File: src/lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
