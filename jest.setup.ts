// jest.setup.ts

// --- Minimal env your routes expect ---
process.env.NEXT_PUBLIC_CLIENT_URL ??= 'https://client.example';
process.env.NEXT_STRIPE_WEBHOOK_SECRET ??= 'whsec_test';

// --- Web API polyfills via undici (ESM, no require) ---
import { TextEncoder, TextDecoder } from 'util';
import * as undici from 'undici';

(globalThis as any).TextEncoder ??= TextEncoder as any;
(globalThis as any).TextDecoder ??= TextDecoder as any;

const { fetch, Headers, Request, Response, FormData, File, Blob } = undici as unknown as {
  fetch: typeof globalThis.fetch;
  Headers: typeof globalThis.Headers;
  Request: typeof globalThis.Request;
  Response: typeof globalThis.Response;
  FormData: typeof globalThis.FormData;
  File: typeof globalThis.File;
  Blob: typeof globalThis.Blob;
};

(globalThis as any).fetch ??= fetch;
(globalThis as any).Headers ??= Headers;
(globalThis as any).Request ??= Request;
(globalThis as any).Response ??= Response;
(globalThis as any).FormData ??= FormData;
(globalThis as any).File ??= File;
(globalThis as any).Blob ??= Blob;

// --- Quiet noisy logs during passing tests ---
const _originalError = console.error;
console.error = (...args: any[]) => {
  const suppress = ['[CHECKOUT_ERROR]', 'Webhook signature verification failed'];
  if (suppress.some((frag) => String(args[0]).includes(frag))) return;
  _originalError(...args);
};
