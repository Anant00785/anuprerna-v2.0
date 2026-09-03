import { CreateCatalogDto } from "../dto/catalog.dto.js";

export function validateCatalog(input: CreateCatalogDto): string | null {
  if (!input.name || input.name.trim().length === 0) return "Name is required.";
  return null;
}
