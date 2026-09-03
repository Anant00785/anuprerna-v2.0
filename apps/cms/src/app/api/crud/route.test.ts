/**
 * /api/crud is the ONLY authenticated write forwarder in the CMS: every CRUD
 * form in the app posts { path, method, body } here and this route decides
 * whether the write reaches the backend at all.
 *
 * It is therefore the highest-risk untested unit in the app, and these tests
 * are about the GUARDS, not the plumbing:
 *
 *   1. the registry fails CLOSED (an unlisted path is refused),
 *   2. the string that is guarded is the string that is forwarded
 *      (normalizeCrudPath — the whole percent-encoding bypass class),
 *   3. the sandbox floor actually stops a write to a live-mirrored row,
 *   4. actor identity is DERIVED server-side and a caller-supplied one is
 *      overwritten, not merged,
 *   5. the element-feedback sign-off tenant lands on the QUERY STRING, which
 *      is the documented trap (a body tenantId is silently ignored by the
 *      backend and the sign-off records with approved_by NULL).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server, useHandlers } from "@/test/msw";
import { SANDBOX_FLOOR } from "@/lib/sandbox-floor";

// The session cookies the route reads through getIdentity()/resolveSignOff().
let cookieJar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar[name] !== undefined ? { name, value: cookieJar[name] } : undefined,
  }),
}));

vi.mock("@/lib/loom-service-token", () => ({
  getServiceToken: async () => serviceToken,
}));
let serviceToken: string | null = "svc-token";

import { POST } from "./route";

function signedIn(email = "amit@anuprerna.com", name = "Amit Singha") {
  cookieJar["weave_token"] = "header.payload.signature";
  cookieJar["weave_user"] = Buffer.from(JSON.stringify({ email, name })).toString("base64");
}

function post(body: unknown): Promise<Response> {
  return POST(
    new NextRequest("http://localhost:3004/api/crud", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  ) as unknown as Promise<Response>;
}

/** A row the sandbox minted itself — destructive writes on these are allowed. */
const SANDBOX_ID = SANDBOX_FLOOR + 42;
/** A row mirrored from live Loom — destructive writes on these must be refused. */
const LIVE_ID = 133048758;

/** Record what actually left the process, so a guard can be checked against the
 *  forwarded URL rather than against what the route claims it did. */
function captureForward(status = 200, payload: Record<string, unknown> = { success: true }) {
  const seen: { url: string; method: string; body: string | null; auth: string | null }[] = [];
  server.use(
    http.all("http://localhost:8090/*", async ({ request }) => {
      seen.push({
        url: request.url,
        method: request.method,
        body: await request.text().then((t) => t || null),
        auth: request.headers.get("authorization"),
      });
      return HttpResponse.json(payload, { status });
    }),
  );
  return seen;
}

describe("/api/crud — registry fails closed", () => {
  beforeEach(() => {
    cookieJar = {};
    serviceToken = "svc-token";
  });

  it("refuses a write path that is not in WRITE_REGISTRY", async () => {
    // No MSW handler registered on purpose: if this forwarded, the test would
    // fail with an unhandled-request error instead of passing quietly.
    const res = await post({ path: "delete/loom-tenant/5" });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: expect.stringContaining("not registered with the sandbox guard"),
    });
  });

  it("refuses a path whose first segment is not a write verb", async () => {
    const res = await post({ path: "get/workflow-list/CREATED" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "Path is not a write endpoint." });
  });

  it("refuses an uppercase VERB outright — WRITE_VERBS is case-sensitive and fails closed", async () => {
    const res = await post({ path: "UPDATE/workflow", body: { id: LIVE_ID } });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "Path is not a write endpoint." });
  });

  it("refuses an HTTP method outside POST/PATCH/PUT/DELETE", async () => {
    const res = await post({ path: "add/workflow", method: "GET" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "Method not allowed." });
  });

  it("refuses a relative segment rather than forwarding a traversal", async () => {
    const res = await post({ path: "update/../get/workflow-list/CREATED" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Path contains a relative segment.",
    });
  });

  it("returns 503 when no service token can be minted, rather than forwarding unauthenticated", async () => {
    serviceToken = null;
    const res = await post({ path: "add/workflow", body: { name: "x" } });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ message: "Service token unavailable." });
  });
});

