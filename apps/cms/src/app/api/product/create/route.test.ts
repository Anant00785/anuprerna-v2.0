/**
 * /api/product/create and /api/product/save are the CMS's product write path.
 * They are byte-similar bridges that differ in exactly two ways — the upstream
 * verb (POST vs PATCH) and the endpoint family (/add/* vs /update/*) — and
 * getting either of those crossed would either create a duplicate row on every
 * save or silently no-op a create. That pairing is what these tests hold.
 *
 * They also pin the two failure behaviours a form depends on: the upstream
 * status is PROPAGATED (a rejected write must not read as a success), and an
 * unreachable backend answers 503 with a message rather than throwing.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server, useHandlers } from "@/test/msw";

let sessionToken: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "weave_token" && sessionToken ? { name, value: sessionToken } : undefined,
  }),
}));

import { POST as create } from "./route";
import { POST as save } from "../save/route";

type Handler = (req: NextRequest) => Promise<Response>;

function call(handler: Handler, body: unknown): Promise<Response> {
  return handler(
    new NextRequest("http://localhost:3004/api/product/create", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  ) as unknown as Promise<Response>;
}

function captureUpstream(
  status = 200,
  payload: Record<string, unknown> = { success: true, id: 1_000_000_001 },
) {
  const seen: { url: string; method: string; body: unknown; auth: string | null; origin: string | null }[] = [];
  server.use(
    http.all("http://localhost:8090/*", async ({ request }) => {
      seen.push({
        url: request.url,
        method: request.method,
        body: await request.json().catch(() => null),
        auth: request.headers.get("authorization"),
        origin: request.headers.get("origin"),
      });
      return HttpResponse.json(payload, { status });
    }),
  );
  return seen;
}

const PAYLOAD = { name: "Ikat Stole", sku: "IK-001", price: 2400, productGroup: "fabric" };

describe("/api/product/create vs /api/product/save", () => {
  beforeEach(() => {
    sessionToken = "session.jwt.value";
  });

  it("create POSTs to /add/fabric-product with the payload forwarded verbatim", async () => {
    const seen = captureUpstream();

    const res = await call(create, { type: "fabric", payload: PAYLOAD });

    expect(res.status).toBe(200);
    expect(seen[0].method).toBe("POST");
    expect(seen[0].url).toBe("http://localhost:8090/add/fabric-product");
    expect(seen[0].body).toEqual(PAYLOAD);
  });

  it("create routes a finished product to /add/finished-product", async () => {
    const seen = captureUpstream();

    await call(create, { type: "finished", payload: PAYLOAD });

    expect(seen[0].url).toBe("http://localhost:8090/add/finished-product");
  });

  it("save PATCHes to /update/fabric-product — a different verb AND a different family", async () => {
    const seen = captureUpstream();

    await call(save, { type: "fabric", payload: { ...PAYLOAD, id: 1_000_000_001 } });

    expect(seen[0].method).toBe("PATCH");
    expect(seen[0].url).toBe("http://localhost:8090/update/fabric-product");
    expect(seen[0].body).toMatchObject({ id: 1_000_000_001 });
  });

  it("save routes a finished product to /update/finished-product", async () => {
    const seen = captureUpstream();

    await call(save, { type: "finished", payload: PAYLOAD });

    expect(seen[0].url).toBe("http://localhost:8090/update/finished-product");
  });

  it("forwards the session cookie as a bearer token and the Origin the backend validates on", async () => {
    const seen = captureUpstream();

    await call(create, { type: "fabric", payload: PAYLOAD });

    expect(seen[0].auth).toBe("Bearer session.jwt.value");
    expect(seen[0].origin).toBe("localhost");
  });

  it("still forwards, unauthenticated, when there is no session cookie — the backend is the authority", async () => {
    sessionToken = undefined;
    const seen = captureUpstream(401, { success: false, message: "unauthorized" });

    const res = await call(create, { type: "fabric", payload: PAYLOAD });

    expect(seen[0].auth).toBeNull();
    expect(res.status).toBe(401);
  });

  it.each([
    ["create", create],
    ["save", save],
  ])("%s rejects an unknown product type before reaching the backend", async (_n, handler) => {
    const res = await call(handler as Handler, { type: "custom", payload: PAYLOAD });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "type must be fabric or finished",
    });
  });

  it.each([
    ["create", create],
    ["save", save],
  ])("%s rejects a missing payload", async (_n, handler) => {
    const res = await call(handler as Handler, { type: "fabric" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ message: "payload is required" });
  });

  it("propagates a rejected write's status and message instead of reporting success", async () => {
    captureUpstream(409, { success: false, message: "sku already exists" });

    const res = await call(create, { type: "fabric", payload: PAYLOAD });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ success: false, message: "sku already exists" });
  });

  it("answers 503 with the cause when the backend is unreachable", async () => {
    useHandlers(http.all("http://localhost:8090/*", () => HttpResponse.error()));

    const res = await call(create, { type: "fabric", payload: PAYLOAD });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: expect.stringContaining("Backend unreachable"),
    });
  });

  it("does not report an empty backend body as a successful save", async () => {
    useHandlers(http.all("http://localhost:8090/*", () => new HttpResponse(null, { status: 200 })));

    const res = await call(save, { type: "fabric", payload: PAYLOAD });

    await expect(res.json()).resolves.toMatchObject({
      success: false,
      message: "Empty response from backend",
    });
  });
});
