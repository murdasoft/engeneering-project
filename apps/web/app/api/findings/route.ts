import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const findings = await prisma.finding.findMany({
    where: {
      reviewStatus: status as any,
      analysis: { userId: (session.user as any).id },
    },
    orderBy: { createdAt: "desc" },
    include: {
      analysis: {
        select: {
          id: true,
          asset: { select: { filename: true, blobUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ findings });
}
