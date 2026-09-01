/**
 * /code-review — Code Review dashboard (server entry point).
 *
 * Auth-gated like the rest of Weave (logged-in only). The open-PR list is
 * server-fetched through the read-only :8090 wrapper (getServiceToken →
 * SANDBOX_ADMIN_TOKEN, see pr-review-api.ts) so keep force-dynamic. A wrapper /
 * gh / DB outage passes an error string to the client, which renders the shared
 * ErrorBanner instead of a misleading empty table.
 */
import { redirect } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { getIdentity } from "@/lib/feedback-identity";
import { fetchPrReviewList } from "@/lib/pr-review-api";
import { CodeReviewClient } from "./CodeReviewClient";

export const dynamic = "force-dynamic";

export default async function CodeReviewPage() {
  const me = await getIdentity();
  if (!me.authenticated) redirect("/login");

  const res = await fetchPrReviewList();
  return (
    <WeaveShell breadcrumb={<span>Code Review</span>}>
      <CodeReviewClient
        initialRows={res.ok ? res.data.rows : []}
        initialError={res.ok ? null : res.error}
        initialSyncErrors={res.ok ? res.data.syncErrors : []}
      />
    </WeaveShell>
  );
}
