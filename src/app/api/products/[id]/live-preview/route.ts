// File: src/app/api/products/[id]/live-preview/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

type StylePayload = {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
};

// Load SVG content, whether stored as raw SVG or a remote URL
async function loadSvgContent(svgOrUrl: string): Promise<string> {
  const trimmed = svgOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error('Failed to fetch remote SVG');
    return await res.text();
  }
  return svgOrUrl;
}

// Sanitize SVG and append watermark
function sanitizeAndWatermark(svg: string): string {
  const clean = sanitizeHtml(svg, {
    allowedTags: ['svg','g','path','rect','circle','text','defs','linearGradient','stop','polygon','line','ellipse'],
    allowedAttributes: {
      '*': ['x','y','width','height','viewBox','fill','stroke','d','points','gradientUnits','stop-color','offset','font-size','text-anchor','font-family','style']
    },
    allowedSchemes: [],
  });
  const $ = cheerio.load(clean, { xmlMode: true });
  const watermark = `<text x="50%" y="97%" text-anchor="middle" fill="rgba(0,0,0,0.05)" font-size="36" font-family="sans-serif" pointer-events="none">© ZileDigital</text>`;
  $('svg').append(watermark);
  return $.xml();
}

// Convert SVG string (with XML header) to PNG buffer
async function svgToPngBuffer(svg: string): Promise<Buffer> {
  const header = svg.trim().startsWith('<?xml')
    ? ''
    : '<?xml version="1.0" encoding="UTF-8"?>\n';
  const svgString = header + svg;
  return await sharp(Buffer.from(svgString, 'utf8'), { density: 96 })
    .png({ quality: 80 })
    .toBuffer();
}

/**
 * GET: initial PNG preview of the stored svgFormat
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { svgFormat: true },
  });
  if (!product?.svgFormat) {
    return NextResponse.json({ error: 'SVG not found' }, { status: 404 });
  }

  let rawSvg: string;
  try {
    rawSvg = await loadSvgContent(product.svgFormat);
  } catch (e) {
    console.error('Load SVG error:', e);
    return NextResponse.json({ error: 'Failed to load SVG' }, { status: 500 });
  }

  const prepped = sanitizeAndWatermark(rawSvg);
  try {
    const buffer = await svgToPngBuffer(prepped);
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Conversion error:', e);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}

/**
 * POST: apply style payload and return updated PNG preview
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let payload: StylePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { svgFormat: true },
  });
  if (!product?.svgFormat) {
    return NextResponse.json({ error: 'SVG not found' }, { status: 404 });
  }

  let rawSvg: string;
  try {
    rawSvg = await loadSvgContent(product.svgFormat);
  } catch (e) {
    console.error('Load SVG error:', e);
    return NextResponse.json({ error: 'Failed to load SVG' }, { status: 500 });
  }

  // Sanitize raw SVG
  const clean = sanitizeHtml(rawSvg, {
    allowedTags: ['svg','g','path','rect','circle','text','defs','linearGradient','stop','polygon','line','ellipse'],
    allowedAttributes: {
      '*': ['x','y','width','height','viewBox','fill','stroke','d','points','gradientUnits','stop-color','offset','font-size','text-anchor','font-family','style']
    },
    allowedSchemes: [],
  });

  const $ = cheerio.load(clean, { xmlMode: true });
  // Prepend background rect with data-bg so it isn't overridden
  $('svg').prepend(
    `<rect data-bg="true" x="0" y="0" width="100%" height="100%" fill="${payload.backgroundColor}"/>`
  );
  // Apply styles only to shape elements (skip data-bg rect and watermark text)
  $('svg')
    .find('path, circle, ellipse, polygon, polyline, line')
    .each((_, el) => {
      $(el).attr('fill', payload.fillColor);
      $(el).attr('stroke', payload.strokeColor);
      $(el).attr('stroke-width', payload.strokeWidth.toString());
    });
  // Append watermark (will be on top)
  const watermark = `<text x="50%" y="97%" text-anchor="middle" fill="rgba(0,0,0,0.05)" font-size="36" font-family="sans-serif" pointer-events="none">© ZileDigital</text>`;
  $('svg').append(watermark);

  const finalSvg = $.xml();
  try {
    const buffer = await svgToPngBuffer(finalSvg);
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Conversion error:', e);
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 });
  }
}
