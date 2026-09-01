/**
 * GET /artisanflow/api/board
 *
 * Client-callable production board data. The /artisanflow page used to fetch
 * all of this server-side (SSR) before sending any HTML -- board + completed
 * list + comment counts is several backend round trips (including an N+1
 * getWorkflow detail fetch per active job inside getOrderBoard), so the page
 * sat blank for however long the slowest of those took. This is an internal
 * tool with no SEO/first-paint requirement, so the page now renders its shell
 * immediately and fetches this endpoint client-side with a loading state
 * instead of blocking navigation on the backend.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceToken } from "@/lib/loom-service-token";
import { getOrderBoard, getWorkflowList, getWorkflowCommentCounts, BackendFetchError } from "@/lib/artisanflow-api";

export const dynamic = "force-dynamic";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const COMPLETED_CAP = 80;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? (await getServiceToken());

  let board: Awaited<ReturnType<typeof getOrderBoard>>;
  let completed: Awaited<ReturnType<typeof getWorkflowList>>;
  try {
    [board, completed] = await Promise.all([getOrderBoard(token), getWorkflowList("COMPLETED", token)]);
  } catch (e) {
    if (e instanceof BackendFetchError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    throw e;
  }

  const allWorkflowIds = [
    ...board.cards.flatMap((c) => c.items.map((it) => it.workflowId)),
    ...board.orderless.map((it) => it.workflowId),
  ];
  // Comment counts are a BADGE, not the board. A BackendFetchError here used to
  // escape the handler, so Next answered with an HTML 500 and the client's
  // r.json() died on "Unexpected token '<'" -- a parse error instead of the
  // ErrorBanner this route's 502 path exists to trigger. The badge now degrades
  // to zero and the board still renders; a systemic failure would already have
  // surfaced as the 502 above, since getOrderBoard hits the same backend.
  let commentCounts: Record<number, number> = {};
  try {
    commentCounts = await getWorkflowCommentCounts(allWorkflowIds, token);
  } catch (e) {
    if (!(e instanceof BackendFetchError)) throw e;
  }
  const cards = board.cards.map((c) => ({
    ...c,
    items: c.items.map((it) => ({ ...it, commentCount: commentCounts[it.workflowId] ?? 0 })),
  }));
  const orderless = board.orderless.map((it) => ({ ...it, commentCount: commentCounts[it.workflowId] ?? 0 }));

  return NextResponse.json({
    cards,
    hiddenAbandoned: board.hiddenAbandoned,
    orderless,
    completed: completed.slice(0, COMPLETED_CAP),
    totalCompleted: completed.length,
  });
}
