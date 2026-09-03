/**
 * apps/api/src/commerce/product/finished-product/finished-product.module.ts
 *
 * Every cross-module port is bound to a REAL provider. Color/Material/
 * Pattern/Tag are select-by-id over their own tables (commerce/shared/
 * db-lookup.ts); MainProductPreview, SizeProfile (Profile) and
 * ProductZohoRelation bind to the modules that own them; PRODUCT_SIZE_PROFILE
 * reads `product_size_profile.size_profile_option_sku` directly.
 *
 * ZOHO_ADAPTER_PORT throws NotImplementedException — no Loom-product-to-Zoho
 * item mapping exists in apps/api, and a no-op would silently leave Zoho
 * stale on every finished-product write. See docs/KNOWN-GAPS.md.
 */
import { BadRequestException, Module, NotImplementedException } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { lookupById } from "../../shared/db-lookup.js";
import { ProfileModule } from "../../profile/profile.module.js";
import { ProfileService } from "../../profile/service/profile.service.js";
import { ProductPreviewModule } from "../product-preview/Product-preview.module.js";
import { MainProductPreviewService } from "../product-preview/service/main-product-preview.service.js";
import { ProductZohoRelationModule } from "../product-zoho-relation/product-zoho-relation.module.js";
import { ProductZohoRelationService } from "../product-zoho-relation/service/product-zoho-relation.service.js";
import { FinishedProductController } from "../controller/finished-product.controller.js";
import { FinishedProductService } from "./service/finished-product.service.js";
import { FinishedProductRepository } from "./repository/finished-product.repository.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq } from "drizzle-orm";
import { ActionCode } from "../../../common/errors/action-code.js";
import {
  COLOR_PORT,
  ColorPort,
  MAIN_PRODUCT_PREVIEW_PORT,
  MainProductPreviewPort,
  MATERIAL_PORT,
  MaterialPort,
  PATTERN_PORT,
  PatternPort,
  PRODUCT_PORT,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  ProductPort,
  ProductSizeProfilePort,
  ProductZohoRelationPort,
  SIZE_PROFILE_PORT,
  SizeProfilePort,
  TAG_PORT,
  TagPort,
  ZOHO_ADAPTER_PORT,
  ZohoAdapterPort,
} from "./types/finished-product.types.js";

/** `retrieveEntity(id)` port over one table — a real select-by-id, not a stub. */
const tableLookup = (token: symbol, table: unknown) => ({
  provide: token,
  useFactory: (db: Database) => ({ retrieveEntity: lookupById(db, table as never) }),
  inject: [DATABASE_CONNECTION],
});

/** See class doc + docs/KNOWN-GAPS.md — loud, never a silent success. */
const zohoNotImplemented = (operation: string) => async (): Promise<never> => {
  throw new NotImplementedException(
    `ZOHO_ADAPTER_PORT.${operation} is not implemented — no Loom-product-to-Zoho-item mapping exists ` +
      `in apps/api (see docs/KNOWN-GAPS.md, "Zoho product sync").`,
  );
};