describe("/api/crud — the sandbox floor", () => {
  beforeEach(() => {
    cookieJar = {};
    serviceToken = "svc-token";
  });

  it("refuses an UPDATE of a live-mirrored workflow template (the backend does NOT guard this route)", async () => {
    const res = await post({
      path: "update/workflow-template",
      method: "PATCH",
      body: { id: 490267, name: "renamed" },
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      message: "sandbox-only write: refusing to edit a live-synced workflow template",
    });
  });

  it("allows the same UPDATE once the id is above the sandbox floor", async () => {
    const seen = captureForward();

    const res = await post({
      path: "update/workflow-template",
      method: "PATCH",
      body: { id: SANDBOX_ID, name: "renamed" },
    });

    expect(res.status).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe("PATCH");
    expect(seen[0].url).toBe("http://localhost:8090/update/workflow-template");
    expect(seen[0].auth).toBe("Bearer svc-token");
    expect(JSON.parse(seen[0].body!)).toEqual({ id: SANDBOX_ID, name: "renamed" });
  });

  it("refuses a banded write that carries NO id at all — 'did not parse' means refuse", async () => {
    const res = await post({ path: "update/workflow-template", method: "PATCH", body: {} });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("carries no id"),
    });
  });

  it("refuses a non-integer id rather than letting Number() coerce it past the floor", async () => {
    // 1e13 is numerically above the floor; the string form must still be refused.
    const res = await post({
      path: "update/workflow-template",
      method: "PATCH",
      body: { id: "1e13" },
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("expected a plain positive integer"),
    });
  });

  it("checks EVERY id source a rule declares, so a sandbox id in one slot cannot smuggle a live id in another", async () => {
    // update/workflow bands { at: 2 }, { body: id }, { body: workflowId }.
    const res = await post({
      path: `update/workflow/${SANDBOX_ID}`,
      method: "PATCH",
      body: { id: SANDBOX_ID, workflowId: LIVE_ID },
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("refusing to edit a live-synced workflow"),
    });
  });

  it("bands a case-varied path — the backend routes update/WORKFLOW to the same handler", async () => {
    const res = await post({ path: "update/WORKFLOW", method: "PATCH", body: { id: LIVE_ID } });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("refusing to edit a live-synced workflow"),
    });
  });
});

describe("/api/crud — the guarded string is the forwarded string", () => {
  beforeEach(() => {
    cookieJar = {};
    serviceToken = "svc-token";
  });

  it("does not let an ENCODED '?' become a real query delimiter and truncate the id", async () => {
    // `1%3Fx` must stay ONE segment. If it were decoded before the split, the
    // guard would inspect id "1" (sub-floor -> refused) while the forwarder sent
    // `.../1?x`. Either outcome is fine as long as it is NOT a silent forward of
    // a different URL; the shape check rejects it because it is not plain digits.
    const res = await post({ path: "delete/workflow-template/1%3Fx", method: "DELETE" });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("not registered with the sandbox guard"),
    });
  });

  it("does not let an encoded '/' split a segment into an extra path level", async () => {
    const res = await post({ path: `delete/workflow/%2F${SANDBOX_ID}`, method: "DELETE" });

    // Refused as an unrecognised route, NOT forwarded as `delete/workflow/<id>`.
    expect(res.status).toBe(403);
  });

  it("refuses a query string on a banded write — a second, unguarded way to address a row", async () => {
    const res = await post({
      path: `delete/workflow-template/${SANDBOX_ID}?id=${LIVE_ID}`,
      method: "DELETE",
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: expect.stringContaining("expected delete/workflow-template/<numeric id>"),
    });
  });

  it("forwards a delete with the id in the path and no body", async () => {
    const seen = captureForward();

    const res = await post({ path: `delete/workflow-template/${SANDBOX_ID}`, method: "DELETE" });

    expect(res.status).toBe(200);
    expect(seen[0].method).toBe("DELETE");
    expect(seen[0].url).toBe(`http://localhost:8090/delete/workflow-template/${SANDBOX_ID}`);
    expect(seen[0].body).toBeNull();
  });

  it("forwards a body on DELETE when one is supplied (cancel/order takes a cancellationReason)", async () => {
    const seen = captureForward();

    await post({
      path: "cancel/order",
      method: "DELETE",
      body: { orderId: SANDBOX_ID, cancellationReason: "customer changed mind" },
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe("DELETE");
    expect(JSON.parse(seen[0].body!)).toEqual({
      orderId: SANDBOX_ID,
      cancellationReason: "customer changed mind",
    });
  });

  it("propagates the backend's status and message instead of reporting a failed write as a success", async () => {
    captureForward(409, { success: false, message: "workflow already completed" });

    const res = await post({ path: "add/workflow", body: { name: "x" } });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: "workflow already completed",
    });
  });

  it("answers 502 rather than a bare success when the backend is unreachable", async () => {
    useHandlers(http.all("http://localhost:8090/*", () => HttpResponse.error()));

    const res = await post({ path: "add/workflow", body: { name: "x" } });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });
});

