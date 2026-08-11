export const ORDER_SERVICE = Symbol("ORDER_SERVICE");

export interface OrderServicePort {
    updateOrderStatusToProcessing(orderId: bigint): Promise<boolean>;
    updatePreOrderPaymentStatusToPaid(orderId: bigint): Promise<boolean>;
    updateOrderStatusToFailed(orderId: bigint, failureCode: number): Promise<boolean>;
    updateOrderCheckoutUrlStripe(orderId: bigint, url: string): Promise<boolean>;
    getOrderById(orderId: bigint): Promise<any>;
    isAnyPaymentDue(order: any): boolean;
}

export const EMAIL_SERVICE = Symbol("EMAIL_SERVICE");

export interface EmailServicePort {
    sendOrderConfirmationEmail(tenant: any, order: any): Promise<void>;
    sendPreOrderConfirmationEmail(tenant: any, order: any, items: any[]): Promise<void>;
    sendOrderCancelNotification(emails: string[], adminEmails: string[], cc: string[] | null, order: any, message: string): Promise<void>;
}

export const WHATSAPP_SERVICE = Symbol("WHATSAPP_SERVICE");

export interface WhatsappServicePort {
    orderConfirmationNotification(order: any): Promise<void>;
    orderCancelledNotification(phone: string, name: string, message: string, orderId: bigint, currency: string, total: string, adminEmail: string, tenant: any): Promise<void>;
}

export const CART_SERVICE = Symbol("CART_SERVICE");

export interface CartServicePort {
    deleteAllCartItem(tenant: any): Promise<void>;
}
