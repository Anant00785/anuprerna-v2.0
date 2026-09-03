export function parseWhatsappOptInInput(body: any): { mobile: string } {
    if (!body || !body.mobile) throw new Error('Invalid input: mobile is required');
    return { mobile: String(body.mobile) };
}
export function parsePaginationInput(query: any): { page: number, size: number } {
    const page = parseInt(query?.page) || 1;
    const size = parseInt(query?.size) || 10;
    return { page, size };
}
