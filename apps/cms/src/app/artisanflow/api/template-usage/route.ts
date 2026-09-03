/**
 * GET /artisanflow/api/template-usage?templateId=N
 *
 * How many production jobs were created from a workflow template, split by
 * status. Feeds the "N live jobs use this template" advisory on the template
 * BUILDER, so an operator editing a template knows what is already running
 * against it.
 *
 * Client-callable and deliberately NOT part of the /edit page's server render:
 * the underlying count is a full pass over the job table (~12 s uncached — see
 * getTemplateUsage in artisanflow-api.ts for the measurement), and the builder
 * must paint immediately. The banner streams in when the answer arrives, and
 * simply never appears if it does not.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getTemplateUsage } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(req: NextRequest) {
  const templateId = Number(req.nextUrl.searchParams.get("templateId"));
  if (!Number.isInteger(templateId) || templateId <= 0) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }
  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);
  // getTemplateUsage never throws — it returns null when the read failed, which
  // this route reports as `usage: null` with a 200 so the advisory banner just
  // stays hidden. An unavailable advisory must not look like a broken builder.
  const usage = await getTemplateUsage(templateId, token);
  return NextResponse.json({ templateId, usage });
}
