import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { createReportDocument } from "@/lib/pdf-report";

async function fetchImageAsDataUrl(blobUrl: string, mimeType: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(blobUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return null;
    const b64 = buffer.toString("base64");
    const type = mimeType && mimeType.includes("/") ? mimeType : "image/jpeg";
    return `data:${type};base64,${b64}`;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: (session.user as any).id,
    },
    include: {
      assets: {
        orderBy: { createdAt: "asc" },
        include: {
          analyses: {
            include: {
              findings: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    select: { name: true, email: true },
  });

  const allAnalyses = project.assets.flatMap((a) =>
    a.analyses.map((an) => ({
      ...an,
      asset: { filename: a.filename, blobUrl: a.blobUrl },
    }))
  );
  const allFindings = allAnalyses.flatMap((a) => a.findings);

  const stats = {
    totalAssets: project.assets.length,
    totalAnalyses: allAnalyses.length,
    totalFindings: allFindings.length,
    criticalCount: allFindings.filter((f) => f.severity === "CRITICAL").length,
    highCount: allFindings.filter((f) => f.severity === "HIGH").length,
    mediumCount: allFindings.filter((f) => f.severity === "MEDIUM").length,
    lowCount: allFindings.filter((f) => f.severity === "LOW").length,
    confirmedCount: allFindings.filter((f) => f.reviewStatus === "CONFIRMED").length,
    pendingCount: allFindings.filter((f) => f.reviewStatus === "PENDING").length,
    rejectedCount: allFindings.filter((f) => f.reviewStatus === "REJECTED").length,
  };

  const assetsWithDataUrls = await Promise.all(
    project.assets.map(async (a) => ({
      ...a,
      dataUrl: await fetchImageAsDataUrl(a.blobUrl, a.mimeType),
    }))
  );

  const reportData = {
    project: {
      name: project.name,
      siteId: project.siteId,
      objectType: project.objectType,
      address: project.address,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
    },
    user: {
      name: user?.name ?? null,
      email: user?.email ?? session.user!.email!,
    },
    assets: assetsWithDataUrls.map((a) => ({
      id: a.id,
      filename: a.filename,
      blobUrl: a.blobUrl,
      dataUrl: a.dataUrl,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      createdAt: a.createdAt,
    })),
    analyses: allAnalyses.map((a) => ({
      id: a.id,
      status: a.status,
      confidence: a.confidence,
      modelVersion: a.modelVersion,
      createdAt: a.createdAt,
      asset: a.asset,
      findings: a.findings.map((f) => ({
        id: f.id,
        className: f.className,
        confidence: f.confidence,
        severity: f.severity,
        reviewStatus: f.reviewStatus,
        widthMm: f.widthMm,
        heightMm: f.heightMm,
        areaMm2: f.areaMm2,
        reviewerNote: f.reviewerNote,
      })),
    })),
    stats,
  };

  const reportTitle = `Inspection Report — ${project.name}`;
  const summary = `${stats.totalFindings} defects found (${stats.criticalCount} critical, ${stats.highCount} high) across ${stats.totalAssets} photos.`;

  let pdfBuffer: Buffer;
  try {
    const doc = createReportDocument(reportData);
    pdfBuffer = await renderToBuffer(doc);
  } catch (e: any) {
    console.error("[report:generate] PDF render failed:", e);
    return NextResponse.json(
      { error: "Failed to render PDF", detail: e?.message || "Unknown error" },
      { status: 500 }
    );
  }

  await prisma.report.create({
    data: {
      title: reportTitle,
      summary,
      projectId: project.id,
    },
  });

  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="InspectAI-Report-${project.name.replace(/\s+/g, "-")}.pdf"`,
      "Content-Length": uint8.byteLength.toString(),
    },
  });
}
