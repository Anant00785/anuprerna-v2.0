import { CreateCatalogDto } from "../dto/catalog.dto.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeCatalog(input: CreateCatalogDto): CreateCatalogDto {
  return { ...input, name: escapeHtml(input.name.trim()) };
}
