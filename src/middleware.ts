// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/authenticate", req.url);

    // ✅ only keep the path + query, never full absolute URL
    const redirectPath = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set("callbackUrl", redirectPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


export const config = {
matcher: ["/profile/:path*", "/store/:path*/studio/:path*", "/favorites/:path*"]
};
