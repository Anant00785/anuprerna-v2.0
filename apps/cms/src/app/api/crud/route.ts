/**
 * /api/crud — the single authenticated write forwarder for CMS CRUD.
 *
 * Client CRUD forms POST { path, method?, body } here; this server route
 * attaches the sandbox admin token and forwards to the native backend. Every
 * one of those endpoints writes ONLY to the sandbox Postgres (no live-Loom /
 * Zoho forward), so this cannot mutate the live system.
 *
 * Guardrails: path must be an add/update/delete/enable/disable/cancel/upload
 * write verb, and the caller must already hold a valid session (middleware-
 * gated route). 'cancel' was added 2026-07-06 for orders (DELETE cancel/order
 * takes a body — cancellationReason — unlike every other delete-by-id route
 * here, so the body is now forwarded on DELETE too whenever the caller
 * supplies one). 'upload' was added 2026-07-06 once the real MinIO-backed
 * ImageController (upload/image) replaced the old kill-switch — most image
 * uploads go through the dedicated /api/product/upload-image bridge (which
 * attaches the session cookie directly), but this keeps the verb allowed for
 * any CRUD-style caller that routes uploads through this generic forwarder.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceToken } from "@/lib/loom-service-token";
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { isSandboxId, sandboxRefusal } from "@/lib/sandbox-floor";
import { resolveSignOff } from "@/lib/signoff-identity";
import { getIdentity } from "@/lib/feedback-identity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
// Keyed on the FIRST DECODED SEGMENT, not on a prefix of the joined path. A
// decoded segment may legitimately contain a "/" (from %2F), and matching a
// prefix of the joined string would let `%61dd%2Fx/foo` read as the verb "add"
// while the forwarded URL's first segment is actually "add%2Fx". Test the thing
// the URL is actually built from.
const WRITE_VERBS = new Set(["add", "update", "delete", "disable", "enable", "cancel", "upload"]);

// ── Path normalisation ──────────────────────────────────────────────────────
// EVERY guard decision below is taken on the NORMALISED path, and the NORMALISED
// path is what gets forwarded. Guarding one string and forwarding a different one
// is the whole bypass class this function exists to remove: a guard that reads
// `delete/workflow/5` while the forwarder sends `delete/workflow/%35` (or
// `delete//workflow/5`, or `delete/workflow/5/`) is not a guard.
type NormalisedPath =
  | { ok: true; path: string; segments: string[]; query: string; target: string }
  | { ok: false; reason: string };

/**
 * Re-encode ONE decoded path segment for the outbound URL.
 *
 * Only the characters that would otherwise change the URL's STRUCTURE are
 * escaped — the segment/query/fragment delimiters, plus '%' itself so a
 * literal percent round-trips instead of being read as the start of an escape.
 * Everything else is passed through byte-identical, so an ordinary path like
 * `delete/workflow-template/12` forwards exactly as before (encodeURIComponent
 * would have rewritten legal characters such as ':' and ',' and silently
 * changed the upstream URL for every caller).
 */
