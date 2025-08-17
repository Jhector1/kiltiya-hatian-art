// app/api/products/[id]/live-preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { sanitizeSvg, sanitizeDefs } from "@/lib/sanitizeSvg";
import { addStaticWatermarkFullWidth, finalizeSvgNamespacesAndHrefs } from "@/lib/getSvgDims";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StylePayload = {
  fillColor: string;
  fillOpacity?: number;
  strokeColor: string;
  strokeOpacity?: number;
  strokeWidth: number;
  backgroundColor: string;
  backgroundOpacity?: number;
  defs?: string;
};

async function loadSvgContent(svgOrUrl: string): Promise<string> {
  const t = svgOrUrl.trim();
  if (/^https?:\/\//i.test(t)) {
    const res = await fetch(t);
    if (!res.ok) throw new Error("Failed to fetch remote SVG");
    return await res.text();
  }
  return svgOrUrl;
}

async function svgToPngBuffer(svg: string): Promise<Buffer> {
  const header = svg.trim().startsWith("<?xml") ? "" : '<?xml version="1.0" encoding="UTF-8"?>\n';
  const svgString = header + svg;
  return await sharp(Buffer.from(svgString, "utf8"), { density: 96 })
    .png({ quality: 80 })
    .toBuffer();
}

/* -------------------- GET: initial watermarked PNG -------------------- */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { svgFormat: true },
  });
  if (!product?.svgFormat) return NextResponse.json({ error: "SVG not found" }, { status: 404 });

  try {
    const raw = await loadSvgContent(product.svgFormat);
    const clean = sanitizeSvg(raw);

    let withWm = clean;
    try {
      withWm = await addStaticWatermarkFullWidth(clean, { position: "bottom", margin: 24, opacity: 0.12 });
    } catch {}

    const finalSvg = finalizeSvgNamespacesAndHrefs(withWm);
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

/* -------------------- POST: styled live preview (expects plain StylePayload) -------------------- */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let payload = {} as StylePayload;
  try {
    // EXACTLY what the old frontend sends: the StylePayload object itself
    payload = (await request.json()) as StylePayload;
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
    const raw = await loadSvgContent(product.svgFormat);
    const clean = sanitizeSvg(raw);

    const $ = cheerio.load(clean, { xmlMode: true });
    const $svg = $("svg").first();

    // namespaces
    if (!$svg.attr("xmlns")) $svg.attr("xmlns", "http://www.w3.org/2000/svg");
    if (!$svg.attr("xmlns:xlink")) $svg.attr("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // inject sanitized <defs>
    if (payload.defs && payload.defs.trim()) {
      let $defs = $("svg > defs").first();
      if (!$defs.length) {
        $svg.prepend("<defs/>");
        $defs = $("svg > defs").first();
      }
      const defsClean = sanitizeDefs(payload.defs);
      const frag = cheerio.load(defsClean, { xmlMode: true });
      $defs.append(frag("defs").length ? frag("defs").children() : frag.root().children());
    }

    // background rect
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
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
        Object.entries(attrs).forEach(([k, v]) => $bg.attr(k, v));
        if (payload.backgroundOpacity == null) $bg.removeAttr("fill-opacity");
      } else {
        const rect = `<rect ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")} />`;
        const $defsNow = $("svg > defs").first();
        if ($defsNow.length) $defsNow.after(rect);
        else $svg.prepend(rect);
      }
    }

    // fills/strokes (skip bg rect)
    $svg.find("path, circle, ellipse, polygon, polyline, line, rect:not([data-bg])").each((_, el) => {
      const $el = $(el);
      $el.attr("fill", payload.fillColor);
      $el.attr("stroke", payload.strokeColor);
      $el.attr("stroke-width", String(payload.strokeWidth));

      if (payload.fillOpacity != null) $el.attr("fill-opacity", String(clamp01(payload.fillOpacity)));
      else $el.removeAttr("fill-opacity");

      if (payload.strokeOpacity != null) $el.attr("stroke-opacity", String(clamp01(payload.strokeOpacity)));
      else $el.removeAttr("stroke-opacity");
    });

    // watermark + finalize
    let finalSvg = $.xml();
    try {
      finalSvg = await addStaticWatermarkFullWidth(finalSvg, { position: "bottom", margin: 24, opacity: 0.12 });
    } catch {}
    finalSvg = finalizeSvgNamespacesAndHrefs(finalSvg);

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
