import { GateCode } from "../../../auth/types/auth.types.js";
import { RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { FilterService } from "../service/filter.service.js";
import { parseFabricProductFilterParameters } from "../dto/filter.dto.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

@Controller()
@UseGuards(RolesGuard)
@ApiTags("Filter")
export class FilterController {
    constructor(private readonly filterService: FilterService) {}

    @Get("/get/filter/fabric")
    @ApiOperation({ summary: "Get fabric product filter preview grid." })
    @ApiQuery({ name: "category", description: "Filter by category name (e.g. FABRIC, Fabrics)", example: "Fabrics", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name (e.g. ORGANIC AND NATURAL)", example: "ORGANIC AND NATURAL", required: false })
    async getFabricFilterPreviewList(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string
    ) {
        try {
            const products = await this.filterService.getFabricFilterPreviewList(category, segmentCategory);
            return keyedResponse("products", products);
        } catch (error) {
            console.warn("Filter preview query failed; returning an empty result.", error);
            return keyedResponse("products", []);
        }
    }

    @Get("/get/fabric-preview-list")
    @ApiOperation({ summary: "Get fabric preview list (alias)." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "Fabrics", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name", example: "ORGANIC AND NATURAL", required: false })
    async getFabricPreviewListAlias(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string
    ) {
        return this.getFabricFilterPreviewList(category, segmentCategory);
    }

    @Get("/get/v2/filter/fabric")
    @ApiOperation({ summary: "Get paginated fabric product filter preview grid (v2)." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "Fabrics", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name", example: "ORGANIC AND NATURAL", required: false })
    @ApiQuery({ name: "pageSize", description: "Number of items per page", example: "20", required: false })
    @ApiQuery({ name: "pageNumber", description: "Page offset index (0-indexed)", example: "0", required: false })
    async getFabricFilterPreviewListPaginated(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string,
        @Query("pageSize") pageSize?: string,
        @Query("pageNumber") pageNumber?: string
    ) {
        const size = pageSize ? parseInt(pageSize, 10) : 20;
        const page = pageNumber ? parseInt(pageNumber, 10) : 0;
        const products = await this.filterService.getFabricFilterPreviewListPaginated(category, segmentCategory, size, page);
        return keyedResponse("products", products);
    }

    @Get("/get/filter/finished")
    @ApiOperation({ summary: "Get finished product filter preview grid." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "Apparel", required: false })
    async getFinishedFilterPreviewList(
        @Query("category") category?: string
    ) {
        const products = await this.filterService.getFinishedFilterPreviewList(category);
        return keyedResponse("products", products);
    }

    @Get("/get/filter/fabric/filtered")
    @ApiOperation({ summary: "Get filtered fabric filter preview list." })
    async getFilteredFabricFilterPreviewList(
        @Query() query: any
    ) {
        const params = parseFabricProductFilterParameters(query);
        const products = await this.filterService.getFilteredFabricFilterPreviewList(params);
        return keyedResponse("products", products);
    }

    @Get("/get/filter/segment-list")
    @ApiOperation({ summary: "Get filter segments list." })
    @ApiQuery({ name: "category", description: "Filter segments by category name (e.g. Fabrics, SwatchKit, Apparel, Accessories, Home)", required: false })
    async getFilterSegmentList(@Query("category") category?: string) {
        const segmentList = await this.filterService.getFilterSegmentList(category);
        return keyedResponse("segmentList", segmentList);
    }

    @Get("/get/filter/segment/list")
    @ApiOperation({ summary: "Get filter segments list (slash alias)." })
    @ApiQuery({ name: "category", description: "Filter segments by category name", required: false })
    async getFilterSegmentListSlash(@Query("category") category?: string) {
        return this.getFilterSegmentList(category);
    }

    @Get("/get/segment-list")
    @ApiOperation({ summary: "Get segment list (LOOM legacy route)." })
    @ApiQuery({ name: "category", description: "Filter segments by category name", required: false })
    @RequireGate(GateCode.CODE_SU)
    async getSegmentList(@Query("category") category?: string) {
        return this.getFilterSegmentList(category);
    }
}
