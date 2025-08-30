import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

const firstNonEmpty = (...vals: Array<string | null | undefined>) => {
  for (const v of vals) {
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return undefined;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: { id: true, email: true, password: true, name: true },
        });
        if (!user) return null;

        const ok = await compare(creds.password, user.password);
        if (!ok) return null;

        // No mixing of ?? and || — use helper
        const fallbackName = firstNonEmpty(
          user.name,
          user.email?.split("@")[0],
          "User"
        )!;

        return { id: String(user.id), email: user.email, name: fallbackName };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = String((user as any).id ?? token.sub ?? "");
        token.email = user.email ?? token.email;

        const nameFromEmail = token.email
          ? String(token.email).split("@")[0]
          : undefined;

        token.name = firstNonEmpty(
          user.name,
          token.name as string | undefined,
          nameFromEmail,
          "User"
        );
        return token;
      }

      if (trigger === "update" && session?.user) {
        const nameFromEmail = token.email
          ? String(token.email).split("@")[0]
          : undefined;
        token.name = firstNonEmpty(
          session.user.name,
          token.name as string | undefined,
          nameFromEmail,
          "User"
        );
        return token;
      }

      if (!token.name) {
        const nameFromEmail = token.email
          ? String(token.email).split("@")[0]
          : undefined;
        token.name = firstNonEmpty(
          token.name as string | undefined,
          nameFromEmail,
          "User"
        );
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = String(token.id ?? token.sub ?? "");
        session.user.email =
          (token.email as string) ?? session.user.email ?? "";

        const sessNameFromEmail = session.user.email
          ? session.user.email.split("@")[0]
          : undefined;

        session.user.name = firstNonEmpty(
          token.name as string | undefined,
          session.user.name,
          sessNameFromEmail,
          "User"
        ) as string;
      }
      return session;
    },
  },
  pages: { signIn: "/authenticate" },
  secret: process.env.NEXTAUTH_SECRET,
};
