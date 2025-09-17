// src/app/admin/private/editor/page.tsx
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getProducts(q?: string) {
  const where: Prisma.ProductWhereInput | undefined = q
    ? {
        OR: [
          { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { category: { is: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
        ],
      }
    : undefined;

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true, assets: true },
    take: 50,
  });
}

type SPromise = Promise<Record<string, string | string[] | undefined>>;

export default async function Page({
  searchParams,
}: {
  searchParams?: SPromise;
}) {
  const sp = (await searchParams) ?? {};
  const qParam = sp.q;
  const q = (Array.isArray(qParam) ? qParam[0] : qParam)?.trim() || undefined;

  const products = await getProducts(q);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="inline-flex items-center px-3 py-2 rounded bg-black text-white">
          + New product
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title, description, or category…"
          className="w-full border rounded px-3 py-2"
        />
        <button className="px-3 py-2 rounded border">Search</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <article key={p.id} className="border rounded-lg p-4 space-y-3">
            <div className="aspect-video bg-neutral-100 overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumbnails?.[0] ?? p.svgPreview ?? ""}
                alt={p.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm text-neutral-500">{p.category?.name ?? "Uncategorized"}</div>
              <h2 className="font-medium">{p.title}</h2>
              <div className="text-sm text-neutral-600 line-clamp-2">{p.description}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>${p.price.toFixed(2)}</span>
              <div className="flex gap-2">
                <Link href={`/admin/products/${p.id}/edit`} className="px-2 py-1 rounded border">
                  Edit
                </Link>
                <form
                  action={`/api/admin/products/${p.id}`}
                  method="post"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const sure = prompt('Type DELETE to remove (keeps order history). For hard purge use "DELETE:HARD".');
                    if (sure !== "DELETE" && sure !== "DELETE:HARD") return;
                    const hard = sure === "DELETE:HARD" ? "?hard=1" : "";
                    fetch(`/api/admin/products/${p.id}${hard}`, { method: "DELETE" })
                      .then(async (r) => {
                        const d = await r.json().catch(() => ({}));
                        if (!r.ok || d?.ok === false) alert(d?.error || `Delete failed (${r.status})`);
                        else location.reload();
                      })
                      .catch((err) => alert(String(err)));
                  }}
                >
                  <button type="submit" className="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center text-neutral-500 py-20">No products yet.</div>
      )}
    </div>
  );
}
