import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";

@Injectable()
export class Msg91Service extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, "msg91");
  }
}