function encodeSegment(seg: string): string {
  return seg.replace(/[%/?#]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
}

/**
 * Split FIRST, decode SECOND, re-encode on the way out.
 *
 * The previous version decoded the WHOLE path before splitting off the query
 * and the fragment, which broke in both directions:
 *
 *   1. An ENCODED delimiter became a REAL one. `delete/workflow-template/1%3Fx`
 *      decoded to `delete/workflow-template/1?x` BEFORE the `?` split, so the
 *      forwarder silently truncated the id to `1` and moved `x` into the query
 *      string — a different upstream URL than the caller asked for, and a
 *      different one than the guard believed it was inspecting. Same for `%23`
 *      and the fragment cut.
 *   2. The DECODED path was what got forwarded. Any percent-escape the caller
 *      sent was stripped on the way upstream, so the backend received a URL the
 *      client never wrote.
 *
 * Now: cut the query/fragment on the RAW string (only a literal, unescaped `?`
 * or `#` can delimit), split the path on RAW `/`, then decode each segment on
 * its own. A decoded segment keeps any `/` or `?` it contained — those stay
 * INSIDE the segment instead of restructuring the path, which is what makes
 * `delete/workflow/%2F5` land in the delete guard as a malformed id and get
 * REFUSED rather than sliding past it. The outbound URL is rebuilt by
 * re-encoding the very segments the guards ran on, so the string that is
 * guarded and the string that is forwarded are once again the same URL.
 */
function normalizeCrudPath(raw: unknown): NormalisedPath {
  const s0 = String(raw ?? "");
  if (!s0.trim()) return { ok: false, reason: "Path is required." };

  // Cut on the RAW delimiters, before any decoding.
  let rest = s0;
  const hash = rest.indexOf("#");
  if (hash >= 0) rest = rest.slice(0, hash);
  const qm = rest.indexOf("?");
  const query = qm >= 0 ? rest.slice(qm + 1) : "";
  if (qm >= 0) rest = rest.slice(0, qm);

  // Split on RAW '/' — an escaped %2F is NOT a separator and must not become one.
  const rawSegments = rest.split("/").filter((seg) => seg !== "");
  const segments: string[] = [];
  for (const rawSeg of rawSegments) {
    let seg: string;
    try {
      seg = decodeURIComponent(rawSeg);
    } catch {
      return { ok: false, reason: "Path is not valid URL-encoded text." };
    }
    if (seg.includes("\0")) return { ok: false, reason: "Path contains a null byte." };
    if (seg === "." || seg === "..") {
      return { ok: false, reason: "Path contains a relative segment." };
    }
    segments.push(seg);
  }
  if (segments.length === 0) return { ok: false, reason: "Path is required." };

  const path = segments.join("/");
  const target = segments.map(encodeSegment).join("/");
  return { ok: true, path, segments, query, target };
}

// ═══════════════════════════════════════════════════════════════════════════
// THE WRITE REGISTRY — every verb × entity this forwarder accepts, and what the
// sandbox floor means for each one.
//
// WHY A TABLE AND NOT MORE REGEXES (2026-08-17). The floor guard used to be
// three hand-written regexes, and it was applied PER ENDPOINT instead of PER
// ENTITY. The element-wise audit measured the consequences by probing with
// NON-EXISTENT sub-floor ids:
//
//   delete/workflow-template/999999   -> 403 refused
//   update/workflow-template  id=999999 -> NOT refused, reached the backend
//   delete/custom-order/999999        -> 403 refused
//   update/custom-order-item          -> NOT refused
//   delete/custom-order-item/999999   -> NOT refused
//
// So DELETE was covered and UPDATE was not; ORDER level was covered and ITEM
// level was not. The old `UPDATE_BAND_PATH` even excluded `workflow-template` on
// purpose, described in a comment as "a normal, reversible write" — it is not
// reversible in a sandbox that gets re-seeded from live, and MEASURED against the
// running :8090 image (2026-08-17, `grep guardSandboxWorkflow` inside the
// anuprerna-wrapper container) WorkflowService calls its floor guard in exactly
// deleteWorkflowInstance / updateWorkflow / updateCustomWorkflow and NOT in
// updateTemplate. For `update/workflow-template` this route is therefore the ONLY
// line of defence, and pressing Save on /artisanflow/workflow/template/490267/edit
// would have rewritten a production-mirrored template for real.
//
// That is not a bug you patch once, it is a table you complete. So:
//
//   1. EVERY write path the forwarder accepts is listed below, ONCE, with an
//      explicit disposition — `band` (floor-guarded, with the id sources spelled
//      out) or `open` (deliberately exempt, with the reason written down).
//   2. ANYTHING NOT LISTED IS REFUSED. A new backend endpoint is therefore
//      unreachable through this forwarder until somebody classifies it, which is
//      the property the old regexes lacked: they failed OPEN, and every gap above
//      is an instance of failing open.
//   3. Matching is LONGEST-PREFIX on segment boundaries, so a family can be split
//      where its members genuinely differ — `update/element/feedback` and
//      `update/element/feedback/admin` are separate rows rather than one guess,
//      and so are `add/custom-order` (creating an order, nothing to band) and
//      `update/custom-order` (rewriting an existing one, banded).
//
// ⚠ LOOKUP IS CASE-INSENSITIVE ON PURPOSE (lookupRule lowercases every segment).
// NestJS runs on Express, and Express'''s "case sensitive routing" setting is DISABLED
// by default, so the backend resolves `update/WORKFLOW` to the same handler as
// `update/workflow`. MEASURED against :8090 on 2026-08-16: get/workflow-template-list,
// get/WORKFLOW-template-list and get/Workflow-Template-List all answer 200. A
// case-SENSITIVE table would therefore cover a strictly SMALLER set of strings than
// the backend will actually route — the same "guarded one string, forwarded another"
// bypass class normalizeCrudPath exists to close, just spelled with capital letters.
// It was a real bypass: `{ path: "update/WORKFLOW", body: { id: 133048758 } }` sailed
// past the band check before /i was added to the old regexes. The table must be a
// SUPERSET of what the backend routes, never a subset — and the outbound URL still
// carries the caller'''s original casing, because we widen what is INSPECTED, not what
// is SENT. The write VERB stays case-SENSITIVE (WRITE_VERBS holds lowercase only), so
// `UPDATE/workflow` is rejected outright as "not a write endpoint" — that fails CLOSED
// and needs no widening.
//
// The band is checked on the ids the REQUEST carries. For the child entities
// (order items, adjustments) that is the CHILD id, and that is correct in both
// directions rather than a convenient approximation: a live-mirrored order's
// items carry live ids (order 132440539's items are 132440540…132450307, all
// sub-floor), while OrdersService mints sandbox children as
// `Math.max(maxEmbeddedId(), 999_999_999_999) + 1`, i.e. always above the floor.
// ═══════════════════════════════════════════════════════════════════════════

/** Where a target id can travel in a request. */
type IdSource =
  /** A path SEGMENT, 0-based over the normalised segments (verb = 0). */
  | { at: number }
  /** A top-level key of the JSON body. */
  | { body: string };

interface BandRule {
  kind: "band";
  /** Human wording for the refusal message — matches the backend's own. */
  entity: string;
  /** Human verb for the refusal message. */
  verb: string;
  /**
   * Every place this route's target id can appear. All sources that are PRESENT
   * are checked and every one of them must be in the sandbox band; finding NONE
   * is a REFUSAL, never a pass ("did not parse" must mean "refuse", the same rule
   * the delete family already followed).
   */
  ids: IdSource[];
}
interface OpenRule {
  kind: "open";
  /** Why this entity is deliberately NOT floor-guarded. Required — an exemption
   *  without a written reason is how the last set of gaps got in. */
  why: string;
}
type WriteRule = BandRule | OpenRule;

const band = (entity: string, verb: string, ids: IdSource[]): BandRule => ({ kind: "band", entity, verb, ids });
const open = (why: string): OpenRule => ({ kind: "open", why });

/** Reasons reused across many rows, so the table stays readable. */
const WHY_CATALOGUE =
  "catalogue / content reference data. Not part of the live-mirrored id band this " +
  "guard protects: these rows are re-seeded wholesale by db:refresh and editing them " +
  "is the sandbox's primary purpose.";
const WHY_CREATE = "creates a NEW row, which is minted ABOVE the sandbox floor — there is no existing target to protect.";

const WRITE_REGISTRY = new Map<string, WriteRule>(Object.entries({
  // ── WORKFLOW TEMPLATES ───────────────────────────────────────────────────
  // Both verbs banded. The template is the shape 129 live jobs were instantiated
  // from; rewriting or deleting a live-mirrored one destroys data the sandbox
  // cannot recreate, and the backend guards NEITHER of these two routes.
  "add/workflow-template": open(WHY_CREATE),
  "update/workflow-template": band("workflow template", "edit", [{ body: "id" }]),
  "delete/workflow-template": band("workflow template", "delete", [{ at: 2 }]),

  // Template CHILDREN (stage / task templates). Same argument one level down:
  // they belong to a template, and the child id shares its band.
  "add/step-element-template": band("workflow template", "edit", [{ body: "workflowTemplateId" }]),
  "update/step-element-template": band("workflow template", "edit", [{ body: "id" }]),
  "delete/step-element-template": band("workflow template", "edit", [{ at: 2 }]),
  "add/subprocess-element-template": band("workflow template", "edit", [{ body: "workflowTemplateId" }]),
  "update/subprocess-element-template": band("workflow template", "edit", [{ body: "id" }]),
  "delete/subprocess-element-template": band("workflow template", "edit", [{ at: 2 }]),

  // ── WORKFLOW INSTANCES (jobs) ────────────────────────────────────────────
  // A `steps` rewrite of a live-synced job is as unrecoverable as deleting it,
  // which is why the UPDATE side is banded as hard as the DELETE side.
  "add/workflow": open(WHY_CREATE),
  "add/custom-workflow": open(WHY_CREATE),
  "update/workflow": band("workflow", "edit", [{ at: 2 }, { body: "id" }, { body: "workflowId" }]),
  "update/custom-workflow": band("custom workflow", "edit", [{ at: 2 }, { body: "id" }, { body: "workflowId" }]),
  "delete/workflow": band("workflow", "delete", [{ at: 2 }]),
  "delete/custom-workflow": band("custom workflow", "delete", [{ at: 2 }]),

  // ── WORKFLOW NODE writes (the production board) ──────────────────────────
  // DELIBERATELY OPEN, and this is the one exemption that carries real weight.
  // These routes are addressed by an ELEMENT id and are the module's primary
  // function — one call per click to advance a production step. Exercising the
  // 1,929 live-synced jobs is the POINT of the sandbox, so banding them here
  // would remove the ability to use it at all. They are also not open-ended: the
  // backend's applyNodeStatusPatch allowlists exactly status / actualStartDate /
  // actualEndDate / properties, and it floor-guards `properties` ITSELF on the
  // owning workflow's id (WorkflowService.guardPropertyCapture, verified present
  // in the running image). So captured CONTENT is refused below the floor while
  // EXECUTION STATE stays writable — a distinction this forwarder cannot make,
  // because it cannot see which fields the body carries meaning for.
  "update/step-element": open(
    "element-addressed execution write; the backend allowlists the fields and floor-guards the `properties` capture itself.",
  ),
  "update/subprocess-element": open(
    "element-addressed execution write; the backend allowlists the fields and floor-guards the `properties` capture itself.",
  ),
  "update/step-element/artisan-assignments": open(
    "writes only artisan-mapping rows, never the workflow's own detail row; assigning artisans to a synced job is a sandbox exercise.",
  ),
  "update/subprocess-element/artisan-assignments": open(
    "writes only artisan-mapping rows, never the workflow's own detail row; assigning artisans to a synced job is a sandbox exercise.",
  ),

  // ── SIGN-OFF (element feedback) ──────────────────────────────────────────
  // The acting tenant on all three paths is DERIVED server-side below — never
  // taken from the caller — the same posture as workflow-comment attribution.
  //
  // `add` creates the record, minted ABOVE the floor, and ElementWriteService
  // additionally refuses to materialise or mirror anything whose OWNING WORKFLOW
  // is sub-floor. There is no existing target to protect.
  //
  // `update/element/feedback/admin` is BANDED, and the reason is MEASURED rather
  // than inherited. Reading the running backend (element-write.service.ts
  // updateFeedbackStatus, 2026-08-17), the status write is the one feedback path
  // with NO floor guard of its own: it looks the row up by id, UPDATEs
  // relational.element_feedback unconditionally, and only THEN calls
  // mirrorFeedbackOntoNode — which is the call that checks the band and returns
  // early. So the backend declines to MIRROR a sub-floor sign-off onto the job
  // while still rewriting the canonical row. The note this replaces claimed the
  // backend floor-guards this path. It does not, and this forwarder is the only
  // line of defence — the same shape, and the same discovery, as
  // `update/workflow-template` above.
  //
  // The id banded is the FEEDBACK ROW id, the only target the request carries,
  // and it is correct in both directions: all 2,728 synced element_feedback rows
  // are sub-floor (measured 2026-08-17 on anuprerna-pg), while a sandbox-minted
  // record takes its id from nextFeedbackSandboxId() (>= 1e12). It also cannot
  // refuse a legitimate board sign-off: canRecordSignOff() already restricts that
  // flow to sandbox-band JOBS, whose feedback rows are minted in the same band.
  //
  // NOTE for whoever owns `update/element/feedback` (the CONTENT overwrite): it
  // has the identical unguarded shape — updateFeedbackContent rewrites
  // text/image/video on ANY id and only the mirror is banded. It is left `open`
  // here only because it has no caller in this app, and closing it is a separate
  // change owned by the sign-off flow, not this one.
  "add/element/feedback": open(
    WHY_CREATE + " The backend additionally floor-guards the sign-off on the OWNING WORKFLOW id.",
  ),
  "update/element/feedback": open(
    "no caller in this app; see the NOTE above — it needs banding the moment one exists.",
  ),
  "update/element/feedback/admin": band("feedback", "update", [{ body: "id" }]),

  // ── DISCUSSION ───────────────────────────────────────────────────────────
  "add/workflow-comment": open(
    "relational.workflow_comment is NATIVE-ONLY — it has no Loom counterpart, so no row here is live-mirrored and there is no band to check.",
  ),
  "delete/workflow-comment": open("native-only table, as above — nothing live-mirrored to protect."),

  // ── ORDERS (standard) ────────────────────────────────────────────────────
  "add/order": open(WHY_CREATE),
  "update/order": band("order", "edit", [{ body: "id" }]),
  "update/order/shipment": band("order", "edit", [{ body: "orderId" }]),
  "cancel/order": band("order", "cancel", [{ body: "orderId" }]),
  "delete/order": band("order", "delete", [{ at: 2 }]),

  // ── CUSTOM ORDERS ────────────────────────────────────────────────────────
  // Order level was already covered. ITEM and ADJUSTMENT level were not, and the
  // detail page renders an enabled pencil, trash and Add-item on all 24 lines of
  // live-mirrored order 132440539 next to a badge reading "Sandbox — writes never
  // touch live". Those three controls are now refused here as well as disabled
  // in the UI, so the badge is true again.
  "add/custom-order": open(WHY_CREATE),
  "update/custom-order": band("order", "edit", [{ body: "customOrderId" }]),
  "update/custom-order-info": band("order", "edit", [{ body: "orderId" }]),
  "update/custom-order/shipment": band("order", "edit", [{ body: "orderId" }]),
  "cancel/custom-order": band("order", "cancel", [{ body: "orderId" }]),
  "delete/custom-order": band("order", "delete", [{ at: 2 }]),
  "update/custom-order-item": band("order", "edit", [{ body: "orderItemId" }]),
  "delete/custom-order-item": band("order", "delete", [{ at: 2 }]),
  "add/custom-order-items": band("order", "edit", [{ body: "orderId" }]),
  "add/custom-order-adjustment": band("order", "edit", [{ body: "customOrderId" }]),
  "update/custom-order-adjustment": band("order", "edit", [{ body: "id" }]),
  "delete/custom-order-adjustment": band("order", "delete", [{ at: 2 }]),

  // ── CATALOGUE / PRODUCTS ─────────────────────────────────────────────────
  "add/category": open(WHY_CATALOGUE),
  "update/category": open(WHY_CATALOGUE),
  "delete/category": open(WHY_CATALOGUE),
  "add/sub-category": open(WHY_CATALOGUE),
  "update/sub-category": open(WHY_CATALOGUE),
  "delete/sub-category": open(WHY_CATALOGUE),
  "add/segment": open(WHY_CATALOGUE),
  "update/segment": open(WHY_CATALOGUE),
  "delete/segment": open(WHY_CATALOGUE),
  "add/color": open(WHY_CATALOGUE),
  "update/color": open(WHY_CATALOGUE),
  "delete/color": open(WHY_CATALOGUE),
  "add/material": open(WHY_CATALOGUE),
  "update/material": open(WHY_CATALOGUE),
  "delete/material": open(WHY_CATALOGUE),
  "add/pattern": open(WHY_CATALOGUE),
  "update/pattern": open(WHY_CATALOGUE),
  "delete/pattern": open(WHY_CATALOGUE),
  "add/sku-group": open(WHY_CATALOGUE),
  "update/sku-group": open(WHY_CATALOGUE),
  "delete/sku-group": open(WHY_CATALOGUE),
  "add/special-status": open(WHY_CATALOGUE),
  "update/special-status": open(WHY_CATALOGUE),
  "delete/special-status": open(WHY_CATALOGUE),
  "add/fabric-product": open(WHY_CATALOGUE),
  "update/fabric-product": open(WHY_CATALOGUE),
  "disable/fabric-product": open(WHY_CATALOGUE),
  "add/finished-product": open(WHY_CATALOGUE),
  "update/finished-product": open(WHY_CATALOGUE),
  "disable/finished-product": open(WHY_CATALOGUE),
  "update/bulk/product-price": open(WHY_CATALOGUE),
  "add/discount": open(WHY_CATALOGUE),
  "update/discount": open(WHY_CATALOGUE),
  "delete/discount": open(WHY_CATALOGUE),
  "add/forex": open(WHY_CATALOGUE),
  "update/forex": open(WHY_CATALOGUE),
  "delete/forex": open(WHY_CATALOGUE),
  "update/settings": open(WHY_CATALOGUE),
  "upload/image": open("uploads a media object to sandbox MinIO; it has no live-mirrored target row at all."),

  // ── PROFILES (size / fabric / finish / MTO / badge / volume discount) ─────
  "add/size-profile": open(WHY_CATALOGUE),
  "update/size-profile": open(WHY_CATALOGUE),
  "delete/size-profile": open(WHY_CATALOGUE),
  "add/custom-size-profile": open(WHY_CATALOGUE),
  "update/custom-size-profile": open(WHY_CATALOGUE),
  "delete/custom-size-profile": open(WHY_CATALOGUE),
  "add/fabric-profile": open(WHY_CATALOGUE),
  "update/fabric-profile": open(WHY_CATALOGUE),
  "delete/fabric-profile": open(WHY_CATALOGUE),
  "add/finish-profile": open(WHY_CATALOGUE),
  "update/finish-profile": open(WHY_CATALOGUE),
  "delete/finish-profile": open(WHY_CATALOGUE),
  "add/made-to-order-profile": open(WHY_CATALOGUE),
  "update/made-to-order-profile": open(WHY_CATALOGUE),
  "delete/made-to-order-profile": open(WHY_CATALOGUE),
  "add/badge-profile": open(WHY_CATALOGUE),
  "update/badge-profile": open(WHY_CATALOGUE),
  "delete/badge-profile": open(WHY_CATALOGUE),
  "add/volume-discount-profile": open(WHY_CATALOGUE),
  "update/volume-discount-profile": open(WHY_CATALOGUE),
  "delete/volume-discount-profile": open(WHY_CATALOGUE),

  // ── CONTENT (blogs / stories / FAQs) ─────────────────────────────────────
  "add/blog-content": open(WHY_CATALOGUE),
  "update/blog-content": open(WHY_CATALOGUE),
  "delete/blog-content": open(WHY_CATALOGUE),
  "add/blog-content-category": open(WHY_CATALOGUE),
  "update/blog-content-category": open(WHY_CATALOGUE),
  "add/blog-content-section": open(WHY_CATALOGUE),
  "update/blog-content-section": open(WHY_CATALOGUE),
  "delete/blog-content-section": open(WHY_CATALOGUE),
  "add/blog-content-type": open(WHY_CATALOGUE),
  "update/blog-content-type": open(WHY_CATALOGUE),
  "add/story-content": open(WHY_CATALOGUE),
  "update/story-content": open(WHY_CATALOGUE),
  "delete/story-content": open(WHY_CATALOGUE),
  "add/story-content-category": open(WHY_CATALOGUE),
  "update/story-content-category": open(WHY_CATALOGUE),
  "add/story-content-section": open(WHY_CATALOGUE),
  "update/story-content-section": open(WHY_CATALOGUE),
  "delete/story-content-section": open(WHY_CATALOGUE),
  "add/faq": open(WHY_CATALOGUE),
  "update/faq": open(WHY_CATALOGUE),
  "delete/faq": open(WHY_CATALOGUE),

  // ── PEOPLE (artisans / skills / reviews / wholesale) ─────────────────────
  "add/artisan": open(WHY_CATALOGUE),
  "update/artisan": open(WHY_CATALOGUE),
  "add/skill": open(WHY_CATALOGUE),
  "update/skill": open(WHY_CATALOGUE),
  "delete/skill": open(WHY_CATALOGUE),
  "add/review": open(WHY_CATALOGUE),
  "update/super-user/review": open(WHY_CATALOGUE),
  "enable/loyalty-program": open("flips a loyalty flag on a customer row; reversible from the same screen and not part of the workflow/order band."),
  "add/catalog-pdf-generation/artisan": open("renders a PDF; writes no live-mirrored row."),
  "delete/catalog": open(WHY_CATALOGUE),
  "delete/catalog-item": open(WHY_CATALOGUE),
  "delete/catalog-item-media": open(WHY_CATALOGUE),

  // ── INVENTORY / WAREHOUSE / LOGISTICS ────────────────────────────────────
  "add/inventory-adjustment": open("appends to the external-stock LEDGER — an append-only sandbox record, never an edit of a synced row."),
  "add/inventory-adjustment-reason": open(WHY_CATALOGUE),
  "update/inventory-adjustment-reason": open(WHY_CATALOGUE),
  "add/inventory-restock-request": open(WHY_CATALOGUE),
  "update/inventory-restock-request/status": open(WHY_CATALOGUE),
  "update/inventory-restock-request/quantity": open(WHY_CATALOGUE),
  "delete/inventory-restock-request": open(WHY_CATALOGUE),
  "add/warehouse": open(WHY_CATALOGUE),
  "update/warehouse": open(WHY_CATALOGUE),
  "add/shipment": open(WHY_CATALOGUE),
  "update/shipment": open(WHY_CATALOGUE),
  "delete/shipment": open(WHY_CATALOGUE),
}));

/**
 * Match a request against the table.
 *
 * A registered key matches ONLY when everything after it is a plain numeric id —
 * the `delete/color/12` shape. Anything else is a DIFFERENT ROUTE and has to be
 * registered on its own.
 *
 * That second condition is the whole point, and it was missing from the first cut
 * of this table: a plain longest-prefix walk let a child route silently INHERIT a
 * parent's disposition. Measured on the first probe run — `add/order/feedback`,
 * `add/order/fulfillment` and `add/custom-order/ready` all sailed through on
 * `add/order` / `add/custom-order` (registered open because CREATING an order has
 * no target to band), and `update/artisan/element/feedback` sailed through on
 * `update/artisan`. Four real backend routes were reachable without ever having
 * been classified, which is precisely the fail-open behaviour this table replaces.
 *
 * The walk still goes longest-first so a family CAN be split where its members
 * genuinely differ — `update/element/feedback` and `update/element/feedback/admin`
 * are separate rows, as are `update/custom-order` and `update/custom-order/shipment`.
 * It stops at two segments; a bare verb is never a route.
 */
function lookupRule(segments: string[]): { key: string; rule: WriteRule } | null {
  const lower = segments.map((s) => s.toLowerCase());
  for (let n = lower.length; n >= 2; n--) {
    const key = lower.slice(0, n).join("/");
    const rule = WRITE_REGISTRY.get(key);
    if (!rule) continue;
    // Everything past the key must be an id, or this is not that route.
    if (!lower.slice(n).every((seg) => /^\d+$/.test(seg))) return null;
    return { key, rule };
  }
  return null;
}

/**
 * Collect the ids a banded write targets, from every source the rule declares.
 *
 * A strict /^\d+$/ test (after trimming) is deliberate: it rejects "1e13", "+5",
 * "0x10" and floats, none of which should reach a band comparison, rather than
 * letting Number() coerce something surprising past the floor.
 */
function collectBandIds(
  rule: BandRule,
  segments: string[],
  body: unknown,
): { ok: true; ids: number[] } | { ok: false; message: string } {
  const raw: unknown[] = [];
  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  for (const src of rule.ids) {
    if ("at" in src) {
      if (segments.length > src.at) raw.push(segments[src.at]);
    } else if (b && b[src.body] !== undefined && b[src.body] !== null) {
      raw.push(b[src.body]);
    }
  }
  if (raw.length === 0) {
    return {
      ok: false,
      message:
        `This ${rule.entity} write carries no id — refusing a change whose target cannot be identified.`,
    };
  }
  const ids: number[] = [];
  for (const r of raw) {
    if (typeof r !== "number" && typeof r !== "string") {
      return { ok: false, message: `Malformed ${rule.entity} id.` };
    }
    const t = String(r).trim();
    if (!/^\d+$/.test(t)) {
      return { ok: false, message: `Malformed ${rule.entity} id — expected a plain positive integer.` };
    }
    ids.push(Number(t));
  }
  return { ok: true, ids };
}

/**
 * Resolve the comment author SERVER-SIDE.
 *
 * add/workflow-comment used to take `authorName` straight from the client body,
 * so anything that could reach this forwarder could post a comment under any
 * name. The author is now taken from the session the same way every other
 * server-side identity decision in this app is taken (getIdentity), and written
 * LAST into the forwarded body so a caller-supplied `authorName` is overwritten
 * rather than merged.
 *
 * LIMITATION, stated plainly: getIdentity() reads the `weave_user` cookie, and
 * in this sandbox /api/auth/login writes that cookie from the email typed at the
 * login form WITHOUT verifying a credential (there is no credential store in the
 * sandbox copy — see the comment in that route). So this makes attribution
 * session-scoped and consistent instead of per-request arbitrary; it does not
 * make it cryptographically attested. That has to wait for the auth cutover that
 * route already flags. The cookie is now httpOnly so page scripts cannot rewrite
 * it between requests.
 */
async function deriveCommentAuthor(): Promise<
  { ok: true; authorName: string } | { ok: false; message: string }
> {
  const me = await getIdentity();
  if (!me.authenticated) {
    return { ok: false, message: "Sign in to post a comment." };
  }
  return { ok: true, authorName: me.name || me.email || "Team member" };
}

function isSandboxBackend(): boolean {
  try {
    const host = new URL(BACKEND).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Paths whose acting tenant + signer stamp are DERIVED here, never accepted
 *  from the caller. See stampSignOffIdentity. */
const SIGN_OFF_PATHS = new Set(["add/element/feedback", "update/element/feedback", "update/element/feedback/admin"]);
/** The subset that CREATES the record and therefore carries the signer's name. */
const SIGN_OFF_CREATE = "add/element/feedback";

export async function POST(req: NextRequest) {
  const { path, method, body } = (await req.json().catch(() => ({}))) as {
    path?: string;
    method?: string;
    body?: unknown;
  };

  const norm = normalizeCrudPath(path);
  if (!norm.ok) {
    return NextResponse.json({ success: false, message: norm.reason }, { status: 400 });
  }

  if (norm.segments.length < 2 || !WRITE_VERBS.has(norm.segments[0])) {
    return NextResponse.json({ success: false, message: "Path is not a write endpoint." }, { status: 400 });
  }
  const m = (method ?? "POST").toUpperCase();
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(m)) {
    return NextResponse.json({ success: false, message: "Method not allowed." }, { status: 400 });
  }

  // ── THE TABLE, APPLIED. Unlisted == refused. ─────────────────────────────
  const found = lookupRule(norm.segments);
  if (!found) {
    return NextResponse.json(
      {
        success: false,
        message:
          `This write endpoint is not registered with the sandbox guard, so it is refused. ` +
          `Add "${norm.segments.slice(0, 2).join("/")}" to WRITE_REGISTRY in /api/crud with an explicit ` +
          `band-or-open disposition before using it.`,
      },
      { status: 403 },
    );
  }
  const rule = found.rule;

  if (rule.kind === "band") {
    // Destructive workflow/order writes only go anywhere when BACKEND_URL points
    // at the local sandbox Postgres (anuprerna-pg via :8090) — i.e. local dev or
    // the VPS itself. Any other BACKEND_URL (a publicly reachable tunnel for a
    // Vercel deploy, or a future non-sandbox backend) is refused before it can
    // reach the native endpoint.
    if (!isSandboxBackend()) {
      return NextResponse.json(
        { success: false, message: `Editing a ${rule.entity} is disabled outside the local sandbox.` },
        { status: 403 },
      );
    }
    // Inside a banded family an id-in-PATH route must parse EXACTLY as
    // `<verb>/<entity>/<digits>` with no query string and no extra segment.
    // Anything else is REJECTED, never forwarded: an anchored regex simply
    // failed to match a path with a trailing segment or a query string and let
    // it fall through completely unguarded. "Did not parse" must mean "refuse".
    const depth = found.key.split("/").length;
    const extra = norm.segments.slice(depth);
    // A route whose id travels ONLY in the path must carry EXACTLY one numeric
    // segment (the delete family). A route that also accepts a body id may carry
    // none — `update/workflow` sends { id } in the body — but any segment it does
    // carry still has to be a plain id. A query string is never part of a banded
    // write and would be a second, unguarded way to address a row.
    const onlyPathIds = rule.ids.every((s) => "at" in s);
    const shapeOk = onlyPathIds
      ? extra.length === 1 && /^\d+$/.test(extra[0])
      : extra.every((s) => /^\d+$/.test(s));
    if (!shapeOk || norm.query) {
      return NextResponse.json(
        {
          success: false,
          message: onlyPathIds
            ? `Malformed ${rule.entity} path — expected ${found.key}/<numeric id>.`
            : `Malformed ${rule.entity} path — unexpected extra segments or query string.`,
        },
        { status: 400 },
      );
    }
    const targets = collectBandIds(rule, norm.segments, body);
    if (!targets.ok) {
      return NextResponse.json({ success: false, message: targets.message }, { status: 400 });
    }
    if (!targets.ids.every((id) => isSandboxId(id))) {
      return NextResponse.json(
        { success: false, message: sandboxRefusal(rule.verb, rule.entity) },
        { status: 403 },
      );
    }
  }

  // ── Server-DERIVED identity on the write body ────────────────────────────
  // Two families carry an actor, and in both the actor is resolved HERE from the
  // session — never accepted from the caller, because anything that can reach
  // this forwarder could otherwise write under any name.
  let forwardBody = body;
  let forwardQuery = norm.query;

  const bodyIsObject = body === undefined || body === null || (typeof body === "object" && !Array.isArray(body));
  if ((found.key === "add/workflow-comment" || SIGN_OFF_PATHS.has(found.key)) && !bodyIsObject) {
    return NextResponse.json(
      { success: false, message: "Write body must be a JSON object." },
      { status: 400 },
    );
  }

  if (found.key === "add/workflow-comment") {
    const author = await deriveCommentAuthor();
    if (!author.ok) {
      return NextResponse.json({ success: false, message: author.message }, { status: 401 });
    }
    // authorName written LAST so a caller-supplied one is overwritten, not merged.
    forwardBody = { ...((body as Record<string, unknown>) ?? {}), authorName: author.authorName };
  }

  if (SIGN_OFF_PATHS.has(found.key)) {
    const signer = await resolveSignOff();
    if (!signer.ok) {
      return NextResponse.json({ success: false, message: signer.message }, { status: 401 });
    }
    // THE TRAP THIS EXISTS TO AVOID: on all three element-feedback routes the
    // acting tenant is read from the QUERY STRING (`@Query('tenantId')` in
    // workflow.controller.ts), NOT from the body. A `tenantId` or `approvedBy`
    // sent in the body is silently ignored and the write answers HTTP 200 with
    // relational.element_feedback.approved_by left NULL — a sign-off that looks
    // recorded and is not. So the tenant is set on the QUERY here, and any
    // caller-supplied tenantId in either place is DISCARDED first.
    const qp = new URLSearchParams(norm.query);
    qp.delete("tenantId");
    qp.set("tenantId", String(signer.tenantId));
    forwardQuery = qp.toString();

    const inBody = { ...((forwardBody as Record<string, unknown>) ?? {}) };
    delete inBody.tenantId;
    delete inBody.approvedBy;
    delete inBody.uploadedBy;
    delete inBody.uploader;
    // WHO signed, in words, on the record itself. approved_by is a bare tenant id
    // and this sandbox cannot resolve a Weave login to a Loom tenant (loom_tenant
    // stores an AES-ciphertext email and the key is not in the sandbox), so the
    // NAME is what makes the row readable — and the name was the whole complaint.
    // Written server-side and LAST, so it cannot be spoofed from the client.
    if (found.key === SIGN_OFF_CREATE) {
      const note = typeof inBody.text === "string" ? inBody.text.trim() : "";
      inBody.text = signer.stamp + (note ? " — " + note : "");
    }
    forwardBody = inBody;
  }

  const token = await getServiceToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Service token unavailable." }, { status: 503 });
  }

  try {
    // DELETE routes are usually id-in-URL with no body (e.g. delete/x/:id), but
    // cancel/order and cancel/custom-order are DELETE-with-body — forward the
    // body whenever one was actually supplied, regardless of method.
    // forwardBody, not body: the identity paths above replace it with a
    // server-attributed copy, and the string that was guarded must be the string
    // that is sent.
    const hasBody = forwardBody !== undefined && forwardBody !== null;
    // Forward the NORMALISED path, re-encoded from the very segments the guards
    // above ran on — same URL, guarded and forwarded.
    const target = forwardQuery ? `${norm.target}?${forwardQuery}` : norm.target;
    const res = await fetch(`${BACKEND}/${target}`, {
      method: m,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      ...(m === "DELETE"
        ? (hasBody ? { body: JSON.stringify(forwardBody) } : {})
        : { body: JSON.stringify(forwardBody ?? {}) }),
      cache: "no-store",
    });
    const data = rewriteBloomscorpUrlsDeep(await res.json().catch(() => ({ success: res.ok })));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : "Write failed." },
      { status: 502 },
    );
  }
}
