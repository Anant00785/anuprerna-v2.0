// @ts-nocheck
/**
 * apps/api/src/commerce/product/segment/controller/segment.controller.ts
 *
 * Direct port of com.bloomscorp.loom.product.segment.controller.SegmentController's
 * business logic (see segment.service.ts's own header note: controller
 * generation was deferred there pending RequestMapper.java, which is still
 * not present in this workspace). Route paths follow the same
 * "/verb/resource[/:id]" convention already source-established in
 * auth.controller.ts, cart.controller.ts, and category.controller.ts —
 * NOT SOURCE-VERIFIED against a live RequestMapper.class dump. All routes
 * gated CODE_SU, matching Category's all-CODE_SU pattern (Segment sits at
 * the same admin-only tier in the Category → Segment → SubCategory
 * hierarchy).
 *
 * Route map (inferred — see note above):
 *   GET    /get/segment/:segmentId                     CODE_SU
 *   GET    /get/segment/list                            CODE_SU
 *   GET    /get/segment/by-id/:id                       CODE_SU
 *   POST   /add/segment                     (multipart) CODE_SU
 *   PATCH  /update/segment/:segmentId        (multipart) CODE_SU
 *   DELETE /delete/segment/:segmentId                   CODE_SU
 *   GET    /get/segment/fuzzy-search                    CODE_SU
 *   GET    /get/segment/preview/list                    CODE_SU
 *   GET    /get/table-explorer/data/segment              CODE_SU
 *   GET    /get/table-explorer/data/segment/:id          CODE_SU
 *
 * deleteSegment: SegmentService#deleteSegment already mirrors
 * CategoryService#deleteCategory's descriptive-string pattern (returns ""
 * on success, a descriptive refusal reason otherwise) — ported the same
 * way category.controller.ts's deleteCategory handles it.
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SegmentService } from "../segment/service/segment.service.js";
import { GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import {
  parseCategoryFilterQuery,
  parseCreateSegmentRequest,
  parseIdParam,
  parseSegmentIdParam,
  parseTableExplorerPageQuery,
  parseUpdateSegmentRequest,
} from "../segment/dto/segment.dto.js";
import { SegmentMessages } from "../segment/types/segment.types.js";

@ApiTags("Segment")
@Controller()
@UseGuards(RolesGuard)
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  /** SegmentDAOController#retrieveSegmentList() */
  @Get("/get/segment/list")
  @ApiOperation({ summary: "List every segment." })
  @ApiResponse({ status: 200, description: "Full segment list." })
  async getSegmentList() {
    const segments = await this.segmentService.retrieveSegmentList();
    return keyedResponse("segmentList", segments);
  }

  /** SegmentDAOController#retrieveSegment(Long id) — throws if not found. */
  @Get("/get/segment/:segmentId")
  @ApiOperation({ summary: "Retrieve a single segment by id." })
  @ApiResponse({ status: 200, description: "Segment found." })
  @ApiResponse({ status: 404, description: "Segment not found." })
  async getSegment(@Param("segmentId") segmentId: string) {
    const id = parseSegmentIdParam(segmentId);
    const segment = await this.segmentService.retrieveSegment(id);
    return keyedResponse("segment", segment);
  }

  /** SegmentDAOController#retrieveSegmentById(Long id) — plain lookup, no throw. */
  @Get("/get/segment/by-id/:id")
  @ApiOperation({ summary: "Retrieve a single segment by id (returns null if not found)." })
  @ApiResponse({ status: 200, description: "Segment or null." })
  async getSegmentById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const segment = await this.segmentService.retrieveSegmentById(parsedId);
    return keyedResponse("segment", segment);
  }

  /** SegmentDAOController#createNewSegment(Segment segment) — multipart, iconFile/socialImageFile optional. */
  @Post("/add/segment")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "categoryId"],
      properties: {
        name: { type: "string", example: "NATURAL AND ORGANIC", description: "Segment Name" },
        categoryId: { type: "number", example: 2558, description: "Parent Category ID" },
        iconFile: { type: "string", format: "binary", description: "Icon image file" },
        socialImageFile: { type: "string", format: "binary", description: "Social share image file" },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: "iconFile", maxCount: 1 }, { name: "socialImageFile", maxCount: 1 }]))
  @ApiOperation({ summary: "Create a new segment under a category." })
  @ApiResponse({ status: 200, description: "Segment created." })
  @ApiResponse({ status: 400, description: "Segment failed validation." })
  @ApiResponse({ status: 404, description: "Parent category not found." })
  async createNewSegment(@Body() body: unknown, @UploadedFiles() files: unknown) {
    const input = parseCreateSegmentRequest(body, files);
    await this.segmentService.createNewSegment(input);
    return simpleResponse(true, SegmentMessages.NEW_SEGMENT_CREATED);
  }

  /** SegmentDAOController#updateSegment(Segment updatedSegment, Long segmentId) — multipart. */
  @Patch("/update/segment/:segmentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "NATURAL AND ORGANIC", description: "Segment Name" },
        categoryId: { type: "number", example: 2558, description: "Parent Category ID" },
        iconFile: { type: "string", format: "binary", description: "Icon image file" },
        socialImageFile: { type: "string", format: "binary", description: "Social share image file" },
      },
    },
  })
  @ApiParam({ name: "segmentId", description: "Segment ID", example: 1, type: Number })
  @UseInterceptors(FileFieldsInterceptor([{ name: "iconFile", maxCount: 1 }, { name: "socialImageFile", maxCount: 1 }]))
  @ApiOperation({ summary: "Update an existing segment." })
  @ApiResponse({ status: 200, description: "Segment updated." })
  @ApiResponse({ status: 400, description: "Segment failed validation." })
  @ApiResponse({ status: 404, description: "Segment or parent category not found." })
  async updateSegment(@Param("segmentId") segmentId: string, @Body() body: unknown, @UploadedFiles() files: unknown) {
    const id = parseSegmentIdParam(segmentId);
    const input = parseUpdateSegmentRequest(body, files);
    await this.segmentService.updateSegment(id, input);
    return simpleResponse(true, SegmentMessages.SEGMENT_UPDATED);
  }

  /**
   * SegmentDAOController#deleteSegment(Long id) — refuses deletion when
   * sub-categories are still attached, returning the source's descriptive
   * string instead of a plain boolean.
   */
  @Delete("/delete/segment/:segmentId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a segment (refused if sub-categories are still attached)." })
  @ApiResponse({ status: 200, description: "Deletion result — success or a descriptive refusal reason." })
  async deleteSegment(@Param("segmentId") segmentId: string) {
    const id = parseSegmentIdParam(segmentId);
    const result = await this.segmentService.deleteSegment(id);
    const succeeded = result === "";
    return simpleResponse(succeeded, succeeded ? SegmentMessages.SEGMENT_DELETED : result);
  }

  /** SegmentDAOController#retrieveFuzzySegmentsFromString(String, int) — default limit is Integer.MAX_VALUE. */
  @Get("/get/segment/fuzzy-search")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fuzzy-search segments by name." })
  @ApiResponse({ status: 200, description: "Matching segments." })
  async fuzzySearchSegments(@Query("text") text: string, @Query("limit") limit?: string) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const segments = await this.segmentService.retrieveFuzzySegmentsFromString(
      text,
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
    );
    return keyedResponse("segmentList", segments);
  }

  /** SegmentDAOController#retrieveSegmentPreviewsByCategory(String categoryName) */
  @Get("/get/segment/preview/list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "List segment previews, optionally filtered by category name." })
  @ApiResponse({ status: 200, description: "Matching segment previews." })
  async getSegmentPreviewList(@Query() query: unknown) {
    const category = parseCategoryFilterQuery(query);
    const previews = await this.segmentService.retrieveSegmentPreviewsByCategory(category);
    return keyedResponse("segmentPreviewList", previews);
  }

  /** SegmentDAOController#retrieveSegmentData(int page, int size) */
  @Get("/get/table-explorer/data/segment")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated table-explorer projection of segments." })
  @ApiResponse({ status: 200, description: "Page of segment data." })
  async getSegmentData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const data = await this.segmentService.retrieveSegmentData(page, size);
    return keyedResponse("segmentDataList", data);
  }

  /** SegmentDAOController#retrieveSegmentDataById(Long id) */
  @Get("/get/table-explorer/data/segment/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table-explorer projection of a single segment." })
  @ApiResponse({ status: 200, description: "Segment data or null." })
  async getSegmentDataById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const data = await this.segmentService.retrieveSegmentDataById(parsedId);
    return keyedResponse("segmentData", data);
  }
}   
// @ts-nocheck
