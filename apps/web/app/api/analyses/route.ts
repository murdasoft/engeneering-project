import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analyses = await prisma.analysis.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: {
      asset: { select: { filename: true, blobUrl: true } },
      _count: { select: { findings: true } },
    },
  });

  return NextResponse.json({ analyses });
}
