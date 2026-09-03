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

export function transactionFailureMessage(code: number): string {
    switch (code) {
        case TransactionFailureCode.INVALID_TRANSACTION_SIGNATURE:
            return "Invalid payment transaction signature";
        case TransactionFailureCode.TRANSACTION_SIGNATURE_VALIDATION_ERROR:
            return "Error while validating payment transaction signature";
        case TransactionFailureCode.PAYMENT_FAILURE:
            return "Payment Failure";
        default:
            return "";
    }
}

/**
 * Reason codes handed to OrderService.updateOrderStatusToFailed.
 *
 * Mirrors Loom's OrderFailureCode, renumbered to the values this repo's payment
 * specs pin (session-log = 1, transaction-success-update = 2, payment-failure = 3).
 * Keep the three pinned values stable; the rest only need to be distinct.
 */
export const OrderFailureCode = {
    PAYMENT_SESSION_LOG_FAILURE: 1,
    TRANSACTION_SUCCESS_UPDATE_FAILURE: 2,
    PAYMENT_FAILURE: 3,
    INVALID_TRANSACTION_SIGNATURE: 4,
    TRANSACTION_SIGNATURE_VALIDATION_ERROR: 5,
    PAYMENT_SESSION_CREATE_FAILURE: 6,
} as const;
