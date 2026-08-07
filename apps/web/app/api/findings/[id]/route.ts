import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.finding.findFirst({
    where: {
      id: params.id,
      analysis: { userId: (session.user as any).id },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  const body = await req.json();
  const { reviewStatus, reviewerNote } = body;

  const finding = await prisma.finding.update({
    where: { id: params.id },
    data: {
      reviewStatus: reviewStatus as any,
      reviewerNote: reviewerNote ?? undefined,
    },
  });

  return NextResponse.json({ finding });
}
