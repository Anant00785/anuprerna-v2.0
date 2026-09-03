import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { address, loomTenant } from "../../database/schema/schema.js";

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

function normalizeAddress(row: any) {
  if (!row) return row;
  return {
    ...row,
    id: Number(row.id),
    tenantId: Number(row.tenantId || row.tenant_id),
    name: String(row.name || ""),
    addressLineOne: row.addressLine1 || row.addressLineOne || row.address_line_1 || "",
    addressLineTwo: row.addressLine2 || row.addressLineTwo || row.address_line_2 || "",
    city: String(row.city || ""),
    state: String(row.state || ""),
    postalCode: String(row.postalCode || row.postal_code || ""),
    country: String(row.country || "India"),
    companyName: String(row.companyName || row.company_name || ""),
    primaryPhone: String(row.primaryPhone || row.primary_phone || ""),
    secondaryPhone: String(row.secondaryPhone || row.secondary_phone || ""),
    contactEmail: String(row.contactEmail || row.contact_email || ""),
    vatgstNumber: String(row.vatGstNumber || row.vatgstNumber || row.vat_gst_number || ""),
    eoriNumber: String(row.eoriNumber || row.eori_number || ""),
    addressType: row.addressType || row.address_type || "SHIPPING",
    primaryBillingAddress: Boolean(row.primaryBillingAddress || row.primary_billing_address),
    primaryShippingAddress: Boolean(row.primaryShippingAddress || row.primary_shipping_address),
  };
}

