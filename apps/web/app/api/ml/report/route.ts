import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const mlUrl = process.env.ML_API_URL ?? "http://localhost:8000";
  const mlApiKey = process.env.ML_API_KEY ?? "";

  const formData = await req.formData();
  const { searchParams } = new URL(req.url);
  const mlSearch = new URLSearchParams();
  ["pixel_scale_mm", "environment", "aggression", "project_name", "inspector", "location"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) mlSearch.set(key, value);
  });
  const query = mlSearch.toString();
  const endpoint = `${mlUrl}/report${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {};
  if (mlApiKey) headers["X-API-Key"] = mlApiKey;

  const mlRes = await fetch(endpoint, { method: "POST", headers, body: formData });
  if (!mlRes.ok) {
    const data = await mlRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: mlRes.status });
  }

  const contentType = mlRes.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    const blob = await mlRes.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="InspectAI_Report.pdf"`,
      },
    });
  }
  return NextResponse.json(await mlRes.json());
}
