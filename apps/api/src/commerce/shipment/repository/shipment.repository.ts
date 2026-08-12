// @ts-nocheck
import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ShipmentInput } from "../dto/shipment.dto.js";
import { ShipmentEntity, ShipmentData } from "../types/shipment.types.js";

@Injectable()
export class ShipmentRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: bigint): Promise<ShipmentEntity | null> {
    const rows = await this.db.select().from(schema.shipment).where(eq(schema.shipment.id, id));
    if (rows.length === 0) return null;
    return rows[0] as unknown as ShipmentEntity;
  }

  async findAll(): Promise<ShipmentEntity[]> {
    const rows = await this.db.select().from(schema.shipment);
    return rows as unknown as ShipmentEntity[];
  }

  async create(shipment: ShipmentInput): Promise<boolean> {
    const result = await this.db.insert(schema.shipment).values({
      name: shipment.name,
      baseAmount: shipment.baseAmount,
      baseQuantity: shipment.baseQuantity,
      additionalAmount: shipment.additionalAmount,
      estimatedFromDay: shipment.estimatedFromDay,
      estimatedToDay: shipment.estimatedToDay,
      locationType: shipment.locationType as any,
    });
    return result.rowCount > 0;
  }

  async update(shipment: ShipmentInput): Promise<boolean> {
    if (!shipment.id) return false;
    
    const result = await this.db.update(schema.shipment).set({
      name: shipment.name,
      baseAmount: shipment.baseAmount,
      baseQuantity: shipment.baseQuantity,
      additionalAmount: shipment.additionalAmount,
      estimatedFromDay: shipment.estimatedFromDay,
      estimatedToDay: shipment.estimatedToDay,
      locationType: shipment.locationType as any,
    }).where(eq(schema.shipment.id, shipment.id));
    
    return result.rowCount > 0;
  }

  async deleteById(id: bigint): Promise<boolean> {
    const result = await this.db.delete(schema.shipment).where(eq(schema.shipment.id, id));
    return result.rowCount > 0;
  }

  async findPaginatedData(page: number, size: number): Promise<ShipmentData[]> {
    const rows = await this.db.select().from(schema.shipment).limit(size).offset(page * size);
    return rows as unknown as ShipmentData[];
  }

  async findDataById(id: bigint): Promise<ShipmentData | null> {
    const rows = await this.db.select().from(schema.shipment).where(eq(schema.shipment.id, id));
    if (rows.length === 0) return null;
    return rows[0] as unknown as ShipmentData;
  }
}
// @ts-nocheck
// @ts-nocheck
