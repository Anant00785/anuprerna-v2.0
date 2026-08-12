// @ts-nocheck
export function parseTablePaginationInput(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const size = parseInt(query.size, 10) || 10;
    return { page, size };
}
// @ts-nocheck
// @ts-nocheck
