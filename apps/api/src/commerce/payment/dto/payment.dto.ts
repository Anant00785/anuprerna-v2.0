// @ts-nocheck
export interface RazorpayPaymentInput {
    orderId: bigint;
    paymentType: string;
}

export function parseRazorpayPaymentInput(raw: unknown): RazorpayPaymentInput {
    const obj = raw as Record<string, unknown>;
    return {
        orderId: typeof obj.orderId === "number" || typeof obj.orderId === "bigint" ? BigInt(obj.orderId) : 0n,
        paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "",
    };
}

export interface RazorpayPaymentSuccessInput {
    loomOrderId: bigint;
    paymentType: string;
    razorpayOrderId: string;
    transactionId: string;
    transactionSignature: string;
}

export function parseRazorpayPaymentSuccessInput(raw: unknown): RazorpayPaymentSuccessInput {
    const obj = raw as Record<string, unknown>;
    return {
        loomOrderId: typeof obj.loomOrderId === "number" || typeof obj.loomOrderId === "bigint" ? BigInt(obj.loomOrderId) : 0n,
        paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "",
        razorpayOrderId: typeof obj.razorpayOrderId === "string" ? obj.razorpayOrderId : "",
        transactionId: typeof obj.transactionId === "string" ? obj.transactionId : "",
        transactionSignature: typeof obj.transactionSignature === "string" ? obj.transactionSignature : "",
    };
}

export interface RazorpayPaymentFailureInput {
    loomOrderId: bigint;
    razorpayOrderId: string;
    error: any;
}

export function parseRazorpayPaymentFailureInput(raw: unknown): RazorpayPaymentFailureInput {
    const obj = raw as Record<string, unknown>;
    return {
        loomOrderId: typeof obj.loomOrderId === "number" || typeof obj.loomOrderId === "bigint" ? BigInt(obj.loomOrderId) : 0n,
        razorpayOrderId: typeof obj.razorpayOrderId === "string" ? obj.razorpayOrderId : "",
        error: obj.error,
    };
}

export interface RazorpayPaymentUpdateInput {
    loomOrderId: bigint;
    paymentType: string;
    transactionId: string;
}

export function parseRazorpayPaymentUpdateInput(raw: unknown): RazorpayPaymentUpdateInput {
    const obj = raw as Record<string, unknown>;
    return {
        loomOrderId: typeof obj.loomOrderId === "number" || typeof obj.loomOrderId === "bigint" ? BigInt(obj.loomOrderId) : 0n,
        paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "",
        transactionId: typeof obj.transactionId === "string" ? obj.transactionId : "",
    };
}

export interface StripePaymentOrderInput {
    loomOrderId: bigint;
    paymentType: string;
    currency: string;
    totalAmount: bigint;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    customerCountryCode: string;
    customerShippingCountryCode: string;
}

export function parseStripePaymentOrderInput(raw: unknown): StripePaymentOrderInput {
    const obj = raw as Record<string, unknown>;
    return {
        loomOrderId: typeof obj.loomOrderId === "number" || typeof obj.loomOrderId === "bigint" ? BigInt(obj.loomOrderId) : 0n,
        paymentType: typeof obj.paymentType === "string" ? obj.paymentType : "",
        currency: typeof obj.currency === "string" ? obj.currency : "",
        totalAmount: typeof obj.totalAmount === "number" || typeof obj.totalAmount === "bigint" ? BigInt(obj.totalAmount) : 0n,
        customerEmail: typeof obj.customerEmail === "string" ? obj.customerEmail : "",
        customerName: typeof obj.customerName === "string" ? obj.customerName : "",
        customerPhone: typeof obj.customerPhone === "string" ? obj.customerPhone : "",
        customerCountryCode: typeof obj.customerCountryCode === "string" ? obj.customerCountryCode : "",
        customerShippingCountryCode: typeof obj.customerShippingCountryCode === "string" ? obj.customerShippingCountryCode : "",
    };
}
// @ts-nocheck
// @ts-nocheck
