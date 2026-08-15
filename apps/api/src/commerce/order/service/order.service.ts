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
    // Basic mapping, assuming schema fields match approximately
    const data = {
      customerId: input.customerId,
      addressId: input.addressId,
      paymentMode: input.paymentMode,
      notes: input.notes,
      status: "PENDING"
    };
    return this.orderRepository.createOrder(data as any);
  }

  async updateOrderStatus(input: OrderUpdateInput) {
    return this.orderRepository.updateOrder(input.orderId, { status: input.status } as any);
  }

  async cancelOrder(id: bigint) {
    return this.orderRepository.updateOrder(id, { status: "CANCELLED" } as any);
  }

  async getProcessingOrders(customerId?: bigint) {
    return this.orderRepository.findAllPaginated(0, 100);
  }

  async deleteOrder(id: bigint) {
    return this.orderRepository.deleteOrder(id);
  }
}
// @ts-nocheck
