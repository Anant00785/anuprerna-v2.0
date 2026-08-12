// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { TableExplorerController } from "./controller/table_explorer.controller.js";
import { TableExplorerService } from "./service/table_explorer.service.js";
import { TableExplorerRepository } from "./repository/table_explorer.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [TableExplorerController],
  providers: [TableExplorerService, TableExplorerRepository],
  exports: [TableExplorerService, TableExplorerRepository],
})
export class Table_explorerModule {}
