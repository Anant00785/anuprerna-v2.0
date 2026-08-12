import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { getBaseUrl, buildUrl, apiRequest } from "./client";
import { env } from "@/env";
import { useHandlers, PROXY_BASE } from "@/test/msw";

// jsdom always defines `window`, so getBaseUrl's browser branch is the only
// one reachable without manipulating globals. We delete/restore `window` to
// exercise the server branch, matching how these functions actually run in a
// Next.js server component vs. the browser (see docs/DATA-FLOW.md §1).
function withoutWindow<T>(fn: () => T): T {
  const original = globalThis.window;
  // @ts-expect-error -- deliberately simulating a non-browser runtime
  delete globalThis.window;
  try {
    return fn();
  } finally {
    globalThis.window = original;
  }
}

describe("getBaseUrl", () => {
  it("always returns the Next proxy path in the browser, regardless of mode", () => {
    expect(getBaseUrl("legacy")).toBe("/api/backend");
    expect(getBaseUrl("nest")).toBe("/api/backend");
    expect(getBaseUrl()).toBe("/api/backend");
  });

  it("on the server, resolves the legacy Spring Boot URL for legacy mode", () => {
    withoutWindow(() => {
      expect(getBaseUrl("legacy")).toBe(env.NEXT_PUBLIC_SPRINGBOOT_API_URL);
    });
  });

  it("on the server, resolves the Nest URL for nest mode", () => {
    withoutWindow(() => {
      expect(getBaseUrl("nest")).toBe(env.NEXT_PUBLIC_NEST_API_URL);
    });
  });

  it("on the server with no mode argument, defaults to env.NEXT_PUBLIC_API_MODE (legacy)", () => {
    withoutWindow(() => {
      expect(getBaseUrl()).toBe(env.NEXT_PUBLIC_SPRINGBOOT_API_URL);
    });
  });
});

describe("buildUrl", () => {
  it("adds a leading slash to an endpoint that lacks one", () => {
    expect(buildUrl("foo/bar")).toBe("/api/backend/foo/bar");
  });

  it("does not double a leading slash the endpoint already has", () => {
    expect(buildUrl("/foo/bar")).toBe("/api/backend/foo/bar");
  });

  it("strips a trailing slash from the base URL before joining", () => {
    const original = env.NEXT_PUBLIC_SPRINGBOOT_API_URL;
    env.NEXT_PUBLIC_SPRINGBOOT_API_URL = "https://example.test/base/";
    try {
      withoutWindow(() => {
        expect(buildUrl("foo", "legacy")).toBe("https://example.test/base/foo");
      });
    } finally {
      env.NEXT_PUBLIC_SPRINGBOOT_API_URL = original;
    }
  });
});

describe("apiRequest", () => {
  it("issues a GET by default and returns the parsed JSON body", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/ping`, () => HttpResponse.json({ pong: true }))
    );
    const result = await apiRequest<{ pong: boolean }>("ping");
    expect(result).toEqual({ pong: true });
  });

  it("sends provided params as a query string, omitting undefined/null values", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/search`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ ok: true });
      })
    );
    await apiRequest("search", {
      params: { q: "silk", page: 2, missing: undefined, empty: null as unknown as undefined },
    });
    expect(capturedUrl?.searchParams.get("q")).toBe("silk");
    expect(capturedUrl?.searchParams.get("page")).toBe("2");
    expect(capturedUrl?.searchParams.has("missing")).toBe(false);
    expect(capturedUrl?.searchParams.has("empty")).toBe(false);
  });

  it("sends default Content-Type/Accept headers, overridable by caller headers", async () => {
    let capturedHeaders: Headers | undefined;
    useHandlers(
      http.get(`${PROXY_BASE}/headers`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({});
      })
    );
    await apiRequest("headers", { headers: { Accept: "text/plain" } });
    expect(capturedHeaders?.get("content-type")).toBe("application/json");
    expect(capturedHeaders?.get("accept")).toBe("text/plain");
  });

  it("forwards method and JSON body for a POST", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/submit`, async ({ request }) => {
        capturedMethod = request.method;
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      })
    );
    await apiRequest("submit", { method: "POST", body: JSON.stringify({ name: "x" }) });
    expect(capturedMethod).toBe("POST");
    expect(capturedBody).toEqual({ name: "x" });
  });

  it("throws an Error including the status and URL when the response is not OK", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/broken`, () =>
        HttpResponse.text("nope", { status: 500, statusText: "Internal Server Error" })
      )
    );
    await expect(apiRequest("broken")).rejects.toThrow(/API Error \[500\]/);
  });

  it("does not validate the response shape — a mismatched payload is returned as-is (cast, not parse)", async () => {
    interface Expected {
      id: string;
      name: string;
    }
    useHandlers(
      http.get(`${PROXY_BASE}/mismatched`, () => HttpResponse.json({ totallyDifferent: true }))
    );
    const result = await apiRequest<Expected>("mismatched");
    // TypeScript believes this is an Expected, but at runtime it is whatever
    // the server sent — apiRequest performs `response.json() as Promise<T>`,
    // a cast with zero runtime validation.
    expect((result as unknown as { totallyDifferent: boolean }).totallyDifferent).toBe(true);
    expect((result as unknown as Expected).id).toBeUndefined();
  });
});
