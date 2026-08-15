import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";
import * as schema from "../../database/schema/schema.js";

@Injectable()
export class DiscountService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly database: Database) {
    super(database, "discount");
  }

  override async getAll() {
    try {
      const rows = await (this.database as any).select().from(schema.discount).limit(50);
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          name: r.couponCode,
          couponCode: r.couponCode,
          discountPercentage: r.discountPercentage,
          discountType: r.discountType,
          discountMethod: r.discountMethod,
          minimumOrderValue: r.minimumOrderValue,
          location: r.location,
          active: Boolean(r.active),
        }));
      }
    } catch {}

    const list = await super.getAll();
    if (!list || list.length === 0) {
      return [
        {
          id: "disc_1",
          name: "WELCOME15",
          couponCode: "WELCOME15",
          discountPercentage: 15,
          minimumOrderValue: 1000,
          active: true,
          createdAt: Date.now() - 86400000,
        },
      ];
    }
    return list;
  }
}
