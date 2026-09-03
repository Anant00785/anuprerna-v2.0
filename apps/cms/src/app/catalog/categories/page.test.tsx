import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";

// The page only needs a token; neither source is under test here.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/loom-service-token", () => ({ getServiceToken: async () => "tok" }));

// WeaveShell is the app chrome (nav, usePathname) — stubbed so the assertions
// are about the page's data state, not the layout.
vi.mock("@/components/weave/WeaveShell", () => ({
  WeaveShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("./CategoriesClient", () => ({
  CategoriesClient: ({ items }: { items: unknown[] }) => (
    <div data-testid="list">rows:{items.length}</div>
  ),
}));

import CategoriesPage from "./page";

async function renderPage() {
  return renderToStaticMarkup((await CategoriesPage()) as React.ReactElement);
}

describe("/catalog/categories", () => {
  it("renders the list when the backend answers normally", async () => {
    useHandlers(
      http.get("*/get/category-list", () =>
        HttpResponse.json(envelope("categoryList", [{ id: 1, name: "Sarees" }, { id: 2, name: "Kurtas" }])),
      ),
    );

    const html = await renderPage();

    expect(html).toContain("rows:2");
    expect(html).not.toContain("Failed to load");
  });

  it("renders an ERROR STATE, not an empty list, when the backend rejects the envelope", async () => {
    useHandlers(
      http.get("*/get/category-list", () => HttpResponse.json(errorEnvelope("catalog list unavailable"))),
    );

    const html = await renderPage();

    // The regression this guards: the page used to render `rows:0`, which reads
    // as "there are no categories" instead of "the backend refused".
    expect(html).toContain("Failed to load");
    expect(html).toContain("catalog list unavailable");
    expect(html).not.toContain("rows:0");
  });

  it("renders an error state on an HTTP failure too", async () => {
    useHandlers(http.get("*/get/category-list", () => new HttpResponse(null, { status: 500 })));

    const html = await renderPage();

    expect(html).toContain("Failed to load");
    expect(html).not.toContain("data-testid=\"list\"");
  });
});
