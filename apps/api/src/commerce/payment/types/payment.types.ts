// @ts-nocheck
/**
 * Must match the Postgres enum `transaction_status_enum`, which accepts exactly
 * 'CREATED' | 'PAID' | 'FAILED' (verified against the live schema).
 *
 * This was previously a NUMERIC enum (CREATED = 1, PAID = 2, FAILED = 3), so the
 * payment services wrote the integer 2 into a string-enum column. Every insert or
 * update of a transaction status would have been rejected by Postgres at runtime.
 * It went unnoticed because these services imported their repository through a
 * broken relative path, so TypeScript saw `any` and checked nothing.
 *
 * A const object rather than a TS enum: string-enum members are nominal and are
 * not assignable to Drizzle's inferred literal union, which is what forced the
 * numeric workaround in the first place.
 *
 * CANCELLED (formerly 4) is deliberately gone — the database enum has no such
 * value, so it could never have been persisted. Add it to the Postgres enum first
 * if the business needs it.
 */
export const TransactionStatus = {
    CREATED: "CREATED",
    PAID: "PAID",
    FAILED: "FAILED",
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const TransactionFailureCode = {
    INVALID_TRANSACTION_SIGNATURE: 101,
    TRANSACTION_SIGNATURE_VALIDATION_ERROR: 102,
    PAYMENT_FAILURE: 103,
};
// @ts-nocheck
// @ts-nocheck
