/** Ports Loom's `page`/`size` request params; Java defaults are page 1, size 10. */
export function parsePaginationInput(query: Record<string, unknown>): { page: number; size: number } {
    const toInt = (value: unknown, fallback: number): number => {
        const parsed = Number.parseInt(String(value ?? ''), 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };
    return { page: toInt(query?.page, 1), size: toInt(query?.size, 10) };
}
