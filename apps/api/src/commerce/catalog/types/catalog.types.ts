// Placeholders for shapes not yet migrated from the Java source. `interface X {}`
// accepts any non-nullish value including `0` and `""`, which is weaker than no
// type at all; `Record<string, unknown>` states "object of unknown shape" honestly.
// Replace each with the real field list as the catalog domain is migrated.
export type CatalogData = Record<string, unknown>;
export type CatalogItemData = Record<string, unknown>;
export type CatalogItemMediaData = Record<string, unknown>;
export type CatalogPdfData = Record<string, unknown>;
