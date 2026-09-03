/**
 * loadOrBanner is the pattern 22 server pages use to turn a failed backend read
 * into something an operator can act on. Two properties matter and nothing else:
 *
 *   1. a BackendFetchError becomes a VISIBLE banner carrying the classified
 *      message — an empty table would be a lie, because "the backend refused"
 *      and "there are no rows" are different facts,
 *   2. any OTHER exception still propagates to Next's error boundary —
 *      swallowing a real bug here would recreate the silent-failure class this
 *      helper exists to remove.
 */
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BackendFetchError } from "./backend-fetch-error";

// The real shell is a heavy "use client" component (next/navigation, icons);
// the banner itself is deliberately NOT mocked, so this asserts the real markup.
vi.mock("@/components/weave/WeaveShell", () => ({
  WeaveShell: ({ children }: { children: React.ReactNode }) => <div id="shell">{children}</div>,
}));

const { loadOrBanner } = await import("./load-or-banner");

describe("loadOrBanner", () => {
  it("renders the loaded data when the read succeeds", async () => {
    const node = await loadOrBanner(
      async () => ["a", "b"],
      (rows) => <ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul>,
    );

    expect(renderToStaticMarkup(node as React.ReactElement)).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  it("renders the classified message as an alert instead of an empty list", async () => {
    const err = new BackendFetchError(
      "auth",
      "http://localhost:8090/get/artisans",
      "[artisans-api] Backend rejected authentication (401)…",
      401,
    );

    const node = await loadOrBanner(
      async () => {
        throw err;
      },
      () => <table />,
    );
    const html = renderToStaticMarkup(node as React.ReactElement);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Backend rejected authentication (401)");
    expect(html).not.toContain("<table");
  });

  it("banners an envelope rejection too — a refusal is not 'no rows'", async () => {
    const node = await loadOrBanner(
      async () => {
        throw new BackendFetchError("rejected", "/x", "[admin-api] tenant not permitted", 200);
      },
      () => <table />,
    );

    expect(renderToStaticMarkup(node as React.ReactElement)).toContain("tenant not permitted");
  });

  it("lets a genuine bug in the loader propagate rather than disguising it as a backend outage", async () => {
    await expect(
      loadOrBanner(
        async () => {
          throw new TypeError("cannot read properties of undefined");
        },
        () => null,
      ),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("does NOT catch an exception thrown by render — only the load is guarded", async () => {
    await expect(
      loadOrBanner<number[]>(
        async () => [],
        () => {
          throw new BackendFetchError("server", "/x", "thrown from render", 500);
        },
      ),
    ).rejects.toThrow("thrown from render");
  });
});
