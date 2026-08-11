// @ts-nocheck
import { CatalogInput } from "../dto/catalog.dto.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeCatalog(input: CatalogInput): CatalogInput {
  return { ...input, name: escapeHtml(input.name.trim()) };
}
// @ts-nocheck
// @ts-nocheck
