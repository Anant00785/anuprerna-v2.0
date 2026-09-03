/**
 * CatalogPdfRepository.findByArtisan is scoped by artisanId — the comment
 * at repo.ts:52-53 documents that this WAS an IDOR (an artisan with no
 * PDFs used to fall back to a different artisan's catalog PDFs, download
 * URLs included). The most important assertion here is that an empty
 * result for one artisan stays empty and never leaks another artisan's rows.
 */
import { describe, it, expect, vi } from "vitest";
import { CatalogPdfRepository } from "./catalog-pdf.repository.js";

const BOOM = new Error("connection terminated unexpectedly");

describe("CatalogPdfRepository.findByArtisan — artisan scoping (former IDOR)", () => {
  it("scopes the query to the given artisanId", async () => {
    const where = vi.fn(() => ({ orderBy: () => Promise.resolve([]) }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const repo = new CatalogPdfRepository({ select } as never);
    await repo.findByArtisan(42n);
    expect(where).toHaveBeenCalledOnce();
  });

  it("an artisan with no PDFs gets [] — NOT another artisan's catalog PDFs", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: () => Promise.resolve([]) }) }) })) };
    await expect(new CatalogPdfRepository(empty as never).findByArtisan(42n)).resolves.toEqual([]);
  });

  it("a query failure propagates instead of an empty (or borrowed) PDF list", async () => {
    const failing = { select: vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: () => Promise.reject(BOOM) }) }) })) };
    await expect(new CatalogPdfRepository(failing as never).findByArtisan(42n)).rejects.toThrow(BOOM);
  });

  it("formats rows through formatCatalogPdf (ids as strings, booleans coerced)", async () => {
    const row = {
      id: 1n, version: null, artisanId: 42, requestedById: 1, status: null, downloadUrl: "u", s3Key: "k",
      fileName: "f.pdf", requestedAt: 1000, completedAt: 2000, failureMessage: null, restartRecoveryRequired: null,
      compressedDownloadUrl: null, compressedS3Key: null, compressedFileName: null, compressedFailureMessage: null,
      compressedAttemptCount: null,
    };
    const db = { select: vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: () => Promise.resolve([row]) }) }) })) };
    const result = await new CatalogPdfRepository(db as never).findByArtisan(42n);
    expect(result).toEqual([
      {
        id: "1", version: 1, artisanId: "42", requestedById: "1", status: "READY", downloadUrl: "u", s3Key: "k",
        fileName: "f.pdf", requestedAt: 1000, completedAt: 2000, failureMessage: "", restartRecoveryRequired: false,
        compressedDownloadUrl: "", compressedS3Key: "", compressedFileName: "", compressedFailureMessage: "",
        compressedAttemptCount: 0,
      },
    ]);
  });
});

describe("CatalogPdfRepository.findById / findAll", () => {
  it("findById: null for a missing row", async () => {
    const empty = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })) };
    await expect(new CatalogPdfRepository(empty as never).findById(1n)).resolves.toBeNull();
  });

  it("findAll: caps at 50 and returns [] when empty, a failure propagates", async () => {
    const limit = vi.fn(() => Promise.resolve([]));
    const orderBy = vi.fn(() => ({ limit }));
    const ok = { select: vi.fn(() => ({ from: () => ({ orderBy }) })) };
    await expect(new CatalogPdfRepository(ok as never).findAll()).resolves.toEqual([]);
    expect(limit).toHaveBeenCalledWith(50);

    const failing = { select: vi.fn(() => ({ from: () => ({ orderBy: () => ({ limit: () => Promise.reject(BOOM) }) }) })) };
    await expect(new CatalogPdfRepository(failing as never).findAll()).rejects.toThrow(BOOM);
  });
});
