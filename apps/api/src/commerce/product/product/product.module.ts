/**
 * apps/api/src/product/core/Product.module.ts
 *
 * Wires the Product Core feature together. No controller is registered
 * here yet — per the brief, ProductController/ProductDAOController's HTTP
 * surface waits on RequestMapper.java, which wasn't provided. ProductService
 * is exported so a future Product.controller.ts (and Cart, which already
 * has commented-out product lookups per its own module doc) can consume
 * it once wired up.
 *
 * Twelve ports are bound to safe dummy implementations rather than left
 * unbound or throwing, exactly like commerce/cart/cart.module.ts and
 * auth/auth.module.ts do for their own out-of-scope dependencies:
 *  - SubCategoryPort / SkuGroupPort / SpecialStatusPort: these domains ARE
 *    marked complete in MIGRATION_CHECKPOINT.md, but their TypeScript
 *    output wasn't included in the files provided for this task (see
 *    Product.types.ts header note) — swap in the real providers here as
 *    soon as those modules' exports are available to import.
 *  - BadgeProfilePort / VolumeDiscountProfilePort / MadeToOrderProfilePort /
 *    MadeToOrderProductPreviewPort / CustomSizeProfilePort / SizeProfilePort /
 *    FinishProfilePort / FabricProfilePort / ProductSizeProfilePort /
 *    ProductZohoRelationPort / ImageGallerySeoPort: genuinely out of scope
 *    per MIGRATION_CHECKPOINT.md's remaining-domains list — wire real
 *    providers in as each one gets migrated.
 *
 * Every dummy returns the "nothing found" / no-op value its own interface
 * contract allows (`null` for every nullable lookup, a resolved void
 * Promise for side-effecting calls) instead of fabricating another
 * module's behavior — same reasoning as cart.module.ts's dummy block.
 *
 * DatabaseModule is @Global(), so ProductRepository injects
 * DATABASE_CONNECTION directly without this module re-importing it.
 */
import { Module } from "@nestjs/common";
import { ProductService } from "./service/product.service.js";
import { ProductRepository } from "./repository/product.repository.js";
import {
  BADGE_PROFILE_PORT,
  BadgeProfilePort,
  CUSTOM_SIZE_PROFILE_PORT,
  CustomSizeProfilePort,
  FABRIC_PROFILE_PORT,
  FabricProfilePort,
  FINISH_PROFILE_PORT,
  FinishProfilePort,
  IMAGE_GALLERY_SEO_PORT,
  ImageGallerySeoPort,
  MADE_TO_ORDER_PRODUCT_PREVIEW_PORT,
  MADE_TO_ORDER_PROFILE_PORT,
  MadeToOrderProductPreviewPort,
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
  VolumeDiscountProfilePort,
} from "./types/product.types.js";

const subCategoryDummy: SubCategoryPort = {
  retrieveSubCategoryWithRelatedEntities: async () => null,
};

const skuGroupDummy: SkuGroupPort = {
  retrieveEntity: async () => null,
};

const specialStatusDummy: SpecialStatusPort = {
  retrieveEntity: async () => null,
};

const badgeProfileDummy: BadgeProfilePort = {
  retrieveBadgeProfile: async () => null,
};

const volumeDiscountProfileDummy: VolumeDiscountProfilePort = {
  retrieveVolumeDiscountProfile: async () => null,
};

const madeToOrderProfileDummy: MadeToOrderProfilePort = {
  retrieveMadeToOrderProfile: async () => null,
};

const madeToOrderProductPreviewDummy: MadeToOrderProductPreviewPort = {
  retrieveMadeToOrderProfilePreview: async () => null,
};

const customSizeProfileDummy: CustomSizeProfilePort = {
  retrieveCustomSizeProfile: async () => null,
};

const sizeProfileDummy: SizeProfilePort = {
  retrieveSizeProfile: async () => null,
};

const finishProfileDummy: FinishProfilePort = {
  retrieveFinishProfile: async () => null,
};

const fabricProfileDummy: FabricProfilePort = {
  retrieveFabricProfile: async () => null,
};

const productSizeProfileDummy: ProductSizeProfilePort = {
  deleteProductSizeProfileItems: async () => undefined,
};

const productZohoRelationDummy: ProductZohoRelationPort = {
  findByProductAndSku: async () => null,
  setDisabled: async () => undefined,
};

const imageGallerySeoDummy: ImageGallerySeoPort = {
  replaceForProduct: async () => undefined,
};

@Module({
  providers: [
    ProductService,
    ProductRepository,
    { provide: SUB_CATEGORY_PORT, useValue: subCategoryDummy },
    { provide: SKU_GROUP_PORT, useValue: skuGroupDummy },
    { provide: SPECIAL_STATUS_PORT, useValue: specialStatusDummy },
    { provide: BADGE_PROFILE_PORT, useValue: badgeProfileDummy },
    { provide: VOLUME_DISCOUNT_PROFILE_PORT, useValue: volumeDiscountProfileDummy },
    { provide: MADE_TO_ORDER_PROFILE_PORT, useValue: madeToOrderProfileDummy },
    { provide: MADE_TO_ORDER_PRODUCT_PREVIEW_PORT, useValue: madeToOrderProductPreviewDummy },
    { provide: CUSTOM_SIZE_PROFILE_PORT, useValue: customSizeProfileDummy },
    { provide: SIZE_PROFILE_PORT, useValue: sizeProfileDummy },
    { provide: FINISH_PROFILE_PORT, useValue: finishProfileDummy },
    { provide: FABRIC_PROFILE_PORT, useValue: fabricProfileDummy },
    { provide: PRODUCT_SIZE_PROFILE_PORT, useValue: productSizeProfileDummy },
    { provide: PRODUCT_ZOHO_RELATION_PORT, useValue: productZohoRelationDummy },
    { provide: IMAGE_GALLERY_SEO_PORT, useValue: imageGallerySeoDummy },
  ],
  exports: [ProductService, ProductRepository],
})
export class ProductCoreModule {}
