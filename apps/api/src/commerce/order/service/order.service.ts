// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { OrderRepository } from "../repository/order.repository.js";
import { OrderInput, OrderUpdateInput } from "../dto/order.dto.js";

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getOrderById(id: bigint) {
    return this.orderRepository.findById(id);
  }

  async getCustomerOrders(customerId: bigint, page: number, size: number) {
    return this.orderRepository.findByCustomerIdPaginated(customerId, page, size);
  }

  async getAllOrders(page: number, size: number) {
    return this.orderRepository.findAllPaginated(page, size);
  }

  async createOrder(input: OrderInput) {
    const data = {
      tenantId: Number(input.customerId) || 1,
      subTotal: "100.00",
      shippingMode: { mode: "STANDARD", cost: 0 },
      shippingCost: "0.00",
      total: "100.00",
      currency: "INR",
      advancePay: "100.00",
      remainingPay: "0.00",
      autoDiscount: "0.00",
      couponApplied: false,
      couponCode: "",
      couponDiscount: "0.00",
      address: { id: Number(input.addressId) || 1 },
      note: input.notes || "",
      gift: false,
      createdAt: Date.now(),
      version: 1n,
    };
    return this.orderRepository.createOrder(data as any);
  }

  async updateOrderStatus(input: OrderUpdateInput) {
    const updateData: any = {
      note: `Status updated to ${input.status}`,
    };
    if (input.status === "CANCELLED") {
      updateData.cancelledAt = Date.now();
      updateData.cancellationReason = "Cancelled by admin";
    }
    return this.orderRepository.updateOrder(input.orderId, updateData);
  }

  async cancelOrder(id: bigint) {
    return this.orderRepository.updateOrder(id, {
      cancelledAt: Date.now(),
      cancellationReason: "Cancelled by user",
    } as any);
  }

  async getProcessingOrders(customerId?: bigint) {
    return this.orderRepository.findAllPaginated(0, 100);
  }

  async deleteOrder(id: bigint) {
    return this.orderRepository.deleteOrder(id);
  }
}
