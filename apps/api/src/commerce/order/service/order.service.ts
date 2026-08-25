import { Inject, Injectable } from "@nestjs/common";
import { OrderRepository } from "../repository/order.repository.js";
import { OrderInput, OrderUpdateInput } from "../dto/order.dto.js";
import * as schema from "../../../database/schema/schema.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async getOrderById(id: bigint) {
    return this.orderRepository.findById(id);
  }

  async getCustomerOrders(customerId: bigint | number, page: number, size: number) {
    return this.orderRepository.findByCustomerIdPaginated(customerId, page, size);
  }

  async getAllOrders(page: number, size: number) {
    return this.orderRepository.findAllPaginated(page, size);
  }

  async createOrder(body: any, authTenantId?: number) {
    let tenantId = Number(body?.tenantId || body?.customerId || authTenantId || 0);
    if (!tenantId || tenantId <= 0) {
      try {
        const anyTenant = await this.orderRepository.db.select({ id: schema.loomTenant.id }).from(schema.loomTenant).limit(1);
        tenantId = anyTenant.length > 0 ? Number(anyTenant[0].id) : 1;
      } catch {
        tenantId = 1;
      }
    }

    const data = {
      tenantId,
      subTotal: String(body?.subTotal ?? body?.subtotal ?? "0.00"),
      shippingMode: body?.shippingMode ?? { mode: "STANDARD", cost: 0 },
      shippingCost: String(body?.shippingCost ?? "0.00"),
      total: String(body?.total ?? "0.00"),
      currency: String(body?.currency || "INR"),
      advancePay: String(body?.advancePay ?? body?.total ?? "0.00"),
      remainingPay: String(body?.remainingPay ?? "0.00"),
      autoDiscount: String(body?.autoDiscount ?? "0.00"),
      couponApplied: Boolean(body?.couponApplied),
      couponCode: String(body?.couponCode || ""),
      couponDiscount: String(body?.couponDiscount ?? "0.00"),
      couponDiscountAmount: String(body?.couponDiscountAmount ?? "0.00"),
      address: body?.address ?? {},
      note: String(body?.note ?? body?.notes ?? ""),
      gift: Boolean(body?.gift),
      loyaltyOrder: Boolean(body?.loyaltyOrder),
      createdAt: Date.now(),
      version: 1n,
    };

    const order = await this.orderRepository.createOrder(data as any);

    if (Array.isArray(body?.orderItems) && body.orderItems.length > 0) {
      for (const item of body.orderItems) {
        try {
          await this.orderRepository.db.insert(schema.orderItem).values({
            orderId: Number(order.id),
            orderType: item.orderType || "IN_STOCK",
            productGroup: item.productGroup || "finished",
            quantity: String(item.quantity || 1),
            unit: item.unit || "METER",
            price: String(item.price || "0.00"),
            currency: String(item.currency || data.currency),
            customization: item.customization ?? {},
            orderStatus: "INITIATED",
            paymentStatus: "PENDING",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1n,
          } as any);
        } catch (itemErr) {
          console.warn("[OrderService] order_item insert error:", itemErr);
        }
      }
    }

    return order;
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

  // ─── Custom Order Service Methods ──────────────────────────────────────────

  async getCustomOrderById(id: bigint) {
    return this.orderRepository.findCustomOrderById(id);
  }

  async getCustomOrdersByTenant(tenantId: bigint | number) {
    return this.orderRepository.findCustomOrdersByTenant(tenantId);
  }

  async getAllCustomOrders() {
    return this.orderRepository.findAllCustomOrders();
  }

  async createCustomOrder(tenantId: bigint | number, data: any) {
    return this.orderRepository.createCustomOrder(tenantId, data);
  }

  async updateCustomOrder(data: any) {
    return this.orderRepository.updateCustomOrder(data);
  }

  async cancelCustomOrder(id: bigint, tenantId: bigint | number) {
    return this.orderRepository.cancelCustomOrder(id, tenantId);
  }

  async deleteCustomOrder(id: bigint) {
    return this.orderRepository.deleteCustomOrder(id);
  }
}
