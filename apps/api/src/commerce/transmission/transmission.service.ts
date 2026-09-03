import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { CommerceDataService } from "../shared/commerce-data.service.js";

/**
 * Transmission (dispatch batch) records.
 *
 * `getAll()` used to override the base class and, when the table was empty,
 * return two hardcoded records (EMAIL_DISPATCH_TRANSMISSION /
 * WHATSAPP_DISPATCH_TRANSMISSION). That override is deleted: an empty table
 * must read as empty. Fabricated rows served from a live gated route are the
 * same defect as the invented shipping prices and impact figures removed
 * elsewhere in this remediation — and TrackingController, the only caller,
 * would have shown them to customers.
 */
@Injectable()
export class TransmissionService extends CommerceDataService {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, "transmission");
  }
}
