import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";

@Injectable()
export class CompatibilityService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, "compatibility");
  }

  override async getAll() {
    const list = await super.getAll();
    if (!list || list.length === 0) {
      return [
        {
          id: "compat_1",
          name: "LEGACY_V1_REDIRECT_COMPATIBILITY",
          type: "URL_REWRITE",
          status: "ACTIVE",
          payload: { sourceVersion: "v1.0", targetVersion: "v2.0", supportLegacySlugs: true },
          createdAt: Date.now() - 86400000,
        },
        {
          id: "compat_2",
          name: "MEDIA_S3_PATH_COMPATIBILITY",
          type: "ASSET_TRANSFORM",
          status: "ACTIVE",
          payload: { legacyBucket: "anuprerna-bloomscorp", cdnEnabled: true },
          createdAt: Date.now() - 43200000,
        },
      ];
    }
    return list;
  }
}
