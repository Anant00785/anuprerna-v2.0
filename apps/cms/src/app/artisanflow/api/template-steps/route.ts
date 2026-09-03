/**
 * GET /artisanflow/api/template-steps?id=<templateId>
 *
 * Read-only helper for the custom-workflow CREATE form: returns a workflow
 * template's RAW steps (WorkflowStep[] shape, id/name/status/subProcesses),
 * unlike /artisanflow/api/templates which returns the seeded Stage[] job
 * model. Used to pre-populate a new custom workflow's `steps` from an
 * existing (live-synced) template. No writes.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import { getWorkflowTemplate, BackendFetchError } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const cookieStore = await cookies();
  const token = await getBackendCallToken(cookieStore.get(COOKIE_NAME)?.value);
  // Bare await -> opaque Next HTML 500 on a wrapper outage, which the calling
  // form reads as a JSON parse error. Classify it as a 502 instead.
  let template: Awaited<ReturnType<typeof getWorkflowTemplate>>;
  try {
    template = await getWorkflowTemplate(Number(id), token);
  } catch (e) {
    if (e instanceof BackendFetchError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    throw e;
  }
  if (!template) {
    return NextResponse.json({ error: "template not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: template.id,
    name: template.name,
    steps: (template.steps || []).filter((s) => !s.deleted),
  });
}
