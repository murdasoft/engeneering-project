import { NextRequest, NextResponse } from "next/server";

const ML_API_URL = process.env.ML_API_URL ?? "https://alllxndr-inspectai-ml.hf.space";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const searchParams = request.nextUrl.searchParams;

    const mlSearch = new URLSearchParams();
    ["pixel_scale_mm", "environment", "aggression", "project_name", "inspector", "location", "structure_type", "concrete_grade", "rebar_class", "structure_age", "protective_layer_mm", "threshold"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) mlSearch.set(key, value);
    });

    const headers: Record<string, string> = {};
    const mlApiKey = process.env.ML_API_KEY ?? "";
    if (mlApiKey) headers["X-API-Key"] = mlApiKey;

    const res = await fetch(`${ML_API_URL}/report?${mlSearch.toString()}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const pdfBuffer = await res.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=inspectai_report.pdf",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
