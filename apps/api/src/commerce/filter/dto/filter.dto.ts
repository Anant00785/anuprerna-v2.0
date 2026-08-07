import { FabricProductFilterParameters } from "../types/filter.types.js";

export function parseFabricProductFilterParameters(query: unknown): FabricProductFilterParameters {
    const raw = (query || {}) as Record<string, unknown>;
    
    return {
        colors: typeof raw.colors === "string" ? raw.colors : undefined,
        materials: typeof raw.materials === "string" ? raw.materials : undefined,
        patterns: typeof raw.patterns === "string" ? raw.patterns : undefined,
        minPrice: typeof raw.minPrice === "string" && !isNaN(Number(raw.minPrice)) ? Number(raw.minPrice) : (typeof raw.minPrice === "number" ? raw.minPrice : undefined),
        maxPrice: typeof raw.maxPrice === "string" && !isNaN(Number(raw.maxPrice)) ? Number(raw.maxPrice) : (typeof raw.maxPrice === "number" ? raw.maxPrice : undefined),
        minGSM: typeof raw.minGSM === "string" && !isNaN(Number(raw.minGSM)) ? Number(raw.minGSM) : (typeof raw.minGSM === "number" ? raw.minGSM : undefined),
        maxGSM: typeof raw.maxGSM === "string" && !isNaN(Number(raw.maxGSM)) ? Number(raw.maxGSM) : (typeof raw.maxGSM === "number" ? raw.maxGSM : undefined),
        segments: typeof raw.segments === "string" ? raw.segments : undefined,
        subCategories: typeof raw.subCategories === "string" ? raw.subCategories : undefined,
        pageNumber: typeof raw.pageNumber === "string" && !isNaN(Number(raw.pageNumber)) ? Number(raw.pageNumber) : (typeof raw.pageNumber === "number" ? raw.pageNumber : 0),
        pageSize: typeof raw.pageSize === "string" && !isNaN(Number(raw.pageSize)) ? Number(raw.pageSize) : (typeof raw.pageSize === "number" ? raw.pageSize : 20),
    };
}
