import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { FilterService } from "../service/filter.service.js";
import { FilterRepository } from "../repository/filter.repository.js";
import { parseFabricProductFilterParameters } from "../dto/filter.dto.js";
import { keyedResponse } from "../../../common/response/rain-response.js";

/**
 * Hard ceiling for the un-paginated `*-preview-list` aliases. The storefront
 * relies on the FULL list today (fabric ~3150 rows / 2.97 MB, finished ~1033
 * rows / 2.58 MB), so the default stays "everything" — the cap only stops an
 * unbounded scan if those tables grow.
 */
const PREVIEW_LIST_MAX_ROWS = 5000;

/** `?page=&pageSize=` when supplied, otherwise everything up to the cap. */
function previewListWindow(page?: string, pageSize?: string): { limit: number; offset: number } {
    const size = pageSize ? parseInt(pageSize, 10) : NaN;
    if (!Number.isFinite(size) || size <= 0) return { limit: PREVIEW_LIST_MAX_ROWS, offset: 0 };
    const pageIndex = page ? parseInt(page, 10) : 0;
    return {
        limit: Math.min(size, PREVIEW_LIST_MAX_ROWS),
        offset: Number.isFinite(pageIndex) && pageIndex > 0 ? pageIndex * size : 0,
    };
}

@Controller()
@UseGuards(RolesGuard)
@ApiTags("Filter")
export class FilterController {
    constructor(
        private readonly filterService: FilterService,
        private readonly filterRepository: FilterRepository,
    ) {}

    @Get("/get/filter/fabric")
    @ApiOperation({ summary: "Get fabric product filter preview grid." })
    @ApiQuery({ name: "category", description: "Filter by category name (e.g. FABRIC, Fabrics)", example: "Fabrics", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name (e.g. ORGANIC AND NATURAL)", example: "ORGANIC AND NATURAL", required: false })
    async getFabricFilterPreviewList(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string
    ) {
        const products = await this.filterService.getFabricFilterPreviewList(category, segmentCategory);
        return keyedResponse("products", products);
    }

    @Get("/get/fabric-preview-list")
    @ApiOperation({ summary: "Get fabric preview list (alias)." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "Fabrics", required: false })
    @ApiQuery({ name: "segmentCategory", description: "Filter by segment name", example: "ORGANIC AND NATURAL", required: false })
    @ApiQuery({ name: "page", description: "Page index (0-based). Omit to get everything.", required: false })
    @ApiQuery({ name: "pageSize", description: "Rows per page. Omit to get everything.", required: false })
    async getFabricPreviewListAlias(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string
    ) {
        const { limit, offset } = previewListWindow(page, pageSize);
        const products = await this.filterRepository.findFabricFilterPreviewPage(
            category || null, segmentCategory || null, limit, offset,
        );
        return keyedResponse("products", products);
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

    @Get("/get/finished-preview-list")
    @ApiOperation({ summary: "Get finished preview list (alias)." })
    @ApiQuery({ name: "category", description: "Filter by category name", example: "Apparel", required: false })
    @ApiQuery({ name: "page", description: "Page index (0-based). Omit to get everything.", required: false })
    @ApiQuery({ name: "pageSize", description: "Rows per page. Omit to get everything.", required: false })
    async getFinishedPreviewListAlias(
        @Query("category") category?: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string
    ) {
        const { limit, offset } = previewListWindow(page, pageSize);
        const products = await this.filterRepository.findFinishedFilterPreviewPage(category || null, limit, offset);
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
    // UNGATED deliberately, and this DIVERGES from legacy Loom, where
    // /get/segment-list answers 401. Owner-approved on 2026-09-03.
    //
    // The justification is the DATA, not the existence of a public twin:
    // /get/filter/segment/list is our own route (404 on loom-v2), so it is no
    // evidence of anything. `segment` is 23 rows of catalogue taxonomy —
    // id, category_id, name ("NATURAL AND ORGANIC", "RESIST DYED"), an S3 icon
    // URL and SEO meta_title/meta_description. No customer data, no PII; the
    // names are already in public storefront URLs and the meta tags exist to be
    // crawled. Gating it only forced the storefront to ship a service-account
    // JWT to read a public filter list, which is the worse trade.
    //
    // Do NOT generalise this to /get/category-list or /get/sub-category-list:
    // those stay CODE_SU, matching legacy, and the CMS already sends a token.
    async getSegmentList(@Query("category") category?: string) {
        return this.getFilterSegmentList(category);
    }
}
