import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { address } from "../../database/schema/index.js";

type AddressType = "BILLING" | "SHIPPING";

export interface CreateAddressInput {
  tenantId: number;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  companyName?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  contactEmail: string;
  vatGstNumber?: string;
  eoriNumber?: string;
  addressType: AddressType;
  primaryBillingAddress?: boolean;
  primaryShippingAddress?: boolean;
}

@Injectable()
export class AddressService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getAll() {
    try {
      const records = await this.db.select().from(address).orderBy(desc(address.id));
      return { success: true, data: records, message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  async create(payload: unknown) {
    try {
      const input = this.parseCreateInput(payload);
      const [created] = await this.db.insert(address).values(input).returning();
      return { success: true, data: [created], message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  async update(id: number | bigint, payload: unknown) {
    try {
      const input = this.parseCreateInput(payload);
      const [updated] = await this.db.update(address).set(input).where(eq(address.id, BigInt(id))).returning();
      return { success: true, data: updated ? [updated] : [], message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  async deleteById(id: number | bigint) {
    try {
      const [deleted] = await this.db.delete(address).where(eq(address.id, BigInt(id))).returning();
      return { success: true, data: deleted ? [deleted] : [], message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  private parseCreateInput(payload: unknown): CreateAddressInput {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("A JSON address payload is required.");
    }

    const value = payload as Record<string, unknown>;
    const tenantId = Number(value.tenantId);
    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      throw new BadRequestException("tenantId must be a positive integer.");
    }

    if (value.addressType !== "BILLING" && value.addressType !== "SHIPPING") {
      throw new BadRequestException("addressType must be BILLING or SHIPPING.");
    }

    return {
      tenantId,
      name: this.requiredString(value.name, "name"),
      addressLine1: this.requiredString(value.addressLine1, "addressLine1"),
      addressLine2: this.optionalString(value.addressLine2),
      postalCode: this.requiredString(value.postalCode, "postalCode"),
      city: this.requiredString(value.city, "city"),
      state: this.requiredString(value.state, "state"),
      country: this.requiredString(value.country, "country"),
      companyName: this.optionalString(value.companyName),
      primaryPhone: this.requiredString(value.primaryPhone, "primaryPhone"),
      secondaryPhone: this.optionalString(value.secondaryPhone),
      contactEmail: this.requiredString(value.contactEmail, "contactEmail"),
      vatGstNumber: this.optionalString(value.vatGstNumber),
      eoriNumber: this.optionalString(value.eoriNumber),
      addressType: value.addressType,
      primaryBillingAddress: Boolean(value.primaryBillingAddress),
      primaryShippingAddress: Boolean(value.primaryShippingAddress),
    };
  }

  private optionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") throw new BadRequestException("Optional address fields must be strings.");
    return value.trim();
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
    return value.trim();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Database operation failed.";
  }
}
