// File: src/app/api/downloads/proxy/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";  // avoid static 404
export const revalidate = 0;

function sanitizeFilename(name: string) {
  // keep it simple and safe for Content-Disposition
  const base = name.replace(/[^\w.-]+/g, "_").slice(0, 120) || "download.bin";
  return base;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  const fileParam = req.nextUrl.searchParams.get("filename") || "download.bin";

  if (!urlParam) return new Response("Missing url", { status: 400 });

  // ✅ IMPORTANT: decode once to undo client encodeURIComponent
  let src: string;
  try {
    src = decodeURIComponent(urlParam);
  } catch {
    return new Response("Bad url encoding", { status: 400 });
  }

  // (Optional but recommended) SSRF allowlist
  // const allowed = new Set(["res.cloudinary.com", "storage.googleapis.com", "s3.amazonaws.com"]);
  // const host = new URL(src).hostname;
  // if (!allowed.has(host)) return new Response("Forbidden", { status: 403 });

  const upstream = await fetch(src, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    // bubble up the upstream status for easier debugging
    return new Response(`Upstream fetch failed (${upstream.status})`, { status: upstream.status });
  }

  const ct = upstream.headers.get("content-type") || "application/octet-stream";
  const len = upstream.headers.get("content-length") || undefined;
  const filename = sanitizeFilename(fileParam);

  return new Response(upstream.body, {
    headers: {
      "Content-Type": ct,
      ...(len ? { "Content-Length": len } : {}),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
