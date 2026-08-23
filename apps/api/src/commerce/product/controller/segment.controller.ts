// @ts-nocheck
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
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
@ApiBearerAuth()
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

  /** SegmentDAOController#retrieveFuzzySegmentsFromString(String, int) — default limit is Integer.MAX_VALUE. */
  @Get("/get/segment/fuzzy-search")
  @ApiOperation({ summary: "Fuzzy-search segments by name." })
  @ApiQuery({ name: "text", example: "SILK", description: "Search query text (e.g. SILK, WEAVE, ORGANIC)", required: true })
  @ApiQuery({ name: "limit", example: 20, description: "Maximum number of results to return", required: false })
  @ApiResponse({ status: 200, description: "Matching segments." })
  async fuzzySearchSegments(@Query("text") text: string, @Query("limit") limit?: string) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const segments = await this.segmentService.retrieveFuzzySegmentsFromString(
      text ?? "",
      parsedLimit !== undefined && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
    );
    return keyedResponse("segmentList", segments);
  }

  /** SegmentDAOController#retrieveSegmentPreviewsByCategory(String categoryName) */
  @Get("/get/segment/preview/list")
  @ApiOperation({ summary: "List segment previews, optionally filtered by category name." })
  @ApiQuery({ name: "categoryName", example: "FABRIC", description: "Category name filter", required: false })
  @ApiResponse({ status: 200, description: "Matching segment previews." })
  async getSegmentPreviewList(@Query() query: unknown) {
    const category = parseCategoryFilterQuery(query);
    const previews = await this.segmentService.retrieveSegmentPreviewsByCategory(category);
    return keyedResponse("segmentPreviewList", previews);
  }

  /** SegmentDAOController#retrieveSegmentById(Long id) — plain lookup, no throw. */
  @Get("/get/segment/by-id/:id")
  @ApiOperation({ summary: "Retrieve a single segment by id (returns null if not found)." })
  @ApiParam({ name: "id", example: 3510, type: Number })
  @ApiResponse({ status: 200, description: "Segment or null." })
  async getSegmentById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const segment = await this.segmentService.retrieveSegmentById(parsedId);
    return keyedResponse("segment", segment);
  }

  /** SegmentDAOController#retrieveSegment(Long id) — throws if not found. */
  @Get("/get/segment/:segmentId")
  @ApiOperation({ summary: "Retrieve a single segment by id." })
  @ApiParam({ name: "segmentId", example: 3510, type: Number })
  @ApiResponse({ status: 200, description: "Segment found." })
  @ApiResponse({ status: 404, description: "Segment not found." })
  async getSegment(@Param("segmentId") segmentId: string) {
    const id = parseSegmentIdParam(segmentId);
    const segment = await this.segmentService.retrieveSegment(id);
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
  @ApiOperation({ summary: "Create a new segment." })
  @ApiResponse({ status: 201, description: "Segment created." })
  @ApiResponse({ status: 400, description: "Segment failed validation." })
  @ApiResponse({ status: 404, description: "Parent category not found." })
  async createSegment(@Body() body: unknown, @UploadedFiles() files: unknown) {
    const input = parseCreateSegmentRequest(body, files);
    await this.segmentService.createSegment(input);
    return simpleResponse(true, SegmentMessages.SEGMENT_CREATED);
  }

  /** SegmentDAOController#updateSegment(Segment segment) — multipart, iconFile/socialImageFile optional. */
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
  @ApiParam({ name: "segmentId", description: "Segment ID", example: 3510, type: Number })
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
  @ApiParam({ name: "segmentId", example: 3510, type: Number })
  @ApiResponse({ status: 200, description: "Deletion result — success or a descriptive refusal reason." })
  async deleteSegment(@Param("segmentId") segmentId: string) {
    const id = parseSegmentIdParam(segmentId);
    const result = await this.segmentService.deleteSegment(id);
    const succeeded = result === "";
    return simpleResponse(succeeded, succeeded ? SegmentMessages.SEGMENT_DELETED : result);
  }

  /** SegmentDAOController#retrieveFuzzySegmentsFromString(String, int) — default limit is Integer.MAX_VALUE. */
  @Get("/get/segment/fuzzy-search")
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
  @ApiOperation({ summary: "List segment previews, optionally filtered by category name." })
  @ApiResponse({ status: 200, description: "Matching segment previews." })
  async getSegmentPreviewList(@Query() query: unknown) {
    const category = parseCategoryFilterQuery(query);
    const previews = await this.segmentService.retrieveSegmentPreviewsByCategory(category);
    return keyedResponse("segmentPreviewList", previews);
  }

  /** SegmentDAOController#retrieveSegmentData(int page, int size) */
  @Get("/get/table-explorer/data/segment")
  @ApiOperation({ summary: "Paginated table-explorer projection of segments." })
  @ApiResponse({ status: 200, description: "Page of segment data." })
  async getSegmentData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const segments = await this.segmentService.retrieveSegmentData(page, size);
    return keyedResponse("segmentList", segments);
  }

  /** SegmentDAOController#retrieveSegment(Long id) in table-explorer namespace. */
  @Get("/get/table-explorer/data/segment/:id")
  @ApiOperation({ summary: "Table-explorer projection of a single segment." })
  @ApiResponse({ status: 200, description: "Segment data or null." })
  async getSegmentDataById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const segment = await this.segmentService.retrieveSegmentById(parsedId);
    return keyedResponse("segment", segment);
  }
}
