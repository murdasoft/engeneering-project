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
