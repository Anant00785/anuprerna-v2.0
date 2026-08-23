import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";

@Injectable()
export class MiscService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, "misc");
  }

  override async getAll() {
    const list = await super.getAll();
    if (!list || list.length === 0) {
      return [
        {
          id: "misc_1",
          name: "SYSTEM_METADATA_CONFIG",
          type: "CONFIG",
          payload: { version: "2.0.0", platform: "LOOM_COMMERCE" },
          createdAt: Date.now() - 86400000,
        },
        {
          id: "misc_2",
          name: "APP_FEATURE_FLAGS",
          type: "FEATURE_FLAG",
          payload: { enableWhatsApp: true, enableLoyalty: true },
          createdAt: Date.now() - 43200000,
        },
      ];
    }
    return list;
  }
}
