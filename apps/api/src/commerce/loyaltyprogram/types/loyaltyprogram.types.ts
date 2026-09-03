/**
 * Ports com.bloomscorp.loom.loyaltyprogram.
 *
 * NOTE: Loom's loyalty program is a per-customer *discount configuration*
 * (minimum order value, percentile discount, tenure), not a points ledger —
 * there is no points balance, award or redeem path anywhere in
 * com.bloomscorp.loom.loyaltyprogram. The money-bearing fields audited here are
 * minOrderValue / minOrderValueInr / exchangeRate / discountPercentage.
 */

/** Ports LOYALTY_CONFIG_AUDIT_LOG_TYPE / the loyalty_config_audit_log_type enum. */
export enum LoyaltyConfigAuditLogType {
  ONBOARDING = 'ONBOARDING',
  RENEWAL_AUTO = 'RENEWAL_AUTO',
  RENEWAL_MANUAL = 'RENEWAL_MANUAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export function isLoyaltyConfigAuditLogType(value: unknown): value is LoyaltyConfigAuditLogType {
  return typeof value === 'string' && value in LoyaltyConfigAuditLogType;
}

/**
 * The mutable half of LoyaltyProgramConfig that enableLoyaltyProgram accepts.
 * Every money field is REQUIRED: Loom's LoyaltyProgramConfigValidator rejects a
 * config without them, and defaulting one here would fabricate a discount.
 */
export interface LoyaltyProgramConfigInput {
  id: bigint | null;
  customerId: number;
  minOrderValueCurrency: string;
  minOrderValue: number;
  minOrderValueInr: number;
  exchangeRate: number;
  tenure: number;
  discountPercentage: number;
  active: boolean;
  type: LoyaltyConfigAuditLogType;
}

/** Ports LoyaltyProgramConfigData — the table-explorer projection. */
export interface LoyaltyProgramConfigData {
  id: string;
  version: number;
  customerId: number;
  minOrderValueCurrency: string;
  minOrderValue: number;
  minOrderValueInr: number;
  exchangeRate: number;
  tenure: number;
  discountPercentage: number;
  startDate: number;
  endDate: number;
  active: boolean;
  createdAt: number;
  updatedAt: number | null;
}

/**
 * Ports LoyaltyProgramConfigAuditLogData. The Java projection selects no
 * `updated_at`; the previous implementation emitted one.
 */
export interface LoyaltyProgramConfigAuditLogData {
  id: string;
  version: number;
  customerId: number;
  minOrderValueCurrency: string;
  minOrderValue: number;
  minOrderValueInr: number;
  exchangeRate: number;
  tenure: number;
  discountPercentage: number;
  startDate: number;
  endDate: number;
  createdAt: number;
  type: LoyaltyConfigAuditLogType;
}

/** Ports CustomerLoyaltyProgramMembershipInfo / findCustomerLoyaltyProgramInfo. */
export interface CustomerLoyaltyProgramMembershipInfo {
  tenantId: number;
  active: boolean;
  programEnrollmentDateEpochMS: number;
  currentCycleStartDateEpochMS: number;
  currentCycleEndDateEpochMS: number;
  tenureMonths: number;
  minimumOrderValueCurrency: string;
  minimumOrderValue: number;
  minimumOrderValueINR: number;
  exchangeRate: number;
  percentileDiscount: number;
}

/**
 * Numeric columns come back from postgres as strings. `Number(v) || fallback`
 * would turn a legitimate 0 discount into the fallback, so parse strictly and
 * let a genuinely unparseable value surface instead of being papered over.
 */
export function toMoney(value: string | number, column: string): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`loyalty_program_config.${column} is not a number: ${String(value)}`);
  }
  return parsed;
}

/** Ports com.bloomscorp.loom.order.pojo.CustomerLoyaltyProgramOrder. */
export interface CustomerLoyaltyProgramOrder {
  orderId: string;
  productImage: string;
  productName: string;
  additionalProductCount: number;
  totalOrderValue: number;
  loyaltyDiscountValue: number;
  currency: string;
  status: string;
  latestDispatchedOn: number | null;
  createdAt: number;
  isCustomOrder: boolean;
}

/**
 * Loom's table-explorer handlers take `page` and `size` as required request
 * params and paginate with `LIMIT :size OFFSET :page * :size` (page is
 * zero-based). `parseInt(x) || 1` would turn page 0 — the first page — into
 * page 1, so parse strictly and only fall back when the value is absent or
 * unparseable.
 */
export function parsePageInput(query: Record<string, unknown>): { page: number; size: number } {
  const toInt = (value: unknown, fallback: number, min: number): number => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
  };
  return { page: toInt(query?.page, 0, 0), size: toInt(query?.size, 50, 1) };
}
