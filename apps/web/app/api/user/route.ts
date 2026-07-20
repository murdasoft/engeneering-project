import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      company: true,
      position: true,
      bio: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, company, position, bio } = body;

  const user = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(position !== undefined && { position }),
      ...(bio !== undefined && { bio }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      company: true,
      position: true,
      bio: true,
      avatarUrl: true,
      role: true,
    },
  });

  return NextResponse.json({ user });
}
