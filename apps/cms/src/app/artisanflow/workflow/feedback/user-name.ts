/**
 * feedbackUserName — the "User Name" column live's Job Feedback list shows, and
 * the one our rows were rendering as "—".
 *
 * WHAT THE NAME IS. Live's IWorkflowFeedback carries `userName` / `userEmail`
 * next to orderId, order date and estimated delivery: it is the CUSTOMER who
 * placed the order, not the admin who uploaded the QC photos. MEASURED on the
 * sandbox copy (2026-08-17): the name in Amit's live screenshot, "Nirav
 * Dholaria", is loom_tenant 145082244 — 5 rows in relational.orders, 0 rows as
 * element_feedback.uploadedBy and 0 workflows owned. The uploaders are somebody
 * else entirely (every PENDING row is uploaded by tenant 101570925 "Arijit
 * Bhowmik" or 102088400 "Abhijit Kundu"). The same conclusion falls out of
 * relational.whatsapp_notification_history: every `bts_production_update_1` send
 * — the message Approve & Notify fires — is addressed to tenant_type CUSTOMER
 * and stamps that customer's name into `metadata.userName`.
 *
 * WHERE IT COMES FROM HERE. The native queue does not join a tenant at all
 * (workflow.mapper.ts elementFeedbackPreviewRow says so in as many words:
 * "artisanName/userName/productName are NOT resolvable"). But it DOES return
 * `workflowName`, and Loom names a job "<customer>-<orderId>-<sku>" — so the
 * customer is already in the payload, prefixed to a marker we can locate exactly.
 * That is why this parses rather than fetches: the alternative is one order read
 * per row (23 on the PENDING tab alone) to recover a string we were already sent.
 *
 * THE PARSE IS ANCHORED, NOT GREEDY. It cuts at the LAST occurrence of
 * `-<orderId>-`, never at the first hyphen, because customer names contain
 * hyphens and spaces and the SKU segment does too. Splitting on the first "-"
 * would have turned "Jean-Paul Meyer-146328712-DNB1210446" into "Jean". Anchoring
 * on the order id also means a row whose name does NOT carry the marker returns
 * "" and renders as "—" rather than as a guess — no invented people.
 *
 * MEASURED COVERAGE on the live-synced sandbox rows (2026-08-17):
 *   PENDING   23/23   rows resolve a name (was 0/23)
 *   APPROVED 300/300  rows on the served page (was 0/300)
 *   REJECTED   1/7    — the other 6 carry NO workflowName at all, because the
 *                       queue's LEFT JOIN found no rollup mapping for them. They
 *                       are shown, nameless, on purpose: a review queue that
 *                       hides rows is worse than one that shows them bare.
 */

/** The customer on a feedback row, or "" when the payload cannot prove one. */
export function feedbackUserName(item: { workflowName?: string; orderId?: number }): string {
  const name = (item.workflowName ?? "").trim();
  const orderId = item.orderId;
  if (!name || orderId == null || !Number.isFinite(orderId) || orderId <= 0) return "";
  const marker = `-${orderId}-`;
  const cut = name.lastIndexOf(marker);
  if (cut <= 0) return "";
  return name.slice(0, cut).trim();
}
