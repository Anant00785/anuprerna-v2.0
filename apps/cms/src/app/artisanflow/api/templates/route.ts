/**
 * GET /artisanflow/api/templates
 *
 * Read-only, client-callable list of workflow templates (id/name/description
 * only) — used by StartProductionDialog to populate its template picker from
 * a client component (order / custom-order item rows) without threading the
 * list through a server component prop chain.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflowTemplateList, BackendFetchError } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());
  // Bare await -> opaque Next HTML 500 on a wrapper outage; StartProductionDialog
  // then fails on r.json() rather than surfacing the cause. Classify as 502.
  let templates: Awaited<ReturnType<typeof getWorkflowTemplateList>>;
  try {
    templates = await getWorkflowTemplateList(token);
  } catch (e) {
    if (e instanceof BackendFetchError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    throw e;
  }
  return NextResponse.json({
    templates: templates.map((t) => ({ id: t.id, name: t.name, description: t.description || "" })),
  });
}
