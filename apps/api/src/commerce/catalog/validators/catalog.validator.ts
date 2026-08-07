import { CatalogInput } from "../dto/catalog.dto.js";

export function validateCatalog(input: CatalogInput): string | null {
  if (!input.name || input.name.trim().length === 0) return "Name is required.";
  return null;
}