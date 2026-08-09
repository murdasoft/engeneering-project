import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { assetId, projectId, params = {} } = body;

  if (!assetId || !projectId) {
    return NextResponse.json({ error: "assetId and projectId are required" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, projectId },
    include: { project: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (asset.project.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const mlUrl = process.env.ML_API_URL ?? "https://alllxndr-inspectai-ml.hf.space";
  const mlApiKey = process.env.ML_API_KEY ?? "";

  const analysis = await prisma.analysis.create({
    data: {
      status: "PROCESSING",
      assetId,
      userId: (session.user as any).id,
      parameters: params,
    },
  });

  try {
    const imageRes = await fetch(asset.blobUrl);
    if (!imageRes.ok) throw new Error("Failed to fetch image from blob storage");
    const imageBlob = await imageRes.blob();

    const formData = new FormData();
    formData.append("file", imageBlob, asset.filename);

    const search = new URLSearchParams();
    ["pixel_scale_mm", "environment", "aggression", "structure_type", "concrete_grade", "rebar_class", "structure_age", "protective_layer_mm", "threshold"].forEach((key) => {
      if (params[key] !== undefined && params[key] !== "" && params[key] !== null) search.set(key, String(params[key]));
    });
    const mlEndpoint = `${mlUrl}/predict/detailed${search.toString() ? `?${search.toString()}` : ""}`;

    const headers: Record<string, string> = {};
    if (mlApiKey) headers["X-API-Key"] = mlApiKey;

    const mlRes = await fetch(mlEndpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!mlRes.ok) {
      const errData = await mlRes.json().catch(() => ({}));
      const detail = typeof errData.detail === "string"
        ? errData.detail
        : Array.isArray(errData.detail)
          ? errData.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join("; ")
          : errData.error ?? `ML API returned ${mlRes.status}`;
      throw new Error(detail);
    }

    const result = await mlRes.json();

    // Strip base64 image from stored resultData to avoid bloating the DB
    const { annotated_image, ...leanResult } = result;

    const allDets = result.detections_detailed ?? [];
    const defectDets = allDets.filter((det: any) => det.class !== "other");

    const findings = defectDets.map((det: any) => ({
      className: det.class ?? "unknown",
      confidence: det.confidence ?? 0,
      severity: (det.severity ?? "low").toUpperCase(),
      bbox: det.bbox,
      widthMm: det.engineering?.estimated_width_mm ?? null,
      heightMm: det.engineering?.estimated_length_mm ?? null,
      areaMm2: det.engineering?.estimated_area_cm2 ? det.engineering.estimated_area_cm2 * 100 : null,
    }));

    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "COMPLETED",
        confidence: result.detections?.length > 0
          ? Math.max(...result.detections.filter((d: any) => d.class !== "other").map((d: any) => d.confidence))
          : 0,
        modelVersion: result.model_version ?? "ensemble-v3.0",
        resultData: leanResult,
        findings: { create: findings },
      },
    });

    return NextResponse.json({
      analysisId: analysis.id,
      summary: { ...result.summary, other: allDets.filter((d: any) => d.class === "other").length },
      findingsCount: findings.length,
    });
  } catch (error) {
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Analysis failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
