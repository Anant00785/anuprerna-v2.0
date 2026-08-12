// @ts-nocheck
export function parsePaginationInput(query: any): { page: number, size: number } {
    const page = parseInt(query?.page) || 1;
    const size = parseInt(query?.size) || 10;
    return { page, size };
}
// @ts-nocheck
// @ts-nocheck
