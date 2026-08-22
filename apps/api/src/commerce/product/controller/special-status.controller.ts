// @ts-nocheck
/**
 * apps/api/src/product/special-status/special-status.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.special_status.controller.SpecialStatusController's
 * business logic (see special-status.service.ts's own header note:
 * controller generation was deferred there pending RequestMapper.java,
 * still not present in this workspace). Route paths follow the same
 * "/verb/resource[/:id]" convention already source-established in
 * auth.controller.ts, cart.controller.ts, category.controller.ts, and
 * SkuGroup.controller.ts — NOT SOURCE-VERIFIED against a live
 * RequestMapper.class dump. `deleteSpecialStatus`'s path variable is named
 * `:statusId`, not `:id` — source-verified from special-status.dto.ts's
 * `parseStatusIdParam` doc comment.
 *
 * Route map (inferred — see note above):
 *   GET    /get/special-status/list                            CODE_SU
 *   POST   /add/special-status                                  CODE_SU
 *   PATCH  /update/special-status                                CODE_SU
 *   DELETE /delete/special-status/:statusId                      CODE_SU
 *   GET    /get/table-explorer/data/special-status                CODE_SU
 *   GET    /get/table-explorer/data/special-status/:id             CODE_SU
 *
 * updateSpecialStatus: SpecialStatusService#updateSpecialStatus already
 * catches OptimisticLockError internally and rethrows it as a
 * BadRequestException (unlike SkuGroup/Cart's uncaught-propagation
 * pattern), so no separate try/catch for it is needed here.
 *
 * deleteSpecialStatus: SpecialStatusService#deleteSpecialStatus is the
 * literal unimplemented Java stub (`// TODO: implement delete; return
 * true;`) — ported as-is, always reports success without touching the
 * database, same as SkuGroup.controller.ts's deleteSkuGroup.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SpecialStatusService } from "../special-status/service/special-status.service.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCreateSpecialStatusRequest,
  parseIdParam,
  parseStatusIdParam,
  parseTableExplorerPageQuery,
  parseUpdateSpecialStatusRequest,
} from "../special-status/dto/special-status.dto.js";
import { SpecialStatusMessages } from "../special-status/types/special-status.types.js";

@ApiTags("SpecialStatus")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SpecialStatusController {
  constructor(private readonly specialStatusService: SpecialStatusService) {}

  /** SpecialStatusDaoController#retrieveSpecialStatusList() */
  @Get("/get/special-status/list")
  @ApiOperation({ summary: "List every special status." })
  @ApiResponse({ status: 200, description: "Full special status list." })
  async getSpecialStatusList() {
    const specialStatuses = await this.specialStatusService.retrieveSpecialStatusList();
    return keyedResponse("specialStatusList", specialStatuses);
  }

  /** SpecialStatusDaoController#createSpecialStatus(SpecialStatus entity) */
  @Post("/add/special-status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new special status." })
  @ApiResponse({ status: 200, description: "Special status created." })
  @ApiResponse({ status: 400, description: "Special status failed validation." })
  async createNewSpecialStatus(@Body() body: unknown) {
    const input = parseCreateSpecialStatusRequest(body);
    await this.specialStatusService.createSpecialStatus(input);
    return simpleResponse(true, SpecialStatusMessages.NEW_SPECIAL_STATUS_CREATED);
  }

  /**
   * SpecialStatusDaoController#updateSpecialStatus(SpecialStatus updatedEntity)
   * — service already throws BadRequestException/NotFoundException on
   * failure (including the OptimisticLockError case), so success here
   * simply means the service resolved without throwing.
   */
  @Patch("/update/special-status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing special status' name." })
  @ApiResponse({ status: 200, description: "Special status updated." })
  @ApiResponse({ status: 400, description: "Special status failed validation, or was modified by another request." })
  @ApiResponse({ status: 404, description: "Special status not found." })
  async updateSpecialStatus(@Body() body: unknown) {
    const input = parseUpdateSpecialStatusRequest(body);
    await this.specialStatusService.updateSpecialStatus(input);
    return simpleResponse(true, SpecialStatusMessages.SPECIAL_STATUS_UPDATED);
  }

  /**
   * SpecialStatusDaoController#deleteSpecialStatus(Long id) — source is an
   * unimplemented stub (always returns true, no actual deletion);
   * SpecialStatusService#deleteSpecialStatus mirrors that exactly.
   */
  @Delete("/delete/special-status/:statusId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a special status. NOTE: source is an unimplemented stub — always reports success, no row is actually deleted." })
  @ApiResponse({ status: 200, description: "Always reports success (see summary)." })
  async deleteSpecialStatus(@Param("statusId") statusId: string) {
    const id = parseStatusIdParam(statusId);
    const deleted = await this.specialStatusService.deleteSpecialStatus(id);
    return simpleResponse(deleted, SpecialStatusMessages.SPECIAL_STATUS_DELETED);
  }

  /** SpecialStatusDaoController#retrieveSpecialStatusData(int page, int size) */
  @Get("/get/table-explorer/data/special-status")
  @ApiOperation({ summary: "Paginated table-explorer projection of special statuses." })
  @ApiResponse({ status: 200, description: "Page of special status data." })
  async getSpecialStatusData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.specialStatusService.retrieveSpecialStatusData(page, size);
    return keyedResponse("specialStatusDataList", data);
  }

  /** SpecialStatusDaoController#retrieveSpecialStatusDataById(Long id) */
  @Get("/get/table-explorer/data/special-status/:id")
  @ApiOperation({ summary: "Table-explorer projection of a single special status." })
  @ApiResponse({ status: 200, description: "Special status data or null." })
  async getSpecialStatusDataById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const data = await this.specialStatusService.retrieveSpecialStatusDataById(BigInt(parsedId));
    return keyedResponse("specialStatusData", data);
  }
}
// @ts-nocheck
