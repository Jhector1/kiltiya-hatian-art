// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
      const loginUrl = new URL("/authenticate", req.url);
  loginUrl.searchParams.set("callbackUrl", req.url); // preserve original page
  return NextResponse.redirect(loginUrl);
    // return NextResponse.redirect(new URL("/authenticate", req.url));
  }
  return NextResponse.next();
}

export const config = {
matcher: ["/profile/:path*", "/store/:path*/studio/:path*", "/favorites/:path*"]
};
