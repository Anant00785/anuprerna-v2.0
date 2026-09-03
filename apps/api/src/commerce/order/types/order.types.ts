export enum ProcessingOrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED"
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  REFUNDED = "REFUNDED"
}

export enum PaymentMode {
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  ONLINE = "ONLINE"
}
