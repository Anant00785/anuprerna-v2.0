/**
 * /feedback — cross-app Page-Feedback triage dashboard.
 *
 * Auth-gated like the widget: logged-in only (weave_token cookie). Owner
 * (amit@anuprerna.com) sees controls on every item; other users can act on
 * their own submissions. Data + mutations flow through the same-origin proxy
 * routes (/api/feedback/all, /api/feedback/:id) so identity is injected
 * server-side and the backend is never touched directly.
 */

import { redirect } from "next/navigation";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { getIdentity } from "@/lib/feedback-identity";
import FeedbackDashboard from "./FeedbackDashboard";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const me = await getIdentity();
  if (!me.authenticated) redirect("/login");

  return (
    <WeaveShell breadcrumb={<span>Feedback</span>}>
      <FeedbackDashboard initialMe={me} />
    </WeaveShell>
  );
}
