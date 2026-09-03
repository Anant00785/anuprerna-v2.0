import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { InventoryController } from "./controller/inventory.controller.js";
import { InventoryService } from "./service/inventory.service.js";
import { InventoryRepository } from "./repository/inventory.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService, InventoryRepository],
})
export class InventoryModule {}
