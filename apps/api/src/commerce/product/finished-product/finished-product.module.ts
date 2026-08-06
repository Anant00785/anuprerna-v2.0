/**
 * apps/api/src/product/finished-product/finished-product.module.ts
 *
 * Wires the FinishedProduct feature together. No controller is registered
 * in this pass (none was requested, and RequestMapper.java — which supplies
 * FinishedProductController's route path constants — was not part of this
 * migration step either).
 *
 * ProductPort / ColorPort / MaterialPort / PatternPort / TagPort /
 * MainProductPreviewPort / SizeProfilePort / ZohoAdapterPort /
 * ProductZohoRelationPort / ProductSizeProfilePort are cross-module
 * dependencies — see types/finished-product.types.ts for why each is a
 * port rather than a direct import (Product's generated TS wasn't shared
 * into this conversation; the rest are modules not yet migrated).
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here — same as Cart.
 *
 * Every port below is bound to a safe dummy implementation rather than left
 * unbound or throwing, exactly like cart.module.ts: each dummy returns the
 * "nothing found" value its own interface contract allows. This keeps the
 * module bootable end to end; a call that legitimately needs a real
 * Product/Zoho/etc. integration degrades to the same "not found"/no-op
 * outcome the code already handles, rather than a 500.
 *
 * Replace each `useValue` below with a real provider as Product, Color,
 * Material, Pattern, Tag, MainProductPreview, SizeProfile, the Zoho
 * adapter, ProductZohoRelation, and ProductSizeProfile get migrated (or, for
 * ProductPort, as soon as the already-migrated Product module's real
 * service/repository types can be shared into this conversation).
 */
import { Module } from "@nestjs/common";
import { FinishedProductService } from "./service/finished-product.service.js";
import { FinishedProductRepository } from "./repository/finished-product.repository.js";
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

const productDummy: ProductPort = {
  createProduct: async () => null,
  updateProduct: async () => -5, // ActionCode.UPDATE_FAILURE
  updateProductInternal: async () => -5,
  findProductBySlug: async () => null,
  retrieveProduct: async () => null,
  getZohoRelations: async () => [],
};

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
  providers: [
    FinishedProductService,
    FinishedProductRepository,
    { provide: PRODUCT_PORT, useValue: productDummy },
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