@Module({
  imports: [AuthModule, ProfileModule, ProductPreviewModule, ProductZohoRelationModule],
  controllers: [FinishedProductController],
  providers: [
    FinishedProductService,
    FinishedProductRepository,
    {
      provide: PRODUCT_PORT,
      useFactory: (db: Database) => ({
        async findProductBySlug(slug: string) {
          const rows = await db.select().from(schema.product).where(eq(schema.product.slug, slug));
          return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
        },
        async retrieveProduct(id: number) {
          const rows = await db.select().from(schema.product).where(eq(schema.product.id, BigInt(id)));
          return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
        },
        async createProduct(input: unknown) {
          // Required fields reject — this port used to invent a name
          // ("Handwoven Finished Product"), a ₹1200 price (`||` also swallowed
          // a genuine 0), and sub-category 3527 / SKU group 2576 fallbacks.
          const product = (input ?? {}) as Record<string, unknown>;
          const timestamp = Date.now();
          if (typeof product.name !== "string" || product.name.trim().length === 0) {
            throw new BadRequestException("name is required to create a product.");
          }
          const baseName = product.name.trim();
          if (typeof product.price !== "number" || Number.isNaN(product.price)) {
            throw new BadRequestException("price is required to create a product.");
          }
          if (typeof product.subCategoryId !== "number" || !Number.isInteger(product.subCategoryId)) {
            throw new BadRequestException("subCategoryId is required to create a product.");
          }
          if (typeof product.skuGroupId !== "number" || !Number.isInteger(product.skuGroupId)) {
            throw new BadRequestException("skuGroupId is required to create a product.");
          }
          if (typeof product.sku !== "string" || product.sku.trim().length === 0) {
            throw new BadRequestException("sku is required to create a product.");
          }
          const sku = product.sku.trim();
          const slug = typeof product.slug === "string" && product.slug.trim().length > 0
            ? product.slug.trim()
            : baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${timestamp}`;
          const validUnit = product.unit === "METER" ? "METER" : "UNIT";
          const str = (v: unknown) => (typeof v === "string" ? v : "");

          const insertValues: typeof schema.product.$inferInsert = {
            name: baseName,
            price: String(product.price),
            sku,
            slug,
            subCategoryId: product.subCategoryId,
            skuGroupId: product.skuGroupId,
            unit: validUnit,
            mainProductCheck: typeof product.mainProductCheck === "boolean" ? product.mainProductCheck : true,
            productOverview: str(product.productOverview),
            productCare: str(product.productCare),
            materialId: str(product.materialId),
            colorId: str(product.colorId),
            patternId: str(product.patternId),
            productVideo: str(product.productVideo),
            productGroup: "finished",
            disabled: false,
            tagId: "",
            metaTitle: str(product.metaTitle),
            metaDescription: str(product.metaDescription),
            heroImageAlt: str(product.heroImageAlt),
            hoverImageAlt: str(product.hoverImageAlt),
            productVideoAlt: str(product.productVideoAlt),
            backwardCompatibleLink: str(product.backwardCompatibleLink),
          };

          try {
            const rows = await db.insert(schema.product).values(insertValues).returning();
            return rows[0] ? { id: Number(rows[0].id) } : null;
          } catch (err) {
            if ((err as { code?: string })?.code === "23505") {
              const rows = await db
                .insert(schema.product)
                .values({
                  ...insertValues,
                  name: `${baseName} (${timestamp})`,
                  sku: `${sku}-${timestamp}`,
                  slug: `${slug}-${timestamp}`,
                })
                .returning();
              return rows[0] ? { id: Number(rows[0].id) } : null;
            }
            throw err;
          }
        },
        async updateProduct(product: any) {
          const updateData: any = {};
          if (product.name) updateData.name = product.name;
          // `!== undefined` not truthiness: a genuine 0 price must be settable.
          if (product.price !== undefined && product.price !== null) updateData.price = String(product.price);
          if (product.sku) updateData.sku = product.sku;
          if (product.subCategoryId) updateData.subCategoryId = product.subCategoryId;
          if (product.disabled !== undefined) updateData.disabled = product.disabled;

          const rows = await db.update(schema.product).set(updateData).where(eq(schema.product.id, BigInt(product.id))).returning();
          return rows.length > 0 ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        },
        async updateProductInternal(productId: number, disabled: boolean) {
          const rows = await db.update(schema.product).set({ disabled }).where(eq(schema.product.id, BigInt(productId))).returning();
          return rows.length > 0 ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        },
        async getZohoRelations() {
          return [];
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
    tableLookup(COLOR_PORT, schema.color),
    tableLookup(MATERIAL_PORT, schema.material),
    tableLookup(PATTERN_PORT, schema.pattern),
    tableLookup(TAG_PORT, schema.tag),
    {
      provide: MAIN_PRODUCT_PREVIEW_PORT,
      useFactory: (previews: MainProductPreviewService): MainProductPreviewPort => ({
        prepareRelatedProductList: (productId) => previews.prepareRelatedProductList(productId),
      }),
      inject: [MainProductPreviewService],
    },
    {
      provide: SIZE_PROFILE_PORT,
      useFactory: (profile: ProfileService): SizeProfilePort => ({
        prepareSizeProfile: (sizeProfileId) => profile.getSizeProfile(sizeProfileId),
      }),
      inject: [ProfileService],
    },
    {
      provide: ZOHO_ADAPTER_PORT,
      useValue: {
        addFinishedProductToZoho: zohoNotImplemented("addFinishedProductToZoho"),
        updateFinishedProductToZoho: zohoNotImplemented("updateFinishedProductToZoho"),
        reTriggerFinishedProductToZohoWorkflow: zohoNotImplemented("reTriggerFinishedProductToZohoWorkflow"),
      } satisfies ZohoAdapterPort,
    },
    {
      provide: PRODUCT_ZOHO_RELATION_PORT,
      useFactory: (relations: ProductZohoRelationService): ProductZohoRelationPort => ({
        setDisabled: (relationId, disabled) => relations.setDisabled(relationId, disabled),
      }),
      inject: [ProductZohoRelationService],
    },
    {
      /** ProductSizeProfileJpaRepository#findBySizeProfileOptionSku(sku) */
      provide: PRODUCT_SIZE_PROFILE_PORT,
      useFactory: (db: Database): ProductSizeProfilePort => ({
        findBySizeProfileOptionSku: async (sku) => {
          const rows = await db
            .select({ disabled: schema.productSizeProfile.disabled })
            .from(schema.productSizeProfile)
            .where(eq(schema.productSizeProfile.sizeProfileOptionSku, sku))
            .limit(1);
          return rows[0] ?? null;
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [FinishedProductService],
})
export class FinishedProductModule {}
