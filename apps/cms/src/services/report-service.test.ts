import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers } from "@/test/msw";
import { ReportService } from "./report-service";

// jsdom does not implement these; ReportService.downloadReport uses them to
// trigger a browser file download, so they're stubbed for this test file only.
const clickSpy = vi.fn();
const originalCreateElement = document.createElement.bind(document);

afterEach(() => {
  vi.restoreAllMocks();
});

function stubDom() {
  // jsdom's URL doesn't implement createObjectURL/revokeObjectURL; add them
  // without replacing the URL constructor itself (axios relies on `new URL()`).
  if (!("createObjectURL" in URL)) {
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:mock"), configurable: true });
  }
  if (!("revokeObjectURL" in URL)) {
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
  }
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === "a") vi.spyOn(el, "click").mockImplementation(clickSpy);
    return el;
  });
}

describe("ReportService.downloadReport", () => {
  it("POSTs the config to /download/report/:type as a blob request", async () => {
    stubDom();
    let capturedPath = "";
    let capturedBody: unknown;
    useHandlers(
      http.post("*/download/report/FABRIC_STOCK", async ({ request }) => {
        capturedPath = new URL(request.url).pathname;
        capturedBody = await request.json();
        return HttpResponse.text("id,name\n1,Cotton", {
          headers: { "content-type": "text/csv" },
        });
      })
    );

    await ReportService.downloadReport("FABRIC_STOCK", { includeDisabled: false }, "fabric_inventory_report");

    expect(capturedPath).toBe("/api/backend/download/report/FABRIC_STOCK");
    expect(capturedBody).toEqual({ includeDisabled: false });
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("uses the filename from the content-disposition header when present", async () => {
    stubDom();
    let capturedFilename = "";
    useHandlers(
      http.post("*/download/report/FINISHED_STOCK", () =>
        HttpResponse.text("id,name\n1,Silk", {
          headers: {
            "content-type": "text/csv",
            "content-disposition": 'attachment; filename="finished_stock_custom.csv"',
          },
        })
      )
    );
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        vi.spyOn(el, "click").mockImplementation(clickSpy);
        Object.defineProperty(el, "download", {
          set(value: string) {
            capturedFilename = value;
          },
          get() {
            return capturedFilename;
          },
        });
      }
      return el;
    });

    await ReportService.downloadReport("FINISHED_STOCK", { includeDisabled: true }, "finished_inventory_report");

    expect(capturedFilename).toBe("finished_stock_custom.csv");
  });
});
