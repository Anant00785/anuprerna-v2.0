import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrderService } from "./order.service.js";

// This is the ONLY OrderService actually wired into the running app (see
// order.controller.spec.ts for the import trace). It adds zero logic of its
// own — `super(db, "order")` — so what ships in production for /get/order
// and /create/order is entirely CommerceDataService's generic behavior.
//
// IMPORTANT FINDING for the handoff: CommerceDataService.domainTable() only
// special-cases moduleName "product" -> "product" and "cart" -> "cart_item".
// "order" is NOT special-cased, so the live order endpoints do NOT read/write
// the real `orders` / `order_item` schema tables at all — they store
// arbitrary payloads as opaque JSON blobs in a generic `commerce_order`
// table with just (id, name, payload, created_at, updated_at). There is no
// order-attribution logic, no OrdersValidator, no forex snapshot, none of
// the addOrder business logic documented in 02-api-documentation.md §C —
// that logic exists nowhere in the live path. Characterizing the generic
// behavior actually shipped, per docs/TESTING.md §4 ("everything else:
// characterization").
describe("OrderService (live, generic-blob-table path since 'order' has no domainTable() mapping)", () => {
  let execute: ReturnType<typeof vi.fn>;
  let db: any;

  beforeEach(() => {
    execute = vi.fn().mockResolvedValue([]);
    db = { execute };
  });

  it("create() rejects a payload with no name (inherited CommerceDataService rule)", async () => {
    const service = new OrderService(db);
    // ensureTable()'s CREATE TABLE runs first and must succeed for the
    // BadRequestException below to come from extractName(), not a DB error.
    execute.mockResolvedValueOnce([]); // CREATE TABLE IF NOT EXISTS

    await expect(service.create({ notes: "no name field" })).rejects.toThrow(BadRequestException);
  });

  it("create() rejects a payload whose name is an empty/whitespace string", async () => {
    const service = new OrderService(db);
    execute.mockResolvedValueOnce([]); // CREATE TABLE

    await expect(service.create({ name: "   " })).rejects.toThrow(BadRequestException);
  });

  it("create() with a valid name persists into the generic commerce_order table and returns the inserted row", async () => {
    const service = new OrderService(db);
    const insertedRow = { id: 1n, name: "order-1", payload: { name: "order-1" } };
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([insertedRow]); // INSERT ... RETURNING

    await expect(service.create({ name: "order-1" })).resolves.toEqual(insertedRow);
  });

  it("findOne() throws NotFoundException naming the generic table when the id doesn't exist", async () => {
    const service = new OrderService(db);
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([]); // SELECT ... WHERE id = ? -> no rows

    await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
  });

  it("findOne() rejects a non-numeric id before touching the database", async () => {
    const service = new OrderService(db);

    await expect(service.findOne("not-a-number")).rejects.toThrow(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
  });

  it("getAll() returns whatever rows the generic blob table yields (no `orders`-schema mapping)", async () => {
    const service = new OrderService(db);
    const rows = [{ id: 1n, name: "a", payload: {} }];
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce(rows); // SELECT ...

    await expect(service.getAll()).resolves.toBe(rows);
  });

  it("update() returns the updated row when the id exists", async () => {
    const service = new OrderService(db);
    const updated = { id: 5n, name: "renamed", payload: { name: "renamed" } };
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([updated]); // UPDATE ... RETURNING

    await expect(service.update("5", { name: "renamed" })).resolves.toEqual(updated);
  });

  it("update() throws NotFoundException when the id does not exist", async () => {
    const service = new OrderService(db);
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([]); // UPDATE ... RETURNING -> no rows

    await expect(service.update("404", { name: "x" })).rejects.toThrow(NotFoundException);
  });

  it("remove() resolves without error when the id exists", async () => {
    const service = new OrderService(db);
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([{ id: 5n }]); // DELETE ... RETURNING id

    await expect(service.remove("5")).resolves.toBeUndefined();
  });

  it("remove() throws NotFoundException when the id does not exist", async () => {
    const service = new OrderService(db);
    execute
      .mockResolvedValueOnce([]) // CREATE TABLE
      .mockResolvedValueOnce([]); // DELETE ... RETURNING id -> no rows

    await expect(service.remove("404")).rejects.toThrow(NotFoundException);
  });
});
