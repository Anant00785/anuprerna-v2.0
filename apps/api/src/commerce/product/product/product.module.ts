// @ts-nocheck
/**
 * apps/api/src/product/core/Product.module.ts
 *
 * Wires the Product Core feature together with LOOM ProductController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ProductController } from "../controller/product.controller.js";
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
  imports: [AuthModule],
  controllers: [ProductController],
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
