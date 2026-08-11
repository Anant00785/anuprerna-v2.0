import {
    RazorpayPaymentInput,
    RazorpayPaymentSuccessInput,
    RazorpayPaymentFailureInput,
    RazorpayPaymentUpdateInput,
    StripePaymentOrderInput
} from "../dto/payment.dto.js";

export function validateRazorpayPaymentInput(input: RazorpayPaymentInput): string | null {
    if (!input.orderId || input.orderId <= 0n) return "Order ID is required and must be positive.";
    if (!input.paymentType || input.paymentType.trim() === "") return "Payment type is required.";
    return null;
}

export function validateRazorpayPaymentSuccessInput(input: RazorpayPaymentSuccessInput): string | null {
    if (!input.loomOrderId || input.loomOrderId <= 0n) return "Loom Order ID is required.";
    if (!input.paymentType || input.paymentType.trim() === "") return "Payment type is required.";
    if (!input.razorpayOrderId || input.razorpayOrderId.trim() === "") return "Razorpay Order ID is required.";
    if (!input.transactionId || input.transactionId.trim() === "") return "Transaction ID is required.";
    if (!input.transactionSignature || input.transactionSignature.trim() === "") return "Transaction signature is required.";
    return null;
}

export function validateRazorpayPaymentFailureInput(input: RazorpayPaymentFailureInput): string | null {
    if (!input.loomOrderId || input.loomOrderId <= 0n) return "Loom Order ID is required.";
    if (!input.razorpayOrderId || input.razorpayOrderId.trim() === "") return "Razorpay Order ID is required.";
    if (!input.error) return "Error details are required.";
    return null;
}

export function validateRazorpayPaymentUpdateInput(input: RazorpayPaymentUpdateInput): string | null {
    if (!input.loomOrderId || input.loomOrderId <= 0n) return "Loom Order ID is required.";
    if (!input.paymentType || input.paymentType.trim() === "") return "Payment type is required.";
    if (!input.transactionId || input.transactionId.trim() === "") return "Transaction ID is required.";
    return null;
}

export function validateStripePaymentOrderInput(input: StripePaymentOrderInput): string | null {
    if (!input.loomOrderId || input.loomOrderId <= 0n) return "Loom Order ID is required.";
    if (!input.paymentType || input.paymentType.trim() === "") return "Payment type is required.";
    if (!input.currency || input.currency.trim() === "") return "Currency is required.";
    if (!input.totalAmount || input.totalAmount <= 0n) return "Total amount is required and must be positive.";
    return null;
}
