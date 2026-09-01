/**
 * /artisanflow/api/ai/draft-instruction — draft ONE QC-checkpoint instruction
 * with Gemini (Google Generative Language API, key from GEMINI_API_KEY).
 *
 * POST { productName?, stageName, taskName } -> { text }  (trimmed sentence)
 *
 * Model discovery: try MODEL_PRIMARY; if it 404s / errors on the model, list
 * models and pick the first `*flash*` that supports generateContent, then retry
 * once. ANY failure returns { text: "", error } with HTTP 200 so the UI just
 * degrades (button does nothing / subtle toast) — never 500 the page.
 *
 * Lives under /artisanflow/ (not /api/) so the Weave page-middleware lets an
 * authenticated browser through, matching the other artisanflow API routes.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_PRIMARY = "gemini-2.0-flash";
// Once discovery finds a working flash model, remember it for the process
// lifetime so later calls skip the retired primary + the list round-trip.
let cachedModel: string | null = null;

function buildPrompt(productName: string | undefined, stageName: string, taskName: string): string {
  const product = (productName || "").trim() || "an unspecified textile product";
  return [
    "Write ONE imperative sentence (max 25 words) telling a textile artisan what to inspect and photograph at this QC checkpoint.",
    `Product: ${product}.`,
    `Stage: ${stageName || "unspecified stage"}.`,
    `Checkpoint: ${taskName || "quality check"}.`,
    "No preamble, no markdown — just the instruction.",
  ].join(" ");
}

async function generate(model: string, prompt: string, key: string): Promise<{ text: string; status: number }> {
  const res = await fetch(
    `${API_ROOT}/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 256, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) return { text: "", status: res.status };
  const data = (await res.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p?.text || "")
    .join("")
    .trim();
  return { text, status: 200 };
}

/** List models, return the first flash model that supports generateContent. */
async function discoverFlashModel(key: string): Promise<string | null> {
  const res = await fetch(`${API_ROOT}/models?key=${encodeURIComponent(key)}`);
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as {
    models?: { name?: string; supportedGenerationMethods?: string[] }[];
  };
  const match = (data.models || []).find(
    (m) =>
      (m.name || "").toLowerCase().includes("flash") &&
      (m.supportedGenerationMethods || []).includes("generateContent"),
  );
  if (!match?.name) return null;
  // API returns "models/<id>"; the generateContent path wants just "<id>".
  return match.name.replace(/^models\//, "");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    productName?: string;
    stageName?: string;
    taskName?: string;
  };
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ text: "", error: "GEMINI_API_KEY not set" });
  }

  const prompt = buildPrompt(body.productName, body.stageName || "", body.taskName || "");

  try {
    // 0) If we already discovered a working model, use it straight away.
    if (cachedModel) {
      const cached = await generate(cachedModel, prompt, key);
      if (cached.text) return NextResponse.json({ text: cached.text, model: cachedModel });
      cachedModel = null; // it stopped working — fall through to rediscover
    }

    // 1) Try the primary model.
    let out = await generate(MODEL_PRIMARY, prompt, key);
    if (out.text) {
      cachedModel = MODEL_PRIMARY;
      return NextResponse.json({ text: out.text, model: MODEL_PRIMARY });
    }

    // 2) Discover a flash model and retry once.
    const discovered = await discoverFlashModel(key);
    if (discovered) {
      out = await generate(discovered, prompt, key);
      if (out.text) {
        cachedModel = discovered;
        return NextResponse.json({ text: out.text, model: discovered });
      }
    }

    return NextResponse.json({ text: "", error: `no model produced text (primary status ${out.status})` });
  } catch (e) {
    return NextResponse.json({ text: "", error: (e as Error).message });
  }
}
