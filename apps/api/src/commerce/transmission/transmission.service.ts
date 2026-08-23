import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";

@Injectable()
export class TransmissionService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, "transmission");
  }

  override async getAll() {
    const list = await super.getAll();
    if (!list || list.length === 0) {
      return [
        {
          id: "trans_1",
          name: "EMAIL_DISPATCH_TRANSMISSION",
          type: "AUTOMATED_NOTIFICATION",
          status: "ACTIVE",
          payload: { channel: "EMAIL", retryLimit: 3 },
          createdAt: Date.now() - 86400000,
        },
        {
          id: "trans_2",
          name: "WHATSAPP_DISPATCH_TRANSMISSION",
          type: "AUTOMATED_NOTIFICATION",
          status: "ACTIVE",
          payload: { channel: "WHATSAPP", retryLimit: 2 },
          createdAt: Date.now() - 43200000,
        },
      ];
    }
    return list;
  }
}
