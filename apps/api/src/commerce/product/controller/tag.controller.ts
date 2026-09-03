/**
 * apps/api/src/catalog/product/tag/controller/tag.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.tag.controller.TagController's
 * business logic (see tag.module.ts's own header note: controller
 * generation was deferred there pending RequestMapper.java, still not
 * present in this workspace). Route paths follow the same
 * "/verb/resource[/:id]" convention already source-established in
 * auth.controller.ts, cart.controller.ts, and category.controller.ts —
 * NOT SOURCE-VERIFIED against a live RequestMapper.class dump.
 *
 * Route map (inferred — see note above):
 *   GET    /get/tag/list                                CODE_SU
 *   GET    /get/tag/by-ids                               CODE_SU
 *   GET    /get/tag/:id                                  CODE_SU
 *   POST   /add/tag                                       CODE_SU
 *   PATCH  /update/tag                                     CODE_SU
 *   GET    /get/table-explorer/data/tag                     CODE_SU
 *   GET    /get/table-explorer/data/tag/:id                  CODE_SU
 *
 * No TagMessages export exists in types/tag.types.ts (unlike
 * Category/Segment/SkuGroup/SpecialStatus) — response message strings
 * below are inline literals, flagged NOT source-verified (same caveat
 * every *Messages const in this codebase already carries: LogMessage.java
 * isn't in the uploaded repository).
 *
 * retrieveTagsByIds(List<Long> ids): source's exact query-param format for
 * a List<Long> path isn't recoverable without RequestMapper.java either —
 * a comma-separated `?ids=1,2,3` query param is used here as the most
 * common Spring MVC convention for this shape; confirm against source
 * before shipping.
 *
 * updateTag: TagService#updateTag already catches OptimisticLockError
 * internally and rethrows it as a BadRequestException (same pattern as
 * SpecialStatusService#updateSpecialStatus), so no separate try/catch for
 * it is needed here.
 */
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TagService } from "../tag/service/tag.service.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { parseCreateTagRequest, parseIdParam, parseTableExplorerPageQuery, parseUpdateTagRequest } from "../tag/dto/tag.dto.js";

@ApiTags("Tag")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  /** TagDAOController#retrieveTagList() */
  @Get("/get/tag/list")
  @ApiOperation({ summary: "List every tag." })
  @ApiResponse({ status: 200, description: "Full tag list." })
  @RequireGate(GateCode.CODE_SUCU)
  async getTagList() {
    const tags = await this.tagService.retrieveTagList();
    return keyedResponse("tagList", tags);
  }

  /**
   * TagDAOController#retrieveTagsByIds(List<Long> ids) — NOT
   * SOURCE-VERIFIED query-param shape, see file header.
   */
  @Get("/get/tag/by-ids")
  @ApiOperation({ summary: "Retrieve multiple tags by id (comma-separated ?ids=1,2,3)." })
  @ApiResponse({ status: 200, description: "Matching tags." })
  @RequireGate(GateCode.CODE_SUCU)
  async getTagsByIds(@Query("ids") ids: string) {
    const parsedIds = (ids ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => BigInt(s));
    const tags = await this.tagService.retrieveTagsByIds(parsedIds);
    return keyedResponse("tagList", tags);
  }

  /** TagDAOController#retrieveTagById(Long id) */
  @Get("/get/tag/:id")
  @ApiOperation({ summary: "Retrieve a single tag by id." })
  @ApiResponse({ status: 200, description: "Tag." })
  @ApiResponse({ status: 400, description: "Malformed tag id." })
  @ApiResponse({ status: 404, description: "No such tag." })
  @RequireGate(GateCode.CODE_SU)
  async getTagById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const tag = await this.tagService.retrieveTagById(parsedId);
    if (!tag) throw new NotFoundException(`Tag ${id} not found.`);
    return keyedResponse("tag", tag);
  }

  /** TagDAOController#createTag(Tag entity) */
  @Post("/add/tag")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a new tag." })
  @ApiResponse({ status: 200, description: "Tag created." })
  @ApiResponse({ status: 400, description: "Tag failed validation." })
  async createNewTag(@Body() body: unknown) {
    const input = parseCreateTagRequest(body);
    await this.tagService.createTag(input);
    return simpleResponse(true, "Tag created successfully.");
  }

  /**
   * TagDAOController#updateTag(Tag updatedEntity) — service already
   * throws BadRequestException/NotFoundException on failure (including
   * the OptimisticLockError case), so success here simply means the
   * service resolved without throwing.
   */
  @Patch("/update/tag")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update an existing tag's name." })
  @ApiResponse({ status: 200, description: "Tag updated." })
  @ApiResponse({ status: 400, description: "Tag failed validation, or was modified by another request." })
  @ApiResponse({ status: 404, description: "Tag not found." })
  async updateTag(@Body() body: unknown) {
    const input = parseUpdateTagRequest(body);
    await this.tagService.updateTag(input);
    return simpleResponse(true, "Tag updated successfully.");
  }

  /** TagDAOController#retrieveTagData(int page, int size) */
  @Get("/get/table-explorer/data/tag")
  @ApiOperation({ summary: "Paginated table-explorer projection of tags." })
  @ApiResponse({ status: 200, description: "Page of tag data." })
  @RequireGate(GateCode.CODE_SU)
  async getTagData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.tagService.retrieveTagData(page, size);
    return keyedResponse("tagDataList", data);
  }

  /** TagDAOController#retrieveTagDataById(Long id) */
  @Get("/get/table-explorer/data/tag/:id")
  @ApiOperation({ summary: "Table-explorer projection of a single tag." })
  @ApiResponse({ status: 200, description: "Tag data." })
  @ApiResponse({ status: 404, description: "No such tag." })
  @RequireGate(GateCode.CODE_SU)
  async getTagDataById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const data = await this.tagService.retrieveTagDataById(parsedId);
    if (!data) throw new NotFoundException(`Tag ${id} not found.`);
    return keyedResponse("tagData", data);
  }
}
