/**
 * POST /api/keywords
 *
 * Generates SEO/internal-search keywords for a product using Gemini.
 * Server-side only — Gemini API key never exposed to the client.
 *
 * Body: { productName: string; subCategory: string; materials: string }
 * Response: { keywords: string }  comma-separated
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI key not configured — set GEMINI_API_KEY in .env.local" },
      { status: 503 },
    );
  }

  let body: { productName?: string; subCategory?: string; materials?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { productName = "", subCategory = "", materials = "" } = body;

  const promptLines = [
    "Generate 8-15 SEO and internal-search keywords for an Indian handloom/textile product.",
    "",
    "Product name: " + JSON.stringify(productName),
    "Sub-category: " + JSON.stringify(subCategory),
    "Materials: " + JSON.stringify(materials),
    "",
    "Return ONLY a single comma-separated list — no explanations, no numbering, no bullet points.",
    "Focus on Indian textile terminology, weave types, use cases, and buyer search terms.",
    "Keep each keyword concise (1-4 words).",
  ];
  const prompt = promptLines.join("\n");

  try {
    const geminiUrl = GEMINI_URL + "?key=" + GEMINI_API_KEY;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Gemini error " + res.status + ": " + errText.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const keywords = raw
      .replace(/\n+/g, ", ")
      .replace(/,\s*,/g, ",")
      .trim()
      .replace(/^,|,$/, "");

    return NextResponse.json({ keywords });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
