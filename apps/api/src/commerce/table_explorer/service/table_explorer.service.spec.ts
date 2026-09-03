/**
 * apps/api/src/commerce/table_explorer/service/table_explorer.service.spec.ts
 *
 * The generic table-explorer handler passes the caller's tableName into
 * sql.identifier(...) — a physical relation address. The allowlist is the
 * blast door: a name outside it must be a 400 BEFORE any query is built, so a
 * super-user token can never dump arbitrary tables (payment, tenant,
 * verification_token) through this endpoint.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { TableExplorerService } from "./table_explorer.service.js";
import type { TableExplorerRepository } from "../repository/table_explorer.repository.js";
import { TABLE_EXPLORER_ALLOWLIST } from "../table_explorer.allowlist.js";

function make() {
  const repository = {
    getTableData: vi.fn(async () => [{ id: 1 }]),
    getTableDataCount: vi.fn(async () => 1),
    getTableRowById: vi.fn(async () => ({ id: 1 })),
  };
  return { repository, service: new TableExplorerService(repository as unknown as TableExplorerRepository) };
}

describe("TableExplorerService allowlist", () => {
  it("serves an allowlisted slug (orders) with pagination", async () => {
    const { service, repository } = make();

    const res = await service.getTableData("orders", 1, 20);

    expect(repository.getTableData).toHaveBeenCalledWith("orders", 20, 0);
    expect(res).toEqual({ data: [{ id: 1 }], pagination: { page: 1, size: 20, totalElements: 1, totalPages: 1 } });
  });

  it("rejects a non-allowlisted table name with 400 before any query runs", async () => {
    const { service, repository } = make();

    for (const name of ["pg_catalog.pg_tables", "payment_secrets", "customer;--", "loom_tenant_credentials"]) {
      await expect(service.getTableData(name, 1, 20)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.getTableRowById(name, "1")).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(repository.getTableData).not.toHaveBeenCalled();
    expect(repository.getTableRowById).not.toHaveBeenCalled();
  });

  it("getTableRowById honours the allowlist and returns null for a missing row", async () => {
    const { service, repository } = make();
    repository.getTableRowById.mockResolvedValue(null as never);

    await expect(service.getTableRowById("orders", "42")).resolves.toBeNull();
    expect(repository.getTableRowById).toHaveBeenCalledWith("orders", "42");
  });

  it("every allowlisted name passes the gate (no self-blocking typos)", async () => {
    const { service } = make();
    for (const name of TABLE_EXPLORER_ALLOWLIST) {
      await expect(service.getTableData(name, 1, 1)).resolves.toBeTruthy();
    }
  });
});
