import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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
    async getFabricFilterPreviewList(
        @Query("category") category?: string,
        @Query("segmentCategory") segmentCategory?: string
    ) {
        const products = await this.filterService.getFabricFilterPreviewList(category, segmentCategory);
        return keyedResponse("products", products);
    }

    @Get("/get/v2/filter/fabric")
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
    async getFinishedFilterPreviewList(
        @Query("category") category?: string
    ) {
        const products = await this.filterService.getFinishedFilterPreviewList(category);
        return keyedResponse("products", products);
    }

    @Get("/get/filter/fabric/filtered")
    async getFilteredFabricFilterPreviewList(
        @Query() query: any
    ) {
        const params = parseFabricProductFilterParameters(query);
        const products = await this.filterService.getFilteredFabricFilterPreviewList(params);
        return keyedResponse("products", products);
    }
}
