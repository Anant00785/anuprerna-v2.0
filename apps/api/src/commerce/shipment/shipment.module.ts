// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ShipmentController } from "./controller/shipment.controller.js";
import { ShipmentService } from "./service/shipment.service.js";
import { ShipmentRepository } from "./repository/shipment.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ShipmentController],
  providers: [ShipmentService, ShipmentRepository],
  exports: [ShipmentService, ShipmentRepository],
})
export class ShipmentModule {}
