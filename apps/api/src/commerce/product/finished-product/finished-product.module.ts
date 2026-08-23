// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
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

const colorDummy: ColorPort = { retrieveEntity: async () => null };
const materialDummy: MaterialPort = { retrieveEntity: async () => null };
const patternDummy: PatternPort = { retrieveEntity: async () => null };
const tagDummy: TagPort = { retrieveEntity: async () => null };

const mainProductPreviewDummy: MainProductPreviewPort = {
  prepareRelatedProductList: async () => [],
};

const sizeProfileDummy: SizeProfilePort = {
  prepareSizeProfile: async () => null,
};

const zohoAdapterDummy: ZohoAdapterPort = {
  addFinishedProductToZoho: async () => {},
  updateFinishedProductToZoho: async () => {},
  reTriggerFinishedProductToZohoWorkflow: async () => {},
};

const productZohoRelationDummy: ProductZohoRelationPort = {
  setDisabled: async () => {},
};

const productSizeProfileDummy: ProductSizeProfilePort = {
  findBySizeProfileOptionSku: async () => null,
};

@Module({
  imports: [AuthModule],
  controllers: [FinishedProductController],
  providers: [
    FinishedProductService,
    FinishedProductRepository,
    {
      provide: PRODUCT_PORT,
      useFactory: (db: Database) => ({
        async findProductBySlug(slug: string) {
          const rows = await db.select().from(schema.product).where(eq(schema.product.slug, slug));
          return rows[0] ? { id: Number(rows[0].id), ...rows[0] } : null;
        },
        async retrieveProduct(id: number) {
          const rows = await db.select().from(schema.product).where(eq(schema.product.id, id));
          return rows[0] ? { id: Number(rows[0].id), ...rows[0] } : null;
        },
        async createProduct(product: any) {
          const timestamp = Date.now();
          const baseName = product.name || "Handwoven Finished Product";
          const sku = product.sku || `FINISHED-${timestamp}`;
          const slug = product.slug || baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${timestamp}`;
          const validUnit = product.unit === "METER" ? "METER" : "UNIT";

          const insertValues = {
            name: baseName,
            price: String(product.price || 1200),
            sku,
            slug,
            subCategoryId: product.subCategoryId || 3527,
            skuGroupId: product.skuGroupId || 2576,
            unit: validUnit,
            mainProductCheck: product.mainProductCheck ?? true,
            productOverview: product.productOverview || "",
            productCare: product.productCare || "",
            materialId: product.materialId || "",
            colorId: product.colorId || "",
            patternId: product.patternId || "",
            productVideo: product.productVideo || "",
            productGroup: "finished",
            disabled: false,
            tagId: "",
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
            heroImageAlt: product.heroImageAlt || "",
            hoverImageAlt: product.hoverImageAlt || "",
            productVideoAlt: product.productVideoAlt || "",
            backwardCompatibleLink: product.backwardCompatibleLink || "",
          };

          try {
            const rows = await db.insert(schema.product).values(insertValues).returning();
            return rows[0] ? { id: Number(rows[0].id) } : null;
          } catch (err: any) {
            if (err?.code === "23505") {
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
          if (product.price) updateData.price = String(product.price);
          if (product.sku) updateData.sku = product.sku;
          if (product.subCategoryId) updateData.subCategoryId = product.subCategoryId;
          if (product.disabled !== undefined) updateData.disabled = product.disabled;

          const rows = await db.update(schema.product).set(updateData).where(eq(schema.product.id, product.id)).returning();
          return rows.length > 0 ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        },
        async updateProductInternal(productId: number, disabled: boolean) {
          const rows = await db.update(schema.product).set({ disabled }).where(eq(schema.product.id, productId)).returning();
          return rows.length > 0 ? ActionCode.UPDATE_SUCCESS : ActionCode.UPDATE_FAILURE;
        },
        async getZohoRelations() {
          return [];
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
    { provide: COLOR_PORT, useValue: colorDummy },
    { provide: MATERIAL_PORT, useValue: materialDummy },
    { provide: PATTERN_PORT, useValue: patternDummy },
    { provide: TAG_PORT, useValue: tagDummy },
    { provide: MAIN_PRODUCT_PREVIEW_PORT, useValue: mainProductPreviewDummy },
    { provide: SIZE_PROFILE_PORT, useValue: sizeProfileDummy },
    { provide: ZOHO_ADAPTER_PORT, useValue: zohoAdapterDummy },
    { provide: PRODUCT_ZOHO_RELATION_PORT, useValue: productZohoRelationDummy },
    { provide: PRODUCT_SIZE_PROFILE_PORT, useValue: productSizeProfileDummy },
  ],
  exports: [FinishedProductService],
})
export class FinishedProductModule {}
