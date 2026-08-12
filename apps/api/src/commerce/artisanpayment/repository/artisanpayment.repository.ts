// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";

@Injectable()
export class ArtisanPaymentRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findAllRecords(page: number, size: number) {
    const offset = page * size;
    const rows = await this.db.execute(
      sql`SELECT * FROM artisan_payment_record ORDER BY id DESC LIMIT ${size} OFFSET ${offset}`
    );
    return rows;
  }

  async findRecordById(id: bigint) {
    const rows = await this.db.execute(
      sql`SELECT * FROM artisan_payment_record WHERE id = ${id}`
    );
    return rows[0] || null;
  }

  async findByArtisanId(artisanId: bigint, page: number, size: number) {
    const offset = page * size;
    const rows = await this.db.execute(
      sql`SELECT * FROM artisan_payment_record WHERE artisan_id = ${artisanId} ORDER BY id DESC LIMIT ${size} OFFSET ${offset}`
    );
    return rows;
  }

  async createRecord(data: any) {
    const rows = await this.db.execute(
      sql`INSERT INTO artisan_payment_record (artisan_id, amount, status, payment_date, notes)
          VALUES (${data.artisanId}, ${data.amount}, ${data.status || 'PENDING'}, ${data.paymentDate || new Date()}, ${data.notes || ''})
          RETURNING *`
    );
    return rows[0];
  }

  async updateRecordStatus(id: bigint, status: string) {
    const rows = await this.db.execute(
      sql`UPDATE artisan_payment_record SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *`
    );
    return rows[0];
  }

  async findIncentiveConfig() {
    const rows = await this.db.execute(
      sql`SELECT * FROM artisan_incentive_config ORDER BY id DESC`
    );
    return rows;
  }
}
