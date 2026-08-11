// @ts-nocheck
import { ShipmentInput } from "../dto/shipment.dto.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeShipment(input: ShipmentInput): ShipmentInput {
  return {
    ...input,
    name: input.name ? escapeHtml(input.name.trim()) : input.name,
  };
}
// @ts-nocheck
// @ts-nocheck
