import { ShipmentInput } from "../dto/shipment.dto.js";

/**
 * Validates the given ShipmentInput entity by checking the name length constraint,
 * ensuring all monetary and quantity amounts are non-negative, verifying the estimated
 * delivery window is valid and ordered, and confirming the location type is recognised.
 */
export function validateShipment(input: ShipmentInput): string | null {
  if (!input.name || input.name.trim().length === 0 || input.name.length > 255) {
    return "Name must be between 1 and 255 characters.";
  }
  
  if (input.baseAmount <= 0) {
    return "Base amount must be greater than 0.";
  }

  if (input.baseQuantity <= 0) {
    return "Base quantity must be greater than 0.";
  }

  if (input.additionalAmount < 0) {
    return "Additional amount must be greater than or equal to 0.";
  }

  if (input.estimatedFromDay < 1) {
    return "Estimated from day must be at least 1.";
  }

  if (input.estimatedToDay <= input.estimatedFromDay) {
    return "Estimated to day must be greater than estimated from day.";
  }

  if (!input.locationType) {
    return "Valid location type is required.";
  }

  return null;
}
