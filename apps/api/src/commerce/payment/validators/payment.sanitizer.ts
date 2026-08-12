import {
    RazorpayPaymentInput,
    RazorpayPaymentSuccessInput,
    RazorpayPaymentFailureInput,
    RazorpayPaymentUpdateInput,
    StripePaymentOrderInput
} from "../dto/payment.dto.js";

function escapeHtml(str: string): string {
    if (!str) return str;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

export function sanitizeRazorpayPaymentInput(input: RazorpayPaymentInput): RazorpayPaymentInput {
    return {
        ...input,
        paymentType: escapeHtml(input.paymentType.trim()),
    };
}

export function sanitizeRazorpayPaymentSuccessInput(input: RazorpayPaymentSuccessInput): RazorpayPaymentSuccessInput {
    return {
        ...input,
        paymentType: escapeHtml(input.paymentType.trim()),
        razorpayOrderId: escapeHtml(input.razorpayOrderId.trim()),
        transactionId: escapeHtml(input.transactionId.trim()),
        transactionSignature: escapeHtml(input.transactionSignature.trim()),
    };
}

export function sanitizeRazorpayPaymentFailureInput(input: RazorpayPaymentFailureInput): RazorpayPaymentFailureInput {
    return {
        ...input,
        razorpayOrderId: escapeHtml(input.razorpayOrderId.trim()),
    };
}

export function sanitizeRazorpayPaymentUpdateInput(input: RazorpayPaymentUpdateInput): RazorpayPaymentUpdateInput {
    return {
        ...input,
        paymentType: escapeHtml(input.paymentType.trim()),
        transactionId: escapeHtml(input.transactionId.trim()),
    };
}

export function sanitizeStripePaymentOrderInput(input: StripePaymentOrderInput): StripePaymentOrderInput {
    return {
        ...input,
        paymentType: escapeHtml(input.paymentType.trim()),
        currency: escapeHtml(input.currency.trim()),
        customerEmail: escapeHtml(input.customerEmail.trim()),
        customerName: escapeHtml(input.customerName.trim()),
        customerPhone: escapeHtml(input.customerPhone.trim()),
        customerCountryCode: escapeHtml(input.customerCountryCode.trim()),
        customerShippingCountryCode: escapeHtml(input.customerShippingCountryCode.trim()),
    };
}
