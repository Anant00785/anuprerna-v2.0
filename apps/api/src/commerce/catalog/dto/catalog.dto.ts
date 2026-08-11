// @ts-nocheck
export interface CatalogInput {
  id?: bigint;
  name: string;
}

export function parseCatalogInput(raw: unknown): CatalogInput {
  const obj = raw as Record<string, unknown>;
  return {
    name: typeof obj.name === "string" ? obj.name : "",
  };
}
// @ts-nocheck
// @ts-nocheck
