/**
 * apps/api/src/commerce/domain/product-domain.service.ts
 *
 * Service layer for the two product-shaped commerce/domain routes that were
 * answering with an arbitrary `SELECT * FROM product LIMIT 50` instead of the
 * thing they were asked for.
 *
 * Java originals:
 *   product/controller/ProductController.getRelatedProductsByIdCSV
 *     -> ProductDAOController.resolveRelatedProductsByIdCSV
 *     -> ProductNativeQuery.FIND_RELATED_PRODUCTS ("findRelatedProducts")
 *   product/controller/ProductPreviewController.getProductPreviewList
 *     -> ProductPreviewDAOController.retrieveProductPreviewList
 */
import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { ProductPreviewService } from "../product/product-preview/service/product-preview.service.js";

/** Loom: product/pojo/ProductGist — field names (snake) are the wire contract. */
export interface ProductGist {
  id: number;
  sku: string;
  name: string;
  hero_image: string;
  slug: string;
  product_group: string;
  price: number;
}

/** Loom: product/pojo/RelatedProducts — `record RelatedProducts(Long id, List<ProductGist> products)`. */
export interface RelatedProducts {
  id: number;
  products: ProductGist[];
}

function resultRows(result: unknown): Record<string, unknown>[] {
  const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

@Injectable()
export class ProductDomainService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly productPreview: ProductPreviewService,
  ) {}

  /**
   * Loom: ProductDAOController.resolveRelatedProductsByIdCSV — splits the CSV,
   * de-duplicates, drops any entry that is not all digits, and runs the
   * findRelatedProducts query once per surviving id. The per-id grouping is
   * part of the contract (the response is a list of {id, products}), so the
   * loop is Loom's, not an oversight.
   */
  async getRelatedProductsByIdCsv(csv: string): Promise<RelatedProducts[]> {
    const ids = [...new Set((csv ?? "").trim().split(",").map((s) => s.trim()))]
      .filter((s) => s.length > 0 && /^\d+$/.test(s))
      .map(Number)
      .filter((n) => Number.isSafeInteger(n) && n > 0);

    const out: RelatedProducts[] = [];
    for (const id of ids) {
      out.push({ id, products: await this.findRelatedProducts(id) });
    }
    return out;
  }

  /** ProductNativeQuery.FIND_RELATED_PRODUCTS, ported verbatim. */
  private async findRelatedProducts(productId: number): Promise<ProductGist[]> {
    const result = await this.db.execute(sql`
      WITH cascade_main_product_id AS (
        SELECT product_to_join.id AS id
        FROM product AS main_product
                 LEFT JOIN product AS product_to_join ON main_product.main_product_id = product_to_join.id
        WHERE main_product.id = ${productId}
          AND main_product.main_product_check = false
      )
      SELECT sub_product.id            AS id,
             sub_product.sku           AS sku,
             sub_product.name          AS name,
             sub_product.hero_image    AS hero_image,
             sub_product.slug          AS slug,
             sub_product.product_group AS product_group,
             sub_product.price         AS price
      FROM product AS sub_product
               INNER JOIN cascade_main_product_id ON cascade_main_product_id.id = sub_product.main_product_id
      WHERE sub_product.main_product_check = false
      UNION ALL
      SELECT product_joined.id            AS id,
             product_joined.sku           AS sku,
             product_joined.name          AS name,
             product_joined.hero_image    AS hero_image,
             product_joined.slug          AS slug,
             product_joined.product_group AS product_group,
             product_joined.price         AS price
      FROM product AS product_joined
               INNER JOIN cascade_main_product_id ON cascade_main_product_id.id = product_joined.id
      UNION ALL
      SELECT product.id            AS id,
             product.sku           AS sku,
             product.name          AS name,
             product.hero_image    AS hero_image,
             product.slug          AS slug,
             product.product_group AS product_group,
             product.price         AS price
      FROM product
      WHERE product.main_product_check = false
        AND product.main_product_id = ${productId}
    `);

    return resultRows(result).map((r) => ({
      id: Number(r.id),
      sku: String(r.sku ?? ""),
      name: String(r.name ?? ""),
      hero_image: String(r.hero_image ?? ""),
      slug: String(r.slug ?? ""),
      product_group: String(r.product_group ?? ""),
      price: Number(r.price ?? 0),
    }));
  }

  /**
   * Loom: ProductPreviewDAOController.retrieveProductPreviewList — takes no
   * arguments. ProductPreviewController.getProductPreviewList declares a
   * {category} path variable and then never passes it on, so the category is
   * genuinely ignored upstream too; that is reproduced rather than invented.
   *
   * DIVERGENCE (deliberate): Loom calls findAll(), which includes rows with
   * disabled = true. This reuses ProductPreviewService.listActive, which is
   * findAllByDisabledFalse — a disabled product must not appear in a public
   * storefront preview list. Recorded in docs/KNOWN-GAPS.md.
   */
  async getProductPreviewList() {
    // ponytail: one page big enough to be "all" in practice; Loom has no
    // pagination here at all. Swap for a cursor if the catalogue outgrows it.
    return this.productPreview.listActive(5000, 0);
  }
}
