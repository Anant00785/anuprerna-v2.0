// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { LoomProductToZohoItemMapping, LoomCustomerToZohoContactMapping } from "../types/zoho-adapter.types.js";

@Injectable()
export class ZohoAdapterService {
  toZohoItemPayload(product: LoomProductToZohoItemMapping) {
    return {
      name: product.productName,
      rate: product.price,
      sku: product.sku,
      description: product.description,
      product_type: "goods" as const,
    };
  }

  toZohoContactPayload(customer: LoomCustomerToZohoContactMapping) {
    return {
      contact_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      contact_type: "customer" as const,
    };
  }
}
// @ts-nocheck
