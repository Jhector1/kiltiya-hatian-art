import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma }      from "@prisma/client";
import { getCustomerIdFromRequest }  from "@/utils/guest";

const prisma = new PrismaClient(); // avoid dev hot-reload leak

export async function GET(req: NextRequest) {
  /* 1️⃣  Who’s making the call? */
  const { userId, guestId } = await getCustomerIdFromRequest(req);
  if (!userId && !guestId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  /* 2️⃣  Which Stripe session are we looking up? */
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ digitalDownloads: [] });
  }

  /* 3️⃣  Build OR clauses only for the IDs that exist */
  const orClauses: Prisma.OrderWhereInput[] = [
    ...(userId  ? [{ userId }]  : []),
    ...(guestId ? [{ guestId }] : []),
  ];

  /* 4️⃣  Fetch the order */
  const order = await prisma.order.findFirst({
    where: {
      stripeSessionId: sessionId,
      ...(orClauses.length ? { OR: orClauses } : {}), // omit OR if only one ID
    },
    include: {
      items: {
        where: { type: "DIGITAL" },
        include: { product: true, digitalVariant: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ digitalDownloads: [] });
  }

  /* 5️⃣  Build downloadable entries */
  const digitalDownloads = order.items.flatMap((item) =>
    (item.product?.formats ?? []).map((url) => {
      const ext = url.split(".").pop()!;
      return {
        id: `${item.id}-${ext}`,
        title: item.product?.title,
        format: ext,
        downloadUrl: url,
      };
    }),
  );

  return NextResponse.json({ digitalDownloads });
}
