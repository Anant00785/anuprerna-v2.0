/**
 * The report is CSV, not PDF — Loom's ReportController streams `text/csv` and
 * FabricStockReport/FinishedStockReport write rows with a PrintWriter. These
 * specs pin the Java header strings and the `%.2f` formatting, and check that a
 * genuine zero is rendered as 0.00 rather than replaced by a default.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ReportService } from "./report.service.js";
import type { ReportRepository } from "../repository/report.repository.js";
import { ReportType } from "../types/report.types.js";

function make(fabric: unknown[] = [], finished: unknown[] = []) {
  const repo = {
    getFabricStock: vi.fn(async () => fabric),
    getFinishedStock: vi.fn(async () => finished),
  };
  return { repo, service: new ReportService(repo as unknown as ReportRepository) };
}

describe("ReportService.renderReport — FABRIC_STOCK", () => {
  it("emits Java's exact header row", async () => {
    const { service } = make();
    const csv = await service.renderReport(ReportType.FABRIC_STOCK, { includeDisabled: false });
    expect(csv.split("\n")[0]).toBe(
      "ID, Name, SKU, Zoho Item ID, Zoho Quantity, External Quantity, Total Quantity, Price, Disabled",
    );
  });

  it("formats each row as Java's %d,%s,%s,%s,%.2f,%.2f,%.2f,%.2f,%b", async () => {
    const { service } = make([
      {
        productId: 7,
        productName: "Cotton A",
        productSku: "SKU-1",
        zohoItemId: "Z1",
        quantity: 100.5,
        externalQuantity: 2.25,
        price: 1999.9,
        disabled: false,
      },
    ]);
    const csv = await service.renderReport(ReportType.FABRIC_STOCK, { includeDisabled: false });
    expect(csv.split("\n")[1]).toBe("7,Cotton A,SKU-1,Z1,100.50,2.25,102.75,1999.90,false");
  });

  it("renders a genuine zero as 0.00 instead of a fabricated default", async () => {
    const { service } = make([
      {
        productId: 1,
        productName: "Zero",
        productSku: "S",
        zohoItemId: "",
        quantity: 0,
        externalQuantity: 0,
        price: 0,
        disabled: true,
      },
    ]);
    const csv = await service.renderReport(ReportType.FABRIC_STOCK, { includeDisabled: true });
    expect(csv.split("\n")[1]).toBe("1,Zero,S,,0.00,0.00,0.00,0.00,true");
  });

  it("passes includeDisabled straight through to the query", async () => {
    const { service, repo } = make();
    await service.renderReport(ReportType.FABRIC_STOCK, { includeDisabled: true });
    expect(repo.getFabricStock).toHaveBeenCalledWith({ includeDisabled: true });
  });
});

describe("ReportService.renderReport — FINISHED_STOCK", () => {
  it("emits Java's exact header row", async () => {
    const { service } = make();
    const csv = await service.renderReport(ReportType.FINISHED_STOCK, { includeDisabled: false });
    expect(csv.split("\n")[0]).toBe(
      "ID, Name, SKU, Zoho Item ID, Zoho Quantity, Total Quantity, Disabled",
    );
  });

  it("repeats the resolved size-profile quantity in both quantity columns, as Java does", async () => {
    const { service } = make([], [
      {
        productId: 3,
        productName: "Shirt",
        sku: "SH-M",
        zohoItemId: "Z9",
        zohoQuantity: 12,
        disabled: false,
      },
    ]);
    const csv = await service.renderReport(ReportType.FINISHED_STOCK, { includeDisabled: false });
    expect(csv.split("\n")[1]).toBe("3,Shirt,SH-M,Z9,12.00,12.00,false");
  });

  it("renders 0.00 when no size profile matched the relation's sku", async () => {
    const { service } = make([], [
      { productId: 4, productName: "X", sku: "S", zohoItemId: "", zohoQuantity: 0, disabled: false },
    ]);
    const csv = await service.renderReport(ReportType.FINISHED_STOCK, { includeDisabled: false });
    expect(csv.split("\n")[1]).toBe("4,X,S,,0.00,0.00,false");
  });
});

describe("ReportService.renderReport — unsupported types", () => {
  it("rejects an unknown type — ReportFactoryService throws IllegalArgumentException", async () => {
    const { service } = make();
    await expect(
      service.renderReport("NOT_A_REPORT" as ReportType, { includeDisabled: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("emits only the header when there are no rows, never placeholder data", async () => {
    const { service } = make([], []);
    const csv = await service.renderReport(ReportType.FABRIC_STOCK, { includeDisabled: false });
    expect(csv.split("\n").filter((l) => l.length > 0)).toHaveLength(1);
  });
});
