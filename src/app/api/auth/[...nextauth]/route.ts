import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ Correct route file usage
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
