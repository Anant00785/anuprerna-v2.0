// @ts-nocheck
export enum TransactionStatus {
    CREATED = 1,
    PAID = 2,
    FAILED = 3,
    CANCELLED = 4
}

export const TransactionFailureCode = {
    INVALID_TRANSACTION_SIGNATURE: 101,
    TRANSACTION_SIGNATURE_VALIDATION_ERROR: 102,
    PAYMENT_FAILURE: 103,
};
// @ts-nocheck
// @ts-nocheck
