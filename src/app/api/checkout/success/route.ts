// File: src/app/api/user/downloads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }         from "next-auth/next";
import { PrismaClient }             from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // 1️⃣ Authenticate via NextAuth session cookie
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // 2️⃣ Read the session_id param
  const url       = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ digitalDownloads: [] });
  }

  // 3️⃣ Fetch the specific order by stripeSessionId
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      items: {
        where: { type: "DIGITAL" },
        include: { product: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ digitalDownloads: [] });
  }

  // 4️⃣ Map each digital item’s formats into download entries
  const digitalDownloads = order.items.flatMap(item =>
    item.product?.formats.map(url => {
      const ext = url.split(".").pop()!;
      return {
        id:          `${item.id}-${ext}`,
        title:       item.product?.title,
        format:      ext,
        downloadUrl: url,
      };
    })
  );

  return NextResponse.json({ digitalDownloads });
}
