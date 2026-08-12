import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";

/**
 * Database-backed store for migrated Commerce modules that do not yet have a
 * dedicated domain schema. Each module receives its own table and never falls
 * back to process memory, so data survives restarts and is visible to all API
 * instances using the same DATABASE_URL.
 */
@Injectable()
export class CommerceDataService {
  private readonly tableName: string;
  private tableReady?: Promise<void>;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    moduleName: string,
  ) {
    this.tableName = `commerce_${moduleName.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`;
  }

  async getAll(): Promise<unknown[]> {
    const domainTable = this.domainTable();
    if (domainTable) {
      return (await this.db.execute(sql`SELECT * FROM ${sql.raw(`"${domainTable}"`)} ORDER BY id DESC`)) as unknown[];
    }
    await this.ensureTable();
    const table = sql.raw(`"${this.tableName}"`);
    return (await this.db.execute(sql`
      SELECT id, name, payload, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM ${table} ORDER BY id DESC
    `)) as unknown[];
  }

  async findOne(id: string): Promise<unknown> {
    const recordId = this.parseId(id);
    const domainTable = this.domainTable();
    if (domainTable) {
      const rows = await this.db.execute(sql`SELECT * FROM ${sql.raw(`"${domainTable}"`)} WHERE id = ${recordId}`) as unknown[];
      if (!rows[0]) throw new NotFoundException(`${domainTable} record ${id} was not found.`);
      return rows[0];
    }
    await this.ensureTable();
    const table = sql.raw(`"${this.tableName}"`);
    const rows = await this.db.execute(sql`
      SELECT id, name, payload, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM ${table} WHERE id = ${recordId}
    `) as unknown[];
    if (!rows[0]) throw new NotFoundException(`${this.tableName} record ${id} was not found.`);
    return rows[0];
  }

  async create(payload: unknown): Promise<unknown> {
    await this.ensureTable();
    const table = sql.raw(`"${this.tableName}"`);
    const rows = await this.db.execute(sql`
      INSERT INTO ${table} (name, payload) VALUES (${this.extractName(payload)}, ${JSON.stringify(payload)}::jsonb)
      RETURNING id, name, payload, created_at AS "createdAt", updated_at AS "updatedAt"
    `) as unknown[];
    return rows[0];
  }

  async update(id: string, payload: unknown): Promise<unknown> {
    const recordId = this.parseId(id);
    await this.ensureTable();
    const table = sql.raw(`"${this.tableName}"`);
    const rows = await this.db.execute(sql`
      UPDATE ${table}
      SET name = ${this.extractName(payload)}, payload = ${JSON.stringify(payload)}::jsonb, updated_at = NOW()
      WHERE id = ${recordId}
      RETURNING id, name, payload, created_at AS "createdAt", updated_at AS "updatedAt"
    `) as unknown[];
    if (!rows[0]) throw new NotFoundException(`${this.tableName} record ${id} was not found.`);
    return rows[0];
  }

  async remove(id: string): Promise<void> {
    const recordId = this.parseId(id);
    await this.ensureTable();
    const table = sql.raw(`"${this.tableName}"`);
    const rows = await this.db.execute(sql`DELETE FROM ${table} WHERE id = ${recordId} RETURNING id`) as unknown[];
    if (!rows[0]) throw new NotFoundException(`${this.tableName} record ${id} was not found.`);
  }

  private ensureTable(): Promise<void> {
    this.tableReady ??= this.createTable();
    return this.tableReady;
  }

  private async createTable(): Promise<void> {
    const table = sql.raw(`"${this.tableName}"`);
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${table} (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private extractName(payload: unknown): string {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const value = (payload as Record<string, unknown>).name;
      if (typeof value === "string" && value.trim()) return value.trim().slice(0, 255);
    }
    throw new BadRequestException("name is required and must be a non-empty string.");
  }

  private parseId(id: string): bigint {
    if (!/^\d+$/.test(id)) throw new BadRequestException("id must be a positive integer.");
    return BigInt(id);
  }

  // ponytail: unreachable today — nothing constructs this service with
  // moduleName "product" or "cart" (those names aren't in rest-api.module.ts's
  // `resources` list, and that file is itself unwired, see its header
  // comment). Kept as-is per task scope (no logic changes to this file);
  // remove this branch only alongside the rest-api.module.ts cleanup once
  // it's confirmed nothing will ever call this service with those names.
  private domainTable(): "product" | "cart_item" | undefined {
    if (this.tableName === "commerce_product") return "product";
    if (this.tableName === "commerce_cart") return "cart_item";
    return undefined;
  }
}
