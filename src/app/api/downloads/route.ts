import { NextResponse } from "next/server";
import { getServerSession }       from "next-auth/next";
import { PrismaClient }           from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST() {
  // 1) Read & verify the session cookie
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Increment only the signed-in user’s count
  const updated = await prisma.user.update({
    where:  { id: session.user.id },
    data:   { downloadCount: { increment: 1 } },
    select: { downloadCount: true },
  });
  

  return NextResponse.json({ downloadCount: updated.downloadCount });
}
