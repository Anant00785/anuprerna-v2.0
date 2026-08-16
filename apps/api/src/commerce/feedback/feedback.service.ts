// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";
import * as schema from "../../database/schema/schema.js";
import { desc } from "drizzle-orm";

@Injectable()
export class FeedbackService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly database: Database) {
    super(database, "feedback");
  }

  override async getAll(): Promise<unknown[]> {
    try {
      const rows = await (this.database as any).select().from(schema.purchaseOrderFeedback).orderBy(desc(schema.purchaseOrderFeedback.id)).limit(50);
      return rows.map((r: any) => ({
        id: typeof r.id === "bigint" ? Number(r.id) : r.id,
        orderId: r.orderId,
        question1: r.question1,
        question1Answer: r.question1Answer,
        question2: r.question2,
        question2Answer: r.question2Answer,
        question3: r.question3,
        question3Answer: r.question3Answer,
        createdAt: r.createdAt ? Number(r.createdAt) : null,
      }));
    } catch {
      return super.getAll();
    }
  }
}
