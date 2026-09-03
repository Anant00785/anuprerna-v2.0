import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";
import * as schema from "../../database/schema/schema.js";

@Injectable()
export class DiscountService extends CommerceDataService {
  private readonly logger = new Logger(DiscountService.name);

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
    } catch (err) {
      this.logger.warn(`discount table read failed, falling back to the generic commerce_discount table: ${err}`);
    }

    // Previously this returned a fabricated "WELCOME15" 15%-off coupon whenever
    // the discount table was empty or unreadable — an invented discount served
    // from a live route as if it were configuration. An empty catalogue is an
    // empty catalogue.
    return (await super.getAll()) ?? [];
  }
}
