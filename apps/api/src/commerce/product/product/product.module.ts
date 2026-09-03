/**
 * apps/api/src/commerce/product/product/product.module.ts
 *
 * Wires the Product Core feature together with LOOM ProductController.
 *
 * Every cross-module port below is bound to a REAL provider — the module
 * previously registered fourteen `async () => null` dummies, which made
 * product create/update silently skip the size-profile purge, the
 * ProductZohoRelation disable sync and the image-gallery-SEO persist while
 * still answering 200. Two binding styles are used:
 *
 *  - `useFactory` over another module's exported service, where that
 *    domain has one (SubCategory, SkuGroup, SpecialStatus, Profile,
 *    ProductSizeProfile, ProductZohoRelation). The factory only adapts the
 *    call shape (bigint ids, `{ id }` narrowing); it never invents data.
 *  - `lookupById` over the real table (commerce/shared/db-lookup.ts), for
 *    the profile domains that have no Nest service yet. A
 *    `retrieveEntity(id)` port IS a select-by-id — answering it from the
 *    real table is less code than faking it, and the port contract stays
 *    identical when a service later lands.
 *
 * MADE_TO_ORDER_PRODUCT_PREVIEW_PORT reads the `product` table: source's
 * MadeToOrderProductPreview is `@Table(name = ProductContract.TABLE)` —
 * a second entity mapped over `product`, not a table of its own.
 */
import { Module } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AuthModule } from "../../../auth/auth.module.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { lookupIdById } from "../../shared/db-lookup.js";
import { ProfileModule } from "../../profile/profile.module.js";
import { ProfileService } from "../../profile/service/profile.service.js";
import { ProductZohoRelationModule } from "../product-zoho-relation/product-zoho-relation.module.js";
import { ProductZohoRelationService } from "../product-zoho-relation/service/product-zoho-relation.service.js";
import { ProductSizeProfileModule } from "../product-size-profile/product-size-profile.module.js";
import { ProductSizeProfileService } from "../product-size-profile/service/product-size-profile.service.js";
import { SkuGroupModule } from "../sku-group/sku-group.module.js";
import { SkuGroupService } from "../sku-group/service/sku-group.service.js";
import { SpecialStatusModule } from "../special-status/special-status.module.js";
import { SpecialStatusService } from "../special-status/service/special-status.service.js";
import { SubCategoryModule } from "../sub-category/subcategory.module.js";
import { SubCategoryService } from "../sub-category/service/subCategory.service.js";
import { ProductController } from "../controller/product.controller.js";
import { ProductService } from "./service/product.service.js";
import { ProductRepository } from "./repository/product.repository.js";
import {
  BADGE_PROFILE_PORT,
  BadgeProfilePort,
  CUSTOM_SIZE_PROFILE_PORT,
  FABRIC_PROFILE_PORT,
  FINISH_PROFILE_PORT,
  IMAGE_GALLERY_SEO_PORT,
  ImageGallerySeoPort,
  MADE_TO_ORDER_PRODUCT_PREVIEW_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  MadeToOrderProfilePort,
  PRODUCT_SIZE_PROFILE_PORT,
  PRODUCT_ZOHO_RELATION_PORT,
  ProductSizeProfilePort,
  ProductZohoRelationPort,
  SIZE_PROFILE_PORT,
  SKU_GROUP_PORT,
  SPECIAL_STATUS_PORT,
  SUB_CATEGORY_PORT,
  SizeProfilePort,
  SkuGroupPort,
  SpecialStatusPort,
  SubCategoryPort,
  VOLUME_DISCOUNT_PROFILE_PORT,
} from "./types/product.types.js";

/** `{ id }`-narrowing wrapper shared by the service-backed lookups. */
const asIdOrNull = (row: unknown): { id: number } | null =>
  row ? { id: Number((row as { id: number | bigint }).id) } : null;

