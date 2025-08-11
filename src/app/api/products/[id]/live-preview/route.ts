import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import * as cheerio from "cheerio";
import { sanitizeDefs, sanitizeSvg } from "@/lib/sanitizeSvg";
import { addStaticWatermarkFullWidth, finalizeSvgNamespacesAndHrefs } from "@/lib/getSvgDims";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // needed for fs access in lib

type StylePayload = {
  fillColor: string;            // "#fff" | "none" | "url(#...)"
  fillOpacity?: number;         // 0..1
  strokeColor: string;          // "#111" | "none" | "url(#...)"
  strokeOpacity?: number;       // 0..1
  strokeWidth: number;
  backgroundColor: string;      // "#fff" | "none" | "url(#...)"
  backgroundOpacity?: number;   // 0..1
  defs?: string;                // raw <defs> fragment (gradients/patterns/etc)
};

async function loadSvgContent(svgOrUrl: string): Promise<string> {
  const trimmed = svgOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error("Failed to fetch remote SVG");
    return await res.text();
  }
  return svgOrUrl;
}

async function svgToPngBuffer(svg: string): Promise<Buffer> {
  const header = svg.trim().startsWith("<?xml")
    ? ""
    : '<?xml version="1.0" encoding="UTF-8"?>\n';
  const svgString = header + svg;
  return await sharp(Buffer.from(svgString, "utf8"), { density: 96 })
    .png({ quality: 80 })
    .toBuffer();
}

/* -------------------- GET: initial PNG preview -------------------- */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { svgFormat: true },
  });
  if (!product?.svgFormat) {
    return NextResponse.json({ error: "SVG not found" }, { status: 404 });
  }

  try {
    const rawSvg = await loadSvgContent(product.svgFormat);

    // 1) sanitize base art
    const clean = sanitizeSvg(rawSvg);

    // 2) add full-width watermark (from public/watermark.svg or env URL)
    let withWm = clean;
    try {
      withWm = await addStaticWatermarkFullWidth(clean, {
        position: "bottom",
        margin: 24,
        opacity: 0.12,
      });
    } catch (e) {
      console.warn("WM skipped:", (e as Error).message);
    }

    // 3) finalize namespaces/hrefs
    const finalSvg = finalizeSvgNamespacesAndHrefs(withWm);

    // optional: debug
    // console.debug("WM_PRESENT", finalSvg.includes('data-watermark="true"'));

    // 4) rasterize
    const buffer = await svgToPngBuffer(finalSvg);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("Conversion error:", e);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}

/* -------------------- POST: styled live preview -------------------- */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let payload: StylePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { svgFormat: true },
  });
  if (!product?.svgFormat) {
    return NextResponse.json({ error: "SVG not found" }, { status: 404 });
  }

  try {
    const rawSvg = await loadSvgContent(product.svgFormat);

    // sanitize base art (keeps structure)
    const clean = sanitizeSvg(rawSvg);
    const $ = cheerio.load(clean, { xmlMode: true });
    const $svg = $("svg").first();

    // namespaces for in-doc operations
    if (!$svg.attr("xmlns")) $svg.attr("xmlns", "http://www.w3.org/2000/svg");
    if (!$svg.attr("xmlns:xlink")) $svg.attr("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // inject sanitized <defs> from client
    let $defs = $("svg > defs").first();
    if (payload.defs && payload.defs.trim()) {
      const defsClean = sanitizeDefs(payload.defs);
      if (!$defs.length) {
        $svg.prepend("<defs/>");
        $defs = $("svg > defs").first();
      }
      const defsFrag = cheerio.load(defsClean, { xmlMode: true });
      $defs.append(
        defsFrag("defs").length
          ? defsFrag("defs").children()
          : defsFrag.root().children()
      );
    }

    // background management (supports "none" + opacity)
    const wantsTransparentBg =
      payload.backgroundColor === "none" ||
      (payload.backgroundOpacity != null && payload.backgroundOpacity <= 0);

    const $existingBg = $('svg [data-bg="true"]').first();

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    if (wantsTransparentBg) {
      if ($existingBg.length) $existingBg.remove();
    } else {
      const bgAlpha =
        payload.backgroundOpacity != null ? clamp01(payload.backgroundOpacity) : undefined;

      if ($existingBg.length) {
        $existingBg.attr("fill", payload.backgroundColor);
        if (bgAlpha != null) $existingBg.attr("fill-opacity", String(bgAlpha));
        else $existingBg.removeAttr("fill-opacity");
      } else {
        const attrs = [
          `data-bg="true"`,
          `x="0"`, `y="0"`,
          `width="100%"`, `height="100%"`,
          `fill="${payload.backgroundColor}"`,
          ...(bgAlpha != null ? [`fill-opacity="${bgAlpha}"`] : []),
        ].join(" ");
        const rect = `<rect ${attrs}/>`;
        const $defsNow = $("svg > defs").first();
        if ($defsNow.length) $defsNow.after(rect);
        else $svg.prepend(rect);
      }
    }

    // apply fill/stroke + per-paint opacity (skip bg rect)
    $svg
      .find("path, circle, ellipse, polygon, polyline, line, rect:not([data-bg])")
      .each((_, el) => {
        const $el = $(el);
        $el.attr("fill", payload.fillColor);
        $el.attr("stroke", payload.strokeColor);
        $el.attr("stroke-width", String(payload.strokeWidth));

        if (payload.fillOpacity != null) $el.attr("fill-opacity", String(clamp01(payload.fillOpacity)));
        else $el.removeAttr("fill-opacity");

        if (payload.strokeOpacity != null) $el.attr("stroke-opacity", String(clamp01(payload.strokeOpacity)));
        else $el.removeAttr("stroke-opacity");
      });

    // watermark last (full width)
    let finalSvg = $.xml();
    try {
      finalSvg = await addStaticWatermarkFullWidth(finalSvg, {
        position: "bottom",
        margin: 24,
        opacity: 0.12,
      });
    } catch (e) {
      console.warn("WM skipped:", (e as Error).message);
    }

    // finalize + rasterize
    finalSvg = finalizeSvgNamespacesAndHrefs(finalSvg);
    // console.debug("WM_PRESENT", finalSvg.includes('data-watermark="true"'));
    const buffer = await svgToPngBuffer(finalSvg);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("Conversion error:", e);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
