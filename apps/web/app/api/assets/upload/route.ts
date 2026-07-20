import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: "File and projectId are required" }, { status: 400 });
  }

  const blob = await put(`inspectai/${projectId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const asset = await prisma.asset.create({
    data: {
      filename: file.name,
      blobUrl: blob.url,
      fileSize: file.size,
      mimeType: file.type,
      projectId,
    },
  });

  return NextResponse.json({ asset });
}
