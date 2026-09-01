/**
 * GET /artisanflow/api/jobs-windows?orderIds=1,2,3&customIds=4,5,6
 *
 * Bulk, per-visible-row job-run window for the /artisanflow/jobs list.
 * WorkflowInstancePreview.orderDeliveryDateFrom/To are dead fields (see
 * computeStepWindow's doc comment in artisanflow-api.ts) -- every row reads
 * epoch 0. The real per-job schedule lives on the job's own STEPS, which only
 * come back on the full-detail fetch (getWorkflow / getCustomWorkflowDetail),
 * not the list preview. Fetching that detail for all ~2,200 jobs on every
 * page load would multiply the jobs page's already-eight backend list calls
 * by two orders of magnitude, so this mirrors the bulk badge pattern already
 * used for comment counts (getWorkflowCommentCounts): the CLIENT calls this
 * route with just the ids on the page actually on screen (<=30 at a time,
 * see JobsClient's fetch effect), and it fans out the detail fetch for only
 * those. getOrderBoard already accepts this same N+1 detail-fetch shape for
 * its (smaller) active-job set -- this route bounds it to one page instead.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getWorkflow, getCustomWorkflowDetail, computeStepWindow, BackendFetchError } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";
// One page (30) plus headroom -- never the whole table, see the file comment.
const MAX_IDS_PER_KIND = 60;

function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  const out: number[] = [];
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (Number.isFinite(n) && n > 0) out.push(n);
    if (out.length >= MAX_IDS_PER_KIND) break;
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderIds = parseIds(searchParams.get("orderIds"));
  const customIds = parseIds(searchParams.get("customIds"));

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  const windows: Record<string, { from: number | null; to: number | null }> = {};

  await Promise.all([
    ...orderIds.map(async (id) => {
      try {
        const inst = await getWorkflow(id, token);
        windows[`ORDER:${id}`] = computeStepWindow(inst?.steps ?? []);
      } catch (e) {
        if (!(e instanceof BackendFetchError)) throw e;
        windows[`ORDER:${id}`] = { from: null, to: null };
      }
    }),
    ...customIds.map(async (id) => {
      try {
        const detail = await getCustomWorkflowDetail(id, token);
        windows[`CUSTOM_ORDER:${id}`] = computeStepWindow(detail?.steps ?? []);
      } catch (e) {
        if (!(e instanceof BackendFetchError)) throw e;
        windows[`CUSTOM_ORDER:${id}`] = { from: null, to: null };
      }
    }),
  ]);

  return NextResponse.json({ windows });
}
