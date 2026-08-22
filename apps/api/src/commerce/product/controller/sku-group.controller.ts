// @ts-nocheck
/**
 * apps/api/src/product/sku_group/SkuGroup.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.sku_group.controller.SkuGroupController's
 * business logic (see SkuGroup.module.ts's own header note: controller
 * generation was deferred there pending RequestMapper.java, which is still
 * not present in this workspace). Route paths follow the same
 * "/verb/resource[/:id]" convention already source-established in
 * auth.controller.ts, cart.controller.ts, and category.controller.ts —
 * NOT SOURCE-VERIFIED against a live RequestMapper.class dump. The route
 * *constant names* referenced in SkuGroup.module.ts's header comment
 * (GET_SKU_GROUP_LIST, ADD_SKU_GROUP, UPDATE_SKU_GROUP, DELETE_SKU_GROUP,
 * GET_TABLE_EXPLORER_DATA_SKU_GROUP, GET_TABLE_EXPLORER_DATA_SKU_GROUP_BY_ID)
 * are followed 1:1 in the route list below.
 *
 * Route map (inferred — see note above):
 *   GET    /get/sku-group/list                            CODE_SU
 *   POST   /add/sku-group                                  CODE_SU
 *   PATCH  /update/sku-group                                CODE_SU
 *   DELETE /delete/sku-group/:groupId                       CODE_SU
 *   GET    /get/table-explorer/data/sku-group                CODE_SU
 *   GET    /get/table-explorer/data/sku-group/:id             CODE_SU
 *
 * Update path: SkuGroupService#updateSkuGroup lets an uncaught
 * OptimisticLockError propagate (mirrored 1:1 from source's unmodeled
 * OptimisticLockException) — caught here and surfaced as 409 Conflict,
 * exactly like cart.controller.ts's updateCartItem.
 *
 * deleteSkuGroup: SkuGroupService#deleteSkuGroup is the literal
 * unimplemented Java stub (`// TODO: implement delete; return true;`) —
 * ported as-is, always reports success without touching the database.
 */
import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkuGroupService } from "../sku-group/service/sku-group.service.js";
import { OptimisticLockError } from "../sku-group/repository/sku-group.repository.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { parseCreateSkuGroupRequest, parseGroupIdParam, parseIdParam, parseTableExplorerPageQuery, parseUpdateSkuGroupRequest } from "../sku-group/dto/sku-group.dto.js";
import { SkuGroupMessages } from "../sku-group/types/sku-group.types.js";
import { ActionCode } from "../../../common/errors/action-code.js";

@ApiTags("SkuGroup")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SkuGroupController {
  constructor(private readonly skuGroupService: SkuGroupService) {}

  /** SkuGroupDaoController#retrieveSkuGroupList() */
  @Get("/get/sku-group/list")
  @ApiOperation({ summary: "List every SKU group." })
  @ApiResponse({ status: 200, description: "Full SKU group list." })
  async getSkuGroupList() {
    const skuGroups = await this.skuGroupService.retrieveSkuGroupList();
    return keyedResponse("skuGroupList", skuGroups);
  }

  /** SkuGroupDaoController#createSkuGroup(SkuGroup entity) */
  @Post("/add/sku-group")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new SKU group." })
  @ApiResponse({ status: 200, description: "SKU group created." })
  @ApiResponse({ status: 400, description: "SKU group failed validation." })
  async createNewSkuGroup(@Body() body: unknown) {
    const input = parseCreateSkuGroupRequest(body);
    const result = await this.skuGroupService.createSkuGroup(input);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? SkuGroupMessages.NEW_SKU_GROUP_CREATED : "Failed to create sku group.",
    );
  }

  /** SkuGroupDaoController#updateSkuGroup(SkuGroup updatedEntity) */
  @Patch("/update/sku-group")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing SKU group's name." })
  @ApiResponse({ status: 200, description: "SKU group updated." })
  @ApiResponse({ status: 400, description: "SKU group failed validation." })
  @ApiResponse({ status: 409, description: "SKU group was modified by another request." })
  async updateSkuGroup(@Body() body: unknown) {
    const input = parseUpdateSkuGroupRequest(body);
    let result: number;
    try {
      result = await this.skuGroupService.updateSkuGroup(input);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This sku group was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? SkuGroupMessages.SKU_GROUP_UPDATED : "Failed to update sku group.",
    );
  }

  /**
   * SkuGroupDaoController#deleteSkuGroup(Long id) — source is an
   * unimplemented stub (always returns true, no actual deletion);
   * SkuGroupService#deleteSkuGroup mirrors that exactly, and this route
   * does too.
   */
  @Delete("/delete/sku-group/:groupId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a SKU group. NOTE: source is an unimplemented stub — always reports success, no row is actually deleted." })
  @ApiResponse({ status: 200, description: "Always reports success (see summary)." })
  async deleteSkuGroup(@Param("groupId") groupId: string) {
    const id = parseGroupIdParam(groupId);
    const deleted = await this.skuGroupService.deleteSkuGroup(id);
    return simpleResponse(deleted, SkuGroupMessages.SKU_GROUP_DELETED);
  }

  /** SkuGroupDaoController#retrieveSkuGroupData(int page, int size) */
  @Get("/get/table-explorer/data/sku-group")
  @ApiOperation({ summary: "Paginated table-explorer projection of SKU groups." })
  @ApiResponse({ status: 200, description: "Page of SKU group data." })
  async getSkuGroupData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.skuGroupService.retrieveSkuGroupData(page, size);
    return keyedResponse("skuGroupDataList", data);
  }

  /** SkuGroupDaoController#retrieveSkuGroupDataById(Long id) */
  @Get("/get/table-explorer/data/sku-group/:id")
  @ApiOperation({ summary: "Table-explorer projection of a single SKU group." })
  @ApiResponse({ status: 200, description: "SKU group data or null." })
  async getSkuGroupDataById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const data = await this.skuGroupService.retrieveSkuGroupDataById(BigInt(parsedId));
    return keyedResponse("skuGroupData", data);
  }
}
// @ts-nocheck
