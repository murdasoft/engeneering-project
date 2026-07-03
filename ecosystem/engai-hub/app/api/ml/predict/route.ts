import { NextRequest, NextResponse } from "next/server";

const ML_API_URL = "https://alllxndr-inspectai-ml.hf.space";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const searchParams = request.nextUrl.searchParams;

    const mlSearch = new URLSearchParams();
    ["pixel_scale_mm", "environment", "aggression", "structure_type", "concrete_grade", "rebar_class", "structure_age", "protective_layer_mm"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) mlSearch.set(key, value);
    });

    const res = await fetch(`${ML_API_URL}/predict/detailed?${mlSearch.toString()}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
