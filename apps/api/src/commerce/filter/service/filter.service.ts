// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { FilterRepository } from "../repository/filter.repository.js";
import { FabricFilterPreview, FinishedFilterPreview, FabricProductFilterParameters } from "../types/filter.types.js";

@Injectable()
export class FilterService {
    constructor(private readonly filterRepository: FilterRepository) {}

    async getFabricFilterPreviewList(category?: string, segmentCategory?: string): Promise<FabricFilterPreview[]> {
        return this.filterRepository.findFabricFilterPreview(category || null, segmentCategory || null);
    }

    async getFabricFilterPreviewListPaginated(category?: string, segmentCategory?: string, pageSize: number = 20, pageNumber: number = 0): Promise<FabricFilterPreview[]> {
        return this.filterRepository.findFabricFilterPreviewPage(category || null, segmentCategory || null, pageSize, pageNumber * pageSize);
    }

    async getFinishedFilterPreviewList(category?: string): Promise<FinishedFilterPreview[]> {
        return this.filterRepository.findFinishedFilterPreview(category || null);
    }

    async getFilteredFabricFilterPreviewList(params: FabricProductFilterParameters): Promise<FabricFilterPreview[]> {
        return this.filterRepository.findFabricFilterPreviewFiltered(params);
    }

    async getFilterSegmentList(category?: string): Promise<any[]> {
        return this.filterRepository.findSegmentPreview(category || null);
    }
}