/** A `useFactory` provider over one table, for the domains with no service yet. */
const tableLookup = (token: symbol, table: unknown, method: string) => ({
  provide: token,
  useFactory: (db: Database) => ({ [method]: lookupIdById(db, table as never) }),
  inject: [DATABASE_CONNECTION],
});

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    ProductSizeProfileModule,
    ProductZohoRelationModule,
    SkuGroupModule,
    SpecialStatusModule,
    SubCategoryModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,

    {
      provide: SUB_CATEGORY_PORT,
      useFactory: (subCategory: SubCategoryService): SubCategoryPort => ({
        retrieveSubCategoryWithRelatedEntities: async (id) =>
          asIdOrNull(await subCategory.retrieveSubCategoryWithRelatedEntities(BigInt(id))),
      }),
      inject: [SubCategoryService],
    },
    {
      provide: SKU_GROUP_PORT,
      useFactory: (skuGroup: SkuGroupService): SkuGroupPort => ({
        retrieveEntity: async (id) => asIdOrNull(await skuGroup.retrieveSkuGroupById(BigInt(id))),
      }),
      inject: [SkuGroupService],
    },
    {
      provide: SPECIAL_STATUS_PORT,
      useFactory: (specialStatus: SpecialStatusService): SpecialStatusPort => ({
        retrieveEntity: async (id) => asIdOrNull(await specialStatus.retrieveSpecialStatusById(BigInt(id))),
      }),
      inject: [SpecialStatusService],
    },
    {
      provide: BADGE_PROFILE_PORT,
      useFactory: (profile: ProfileService): BadgeProfilePort => ({
        retrieveBadgeProfile: async (id) => asIdOrNull(await profile.getBadgeProfile(id)),
      }),
      inject: [ProfileService],
    },
    {
      provide: MADE_TO_ORDER_PROFILE_PORT,
      useFactory: (profile: ProfileService): MadeToOrderProfilePort => ({
        retrieveMadeToOrderProfile: async (id) => asIdOrNull(await profile.getMadeToOrderProfile(id)),
      }),
      inject: [ProfileService],
    },
    {
      provide: SIZE_PROFILE_PORT,
      useFactory: (profile: ProfileService): SizeProfilePort => ({
        retrieveSizeProfile: async (id) => asIdOrNull(await profile.getSizeProfile(id)),
      }),
      inject: [ProfileService],
    },

    // Profile domains with no Nest service yet — real select-by-id, not a dummy.
    tableLookup(VOLUME_DISCOUNT_PROFILE_PORT, schema.volumeDiscountProfile, "retrieveVolumeDiscountProfile"),
    tableLookup(CUSTOM_SIZE_PROFILE_PORT, schema.customSizeProfile, "retrieveCustomSizeProfile"),
    tableLookup(FINISH_PROFILE_PORT, schema.finishProfile, "retrieveFinishProfile"),
    tableLookup(FABRIC_PROFILE_PORT, schema.fabricProfile, "retrieveFabricProfile"),
    tableLookup(MADE_TO_ORDER_PRODUCT_PREVIEW_PORT, schema.product, "retrieveMadeToOrderProfilePreview"),

    {
      provide: PRODUCT_SIZE_PROFILE_PORT,
      useFactory: (sizeProfiles: ProductSizeProfileService): ProductSizeProfilePort => ({
        deleteProductSizeProfileItems: (productId) => sizeProfiles.deleteProductSizeProfileItems(productId),
      }),
      inject: [ProductSizeProfileService],
    },
    {
      provide: PRODUCT_ZOHO_RELATION_PORT,
      useFactory: (relations: ProductZohoRelationService): ProductZohoRelationPort => ({
        findByProductAndSku: async (productId, sku) => asIdOrNull(await relations.findByProductIdAndSku(productId, sku)),
        setDisabled: (relationId, disabled) => relations.setDisabled(relationId, disabled),
      }),
      inject: [ProductZohoRelationService],
    },

    /**
     * ProductDAOController#createProduct's `productImageGallerySEOList`
     * cascade: source clears the collection and re-persists the non-deleted
     * rows. Delete-then-insert here, in one transaction, matching that
     * wholesale-replace semantics. No ProductImageGallerySEO module exists
     * to delegate to and the table has five columns — implementing it is
     * shorter than any indirection would be.
     */
    {
      provide: IMAGE_GALLERY_SEO_PORT,
      useFactory: (db: Database): ImageGallerySeoPort => ({
        replaceForProduct: async (productId, items) => {
          await db.transaction(async (tx) => {
            await tx
              .delete(schema.productImageGallerySeo)
              .where(eq(schema.productImageGallerySeo.productId, productId));
            const rows = (items ?? []).filter((item) => !item.deleted);
            if (rows.length === 0) return;
            await tx
              .insert(schema.productImageGallerySeo)
              .values(rows.map((item) => ({ productId, image: item.image, altText: item.altText })));
          });
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [ProductService, ProductRepository],
})
export class ProductCoreModule {}
