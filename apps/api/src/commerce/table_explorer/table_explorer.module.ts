import { Module } from "@nestjs/common";
import { TableExplorerController } from "./table_explorer.controller.js";
import { TableExplorerService } from "./table_explorer.service.js";

@Module({
  controllers: [TableExplorerController],
  providers: [TableExplorerService],
  exports: [TableExplorerService],
})
export class TableExplorerModule {}

