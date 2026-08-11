// @ts-nocheck
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { FilterService } from "../service/filter.service.js";
import { parseFabricProductFilterParameters } from "../dto/filter.dto.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

@Controller()
@ApiTags("Filter")
@ApiBearerAuth()
@UseGuards(RolesGuard)
export class FilterController {
    constructor(private readonly filterService: FilterService) {}

    @Get("/get/filter/fabric")
    @ApiOperation({ summary: "Get fabric product filter preview grid." })
    @ApiQuery({ name: "category", description: "Filter by category name (e.g. FABRIC)", example: "FABRIC", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name (e.g. NATURAL AND ORGANIC)", example: "NATURAL AND ORGANIC", required: false })
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

    @Get("/get/v2/filter/fabric")
    @ApiOperation({ summary: "Get paginated fabric product filter preview grid (v2)." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "FABRIC", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name", example: "NATURAL AND ORGANIC", required: false })
    @ApiQuery({ name: "pageSize", description: "Number of items per page", example: "20", required: false })
    @ApiQuery({ name: "pageNumber", description: "Page offset index", example: "0", required: false })
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
    @ApiQuery({ name: "category", description: "Filter by category name", example: "FINISHED", required: false })
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
}
