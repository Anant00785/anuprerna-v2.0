// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { ShipmentRepository } from "../repository/shipment.repository.js";
import { ShipmentInput } from "../dto/shipment.dto.js";
import { validateShipment } from "../validators/shipment.validator.js";
import { sanitizeShipment } from "../validators/shipment.sanitizer.js";
import { ShipmentEntity, ShipmentData } from "../types/shipment.types.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@Injectable()
export class ShipmentService {
  constructor(private readonly shipmentRepository: ShipmentRepository) {}

  async getShipmentList(): Promise<ShipmentEntity[]> {
    return this.shipmentRepository.findAll();
  }

  async getShipment(id: bigint): Promise<ShipmentEntity | null> {
    return this.shipmentRepository.findById(id);
  }

  async createShipment(input: ShipmentInput): Promise<{ success: boolean; message: string; actionCode: number }> {
    const validationError = validateShipment(input);
    if (validationError) {
      return { success: false, message: validationError, actionCode: ActionCode.INSERT_FAILURE };
    }

    const sanitizedInput = sanitizeShipment(input);
    const created = await this.shipmentRepository.create(sanitizedInput);
    
    if (created) {
      return { success: true, message: "New shipment created successfully.", actionCode: ActionCode.INSERT_SUCCESS };
    }
    return { success: false, message: "Failed to create shipment.", actionCode: ActionCode.INSERT_FAILURE };
  }

  async updateShipment(input: ShipmentInput): Promise<{ success: boolean; message: string; actionCode: number }> {
    const validationError = validateShipment(input);
    if (validationError) {
      return { success: false, message: validationError, actionCode: ActionCode.UPDATE_FAILURE };
    }

    if (!input.id) {
      return { success: false, message: "Shipment ID is required for update.", actionCode: ActionCode.UPDATE_FAILURE };
    }

    const sanitizedInput = sanitizeShipment(input);
    const updated = await this.shipmentRepository.update(sanitizedInput);

    if (updated) {
      return { success: true, message: "Shipment updated successfully.", actionCode: ActionCode.UPDATE_SUCCESS };
    }
    return { success: false, message: "Failed to update shipment. Record not found.", actionCode: ActionCode.NO_ACTION };
  }

  async deleteShipment(id: bigint): Promise<{ success: boolean; message: string; actionCode: number }> {
    const deleted = await this.shipmentRepository.deleteById(id);
    
    if (deleted) {
      return { success: true, message: "Shipment deleted successfully.", actionCode: ActionCode.DELETE_SUCCESS };
    }
    return { success: false, message: "Failed to delete shipment. Record not found.", actionCode: ActionCode.NO_ACTION };
  }

  async getShipmentData(page: number, size: number): Promise<ShipmentData[]> {
    return this.shipmentRepository.findPaginatedData(page, size);
  }

  async getShipmentDataById(id: bigint): Promise<ShipmentData | null> {
    return this.shipmentRepository.findDataById(id);
  }
}
// @ts-nocheck