describe("/api/crud — server-derived actor identity", () => {
  beforeEach(() => {
    cookieJar = {};
    serviceToken = "svc-token";
  });

  it("overwrites a caller-supplied authorName on add/workflow-comment with the session's", async () => {
    signedIn("amit@anuprerna.com", "Amit Singha");
    const seen = captureForward();

    await post({
      path: "add/workflow-comment",
      body: { workflowId: 5, text: "hi", authorName: "Someone Else" },
    });

    expect(JSON.parse(seen[0].body!)).toEqual({
      workflowId: 5,
      text: "hi",
      authorName: "Amit Singha",
    });
  });

  it("refuses an unauthenticated comment rather than attributing it to nobody", async () => {
    const res = await post({ path: "add/workflow-comment", body: { workflowId: 5, text: "hi" } });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ message: "Sign in to post a comment." });
  });

  it("rejects a non-object body on an identity-bearing path instead of spreading a string", async () => {
    signedIn();
    const res = await post({ path: "add/workflow-comment", body: ["not", "an", "object"] });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "Write body must be a JSON object.",
    });
  });
});

describe("/api/crud — QC sign-off (element feedback)", () => {
  beforeEach(() => {
    cookieJar = {};
    serviceToken = "svc-token";
  });

  it("puts tenantId on the QUERY STRING — a body tenantId is ignored by the backend and records approved_by NULL", async () => {
    signedIn("qa@anuprerna.com", "QA Person");
    const seen = captureForward();

    await post({
      path: "add/element/feedback",
      body: { elementId: 9, text: "looks good", tenantId: 1, approvedBy: 1 },
    });

    const url = new URL(seen[0].url);
    expect(url.pathname).toBe("/add/element/feedback");
    // The DEFAULT sign-off tenant, derived server-side — not the caller's 1.
    expect(url.searchParams.get("tenantId")).toBe("23483");

    const body = JSON.parse(seen[0].body!);
    expect(body.tenantId).toBeUndefined();
    expect(body.approvedBy).toBeUndefined();
  });

  it("stamps WHO signed into the record text, ahead of the operator's own note", async () => {
    signedIn("qa@anuprerna.com", "QA Person");
    const seen = captureForward();

    await post({ path: "add/element/feedback", body: { elementId: 9, text: "looks good" } });

    expect(JSON.parse(seen[0].body!).text).toBe(
      "Signed off by QA Person (qa@anuprerna.com) — looks good",
    );
  });

  it("discards a caller-supplied tenantId already on the query rather than appending a second one", async () => {
    signedIn("qa@anuprerna.com", "QA Person");
    const seen = captureForward();

    await post({
      path: "update/element/feedback?tenantId=1&status=APPROVED",
      method: "PATCH",
      body: { id: 3, status: "APPROVED" },
    });

    const params = new URL(seen[0].url).searchParams;
    expect(params.getAll("tenantId")).toEqual(["23483"]);
    expect(params.get("status")).toBe("APPROVED");
  });

  it("refuses a sign-off with no session — an approval with no actor is the thing being fixed", async () => {
    const res = await post({ path: "add/element/feedback", body: { elementId: 9, text: "ok" } });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      message: "Sign in to record a sign-off.",
    });
  });
});