@Injectable()
export class AddressService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getAll(authTenantId?: number) {
    try {
      let records: any[] = [];
      const tid = Number(authTenantId);
      if (Number.isSafeInteger(tid) && tid > 0) {
        records = await this.db.select().from(address).where(eq(address.tenantId, tid)).orderBy(desc(address.id));
      }
      const normalized = records.map(normalizeAddress);
      return { success: true, data: normalized, addressList: normalized, payload: normalized, message: "ok" };
    } catch (error) {
      return { success: false, data: [], addressList: [], payload: [], error: this.errorMessage(error) };
    }
  }

  async create(payload: unknown, authTenantId?: number) {
    try {
      const input = await this.parseCreateInput(payload, authTenantId);
      const [created] = await this.db.insert(address).values(input).returning();
      const norm = normalizeAddress(created);
      return { success: true, data: [norm], payload: norm, entity: norm, ...norm, message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  async update(id: number | bigint, payload: unknown) {
    try {
      const numId = Number(id);
      if (!Number.isSafeInteger(numId) || numId <= 0) {
        return { success: false, error: "Invalid address ID" };
      }
      const input = this.parseUpdateInput(payload);
      const [updated] = await this.db.update(address).set(input).where(eq(address.id, BigInt(numId))).returning();
      const norm = normalizeAddress(updated);
      return { success: true, data: norm ? [norm] : [], payload: norm, entity: norm, ...norm, message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  async deleteById(id: number | bigint) {
    try {
      const [deleted] = await this.db.delete(address).where(eq(address.id, BigInt(id))).returning();
      const norm = normalizeAddress(deleted);
      return { success: true, data: norm ? [norm] : [], payload: norm, message: "ok" };
    } catch (error) {
      return { success: false, error: this.errorMessage(error) };
    }
  }

  private parseUpdateInput(payload: unknown): Partial<CreateAddressInput> {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("A JSON address payload is required.");
    }

    const value = payload as Record<string, unknown>;
    const update: any = {};
    if (value.tenantId !== undefined) update.tenantId = Number(value.tenantId);
    if (value.name !== undefined) update.name = String(value.name).trim();
    if (value.addressLine1 !== undefined || value.addressLineOne !== undefined) {
      update.addressLine1 = String(value.addressLine1 || value.addressLineOne).trim();
    }
    if (value.addressLine2 !== undefined || value.addressLineTwo !== undefined) {
      update.addressLine2 = String(value.addressLine2 || value.addressLineTwo).trim();
    }
    if (value.postalCode !== undefined) update.postalCode = String(value.postalCode).trim();
    if (value.city !== undefined) update.city = String(value.city).trim();
    if (value.state !== undefined) update.state = String(value.state).trim();
    if (value.country !== undefined) update.country = String(value.country).trim();
    if (value.companyName !== undefined) update.companyName = String(value.companyName).trim();
    if (value.primaryPhone !== undefined) update.primaryPhone = String(value.primaryPhone).trim();
    if (value.secondaryPhone !== undefined) update.secondaryPhone = String(value.secondaryPhone).trim();
    if (value.contactEmail !== undefined) update.contactEmail = String(value.contactEmail).trim();
    if (value.vatGstNumber !== undefined || value.vatgstNumber !== undefined) {
      update.vatGstNumber = String(value.vatGstNumber || value.vatgstNumber).trim();
    }
    if (value.eoriNumber !== undefined) update.eoriNumber = String(value.eoriNumber).trim();
    if (value.addressType !== undefined) update.addressType = value.addressType;
    if (value.primaryBillingAddress !== undefined) update.primaryBillingAddress = Boolean(value.primaryBillingAddress);
    if (value.primaryShippingAddress !== undefined) update.primaryShippingAddress = Boolean(value.primaryShippingAddress);

    return update;
  }

  private async parseCreateInput(payload: unknown, authTenantId?: number): Promise<CreateAddressInput> {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("A JSON address payload is required.");
    }

    const value = payload as Record<string, unknown>;
    let tenantId = Number(authTenantId || value.tenantId || 0);

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      try {
        const anyTenant = await this.db.select({ id: loomTenant.id }).from(loomTenant).limit(1);
        if (anyTenant.length > 0) {
          tenantId = Number(anyTenant[0].id);
        }
      } catch {
        tenantId = 1;
      }
    }

    const rawName = value.name !== undefined && value.name !== null ? String(value.name).trim() : "";
    const rawEmail = value.contactEmail !== undefined && value.contactEmail !== null ? String(value.contactEmail).trim() : (value.email ? String(value.email).trim() : "");
    const rawPhone = value.primaryPhone !== undefined && value.primaryPhone !== null ? String(value.primaryPhone).trim() : (value.phone ? String(value.phone).trim() : "");
    const rawCity = value.city !== undefined && value.city !== null ? String(value.city).trim() : "";
    const rawState = value.state !== undefined && value.state !== null ? String(value.state).trim() : "";
    const rawCountry = value.country !== undefined && value.country !== null ? String(value.country).trim() : "India";
    const rawPostal = value.postalCode !== undefined && value.postalCode !== null ? String(value.postalCode).trim() : (value.pincode ? String(value.pincode).trim() : "");

    const addr1 = String(value.addressLine1 || value.addressLineOne || "").trim();
    const addr2 = String(value.addressLine2 || value.addressLineTwo || "").trim();
    const vatGst = String(value.vatGstNumber || value.vatgstNumber || "").trim();
    const addrType: AddressType = value.addressType === "BILLING" ? "BILLING" : "SHIPPING";

    return {
      tenantId: tenantId > 0 ? tenantId : 1,
      name: rawName || rawEmail || "Customer Address",
      addressLine1: addr1 || "Address Line 1",
      addressLine2: addr2,
      postalCode: rawPostal || "700001",
      city: rawCity || "Kolkata",
      state: rawState || "West Bengal",
      country: rawCountry || "India",
      companyName: this.optionalString(value.companyName),
      primaryPhone: rawPhone || "+919999999999",
      secondaryPhone: this.optionalString(value.secondaryPhone),
      contactEmail: rawEmail || "customer@example.com",
      vatGstNumber: vatGst,
      eoriNumber: this.optionalString(value.eoriNumber),
      addressType: addrType,
      primaryBillingAddress: Boolean(value.primaryBillingAddress),
      primaryShippingAddress: Boolean(value.primaryShippingAddress ?? true),
    };
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(`${field} is required.`);
    }
    return value.trim();
  }

  private optionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value !== "string") {
      throw new BadRequestException("Optional field must be a string.");
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
