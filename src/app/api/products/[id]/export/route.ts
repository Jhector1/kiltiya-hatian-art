import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { sanitizeDefs, sanitizeSvg } from "@/lib/sanitizeSvg";
import { getCustomerIdFromRequest } from "@/utils/guest";

export const dynamic = "force-dynamic";

// ---------- helpers ----------
async function loadSvgContent(svgOrUrl: string): Promise<string> {
  const trimmed = svgOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error("Failed to fetch remote SVG");
    return await res.text();
  }
  return svgOrUrl;
}

function applyStyles(
  svg: string,
  payload: {
    fillColor: string;
    fillOpacity?: number;
    strokeColor: string;
    strokeOpacity?: number;
    strokeWidth: number;
    backgroundColor: string;
    backgroundOpacity?: number;
    includeWatermark?: boolean;
    defs?: string;
  }
) {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const clean = sanitizeSvg(svg);
  const $ = cheerio.load(clean, { xmlMode: true });

  const $svg = $("svg").first();
  if (!$svg.attr("xmlns")) $svg.attr("xmlns", "http://www.w3.org/2000/svg");
  if (!$svg.attr("xmlns:xlink")) $svg.attr("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Inject sanitized <defs>
  let $defs = $("svg > defs").first();
  if (payload.defs && payload.defs.trim()) {
    const defsClean = sanitizeDefs(payload.defs);
    if (!$defs.length) {
      $svg.prepend("<defs/>");
      $defs = $("svg > defs").first();
    }
    const defsFrag = cheerio.load(defsClean, { xmlMode: true });
    $defs.append(defsFrag("defs").length ? defsFrag("defs").children() : defsFrag.root().children());
  }

  // Background rect management
  const wantsTransparentBg =
    payload.backgroundColor === "none" ||
    (payload.backgroundOpacity != null && payload.backgroundOpacity <= 0);

  const $bg = $('svg [data-bg="true"]').first();
  if (wantsTransparentBg) {
    if ($bg.length) $bg.remove();
  } else {
    const attrs: Record<string, string> = {
      "data-bg": "true",
      x: "0",
      y: "0",
      width: "100%",
      height: "100%",
      fill: payload.backgroundColor,
    };
    if (payload.backgroundOpacity != null) {
      attrs["fill-opacity"] = String(clamp01(payload.backgroundOpacity));
    }
    if ($bg.length) {
      $bg.attr(attrs);
      if (payload.backgroundOpacity == null) $bg.removeAttr("fill-opacity");
    } else {
      const rect = `<rect ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")} />`;
      const $defsNow = $("svg > defs").first();
      if ($defsNow.length) $defsNow.after(rect);
      else $svg.prepend(rect);
    }
  }

  // Apply paints + per-paint opacity (skip bg rect)
  $("path, circle, ellipse, polygon, polyline, line, rect:not([data-bg])").each((_, el) => {
    const $el = $(el);
    $el.attr("fill", payload.fillColor);
    $el.attr("stroke", payload.strokeColor);
    $el.attr("stroke-width", String(payload.strokeWidth));

    if (payload.fillOpacity != null) $el.attr("fill-opacity", String(clamp01(payload.fillOpacity)));
    else $el.removeAttr("fill-opacity");

    if (payload.strokeOpacity != null) $el.attr("stroke-opacity", String(clamp01(payload.strokeOpacity)));
    else $el.removeAttr("stroke-opacity");
  });

  if (payload.includeWatermark !== false) {
    $svg.append(
      `<text x="50%" y="97%" text-anchor="middle" fill="#000000" fill-opacity="0.05" font-size="36" font-family="sans-serif" pointer-events="none">© ZileDigital</text>`
    );
  }

  const xml = $.xml().trim();
  const header = xml.startsWith("<?xml") ? "" : `<?xml version="1.0" encoding="UTF-8"?>\n`;
  return header + xml;
}

function formatToMime(fmt: string): string {
  switch (fmt) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "tiff":
    case "tif": return "image/tiff";
    case "svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

async function rasterize(
  styledSvg: string,
  fmt: "png" | "jpg" | "webp" | "tiff",
  size?: { width?: number; height?: number },
  canvasBg?: string
) {
  let img = sharp(Buffer.from(styledSvg, "utf8"), { density: 300 });

  const isSolid = canvasBg && !/^url\(/.test(canvasBg);
  if (size?.width || size?.height) {
    img = img.resize(size.width, size.height, {
      fit: "contain",
      position: "centre", // sharp supports "centre"/"center"
      background: isSolid ? canvasBg! : "#0000",
    });
  }

  if (fmt === "jpg") {
    img = img.flatten({ background: isSolid ? canvasBg! : "#ffffff" });
    return await img.jpeg({ quality: 90 }).toBuffer();
  }
  if (fmt === "png")  return await img.png({ quality: 90 }).toBuffer();
  if (fmt === "webp") return await img.webp({ quality: 90 }).toBuffer();
  return await img.tiff({ compression: "lzw" }).toBuffer();
}

const MAX_SIDE = 10000;
const MAX_PIXELS = 64 * 1024 * 1024;

function getBaseSizeFromSvg(styledSvg: string) {
  const $ = cheerio.load(styledSvg, { xmlMode: true });
  const $svg = $("svg").first();
  const vb = $svg.attr("viewBox");
  if (vb) {
    const [, , w, h] = vb.trim().split(/[ ,]+/).map(Number);
    if (w > 0 && h > 0) return { w: Math.round(w), h: Math.round(h) };
  }
  const num = (s?: string) => (s ? Math.max(1, Math.round(parseFloat(s))) : undefined);
  const w = num($svg.attr("width"));
  const h = num($svg.attr("height"));
  if (w && h) return { w, h };
  return { w: 1024, h: 1024 };
}

function clampToBounds(w: number, h: number) {
  let W = Math.min(w, MAX_SIDE);
  let H = Math.min(h, MAX_SIDE);
  if (W * H > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (W * H));
    W = Math.max(1, Math.floor(W * scale));
    H = Math.max(1, Math.floor(H * scale));
  }
  return { width: W, height: H };
}

function resolveTargetSize(
  styledSvg: string,
  opts: { width?: number; height?: number; scale?: number; print?: { unit: "in" | "mm"; width: number; height: number; dpi: number } }
) {
  const base = getBaseSizeFromSvg(styledSvg);

  if (opts.width || opts.height) {
    const width  = opts.width  ? Math.max(1, Math.floor(opts.width))  : undefined;
    const height = opts.height ? Math.max(1, Math.floor(opts.height)) : undefined;
    return clampToBounds(width ?? base.w, height ?? base.h);
  }

  if (opts.print) {
    const toIn = (v: number) => (opts.print!.unit === "mm" ? v / 25.4 : v);
    const wPx = Math.round(toIn(opts.print.width)  * opts.print.dpi);
    const hPx = Math.round(toIn(opts.print.height) * opts.print.dpi);
    return clampToBounds(wPx, hPx);
  }

  if (opts.scale && opts.scale > 0) {
    const wPx = Math.round(base.w * opts.scale);
    const hPx = Math.round(base.h * opts.scale);
    return clampToBounds(wPx, hPx);
  }

  return clampToBounds(base.w, base.h);
}

// ---------- route ----------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // you must await params before using it
    const { id } = await params;

    // auth + export gate
    const { userId } = await getCustomerIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to export." }, { status: 401 });
    }

    const body = await req.json();
    const {
      style,
      format = "png",
      width,
      height,
      filename = `art-${id}-${Date.now()}.${format}`,
      includeWatermark = true,
      scale,
      print,
      // saveToLibrary // removed: no Cloudinary anymore
    }: {
      style: {
        fillColor: string;
        fillOpacity?: number;
        strokeColor: string;
        strokeOpacity?: number;
        strokeWidth: number;
        backgroundColor: string;
        backgroundOpacity?: number;
        defs?: string;
      };
      format: "png" | "jpg" | "webp" | "tiff" | "svg";
      width?: number;
      height?: number;
      filename?: string;
      includeWatermark?: boolean;
      scale?: number;
      print?: { unit: "in" | "mm"; width: number; height: number; dpi: number };
    } = body;

    // check quota for this user+product
    const design = await prisma.userDesign.findUnique({
      where: { userId_productId: { userId, productId: id } },
      select: { purchased: true, exportQuota: true, exportsUsed: true },
    });
    if (!design?.purchased) {
      return NextResponse.json({ error: "Purchase required to export." }, { status: 403 });
    }
    if (design.exportsUsed >= design.exportQuota) {
      return NextResponse.json({ error: "Export quota exceeded." }, { status: 403 });
    }

    // load + style svg
    const product = await prisma.product.findUnique({
      where: { id },
      select: { svgFormat: true },
    });
    if (!product?.svgFormat) {
      return NextResponse.json({ error: "SVG not found" }, { status: 404 });
    }

    const raw = await loadSvgContent(product.svgFormat);
    const styled = applyStyles(raw, { ...style, includeWatermark });

    // SVG branch (no storage; return file; count usage)
    if (format === "svg") {
      // increment quota BEFORE returning
      await prisma.userDesign.update({
        where: { userId_productId: { userId, productId: id } },
        data: { exportsUsed: { increment: 1 } },
      });

      return new NextResponse(styled, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Raster path
    const { width: frameW, height: frameH } = resolveTargetSize(styled, { width, height, scale, print });

    const isSolidBg =
      style.backgroundColor &&
      style.backgroundColor !== "none" &&
      !/^url\(/.test(style.backgroundColor);

    const canvasBgForRaster = isSolidBg ? style.backgroundColor : undefined;

    const buf = await rasterize(styled, format, { width: frameW, height: frameH }, canvasBgForRaster);

    // increment quota BEFORE returning
    await prisma.userDesign.update({
      where: { userId_productId: { userId, productId: id } },
      data: { exportsUsed: { increment: 1 } },
    });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": formatToMime(format),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("EXPORT_ERROR", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
