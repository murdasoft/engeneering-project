import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { assets: true, reports: true },
      },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, siteId, objectType, address, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const userEmail = session?.user?.email ?? "";

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      id: userId,
      email: userEmail,
      name: session?.user?.name ?? null,
    },
  });

  const project = await prisma.project.create({
    data: {
      name,
      siteId,
      objectType,
      address,
      description,
      userId: user.id,
    },
  });

  return NextResponse.json({ project });
}
