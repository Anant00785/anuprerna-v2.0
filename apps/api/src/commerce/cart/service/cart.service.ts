// @ts-nocheck
/**
 * apps/api/src/commerce/cart/service/cart.service.ts
 *
 * Direct port of com.bloomscorp.loom.cart.dao.controller.CartItemDAOController.
 * Every public method here corresponds 1:1 to a source method with the same
 * name/intent. Business logic (enrichment rules, the abandoned-cart 1-day
 * cutoff, the update method's deliberately narrow field set, etc.) is
 * preserved exactly, including two quirks called out below rather than
 * silently "fixed":
 *
 *  1. updateCartItem in source only ever writes `quantity` and
 *     `lastUpdatedAt` — every other field is commented out with
 *     "TODO: need to make the logic more secure". Preserved as-is.
 *  2. prepareCartItems resolves `finishDisplayName` inside a *parallel*
 *     stream over selectedFinishId's comma-separated ids, so in source the
 *     final value is whichever id's lookup finishes last — effectively
 *     non-deterministic when more than one finish is selected. This port
 *     resolves finishes sequentially for determinism but preserves the
 *     "last one wins" assignment semantics; flagged as a source bug rather
 *     than silently changed.
 */
import { Inject, Injectable } from "@nestjs/common";
import { CartRepository, OptimisticLockError } from "../repository/cart.repository.js";
import { toInsertValues, toUpdateValues } from "../mapper/cart.mapper.js";
import { AddCartItemRequest, UpdateCartItemRequest } from "../dto/cart.dto.js";
import { ActionCode } from "../../../common/errors/action-code";
import { cartItem } from "../../../database/schema/schema.js";
import {
  CartItemData,
  CartItemView,
  EMAIL_ENCODER_PORT,
  EmailEncoderPort,
  FABRIC_PREVIEW_PORT,
  FabricPreviewPort,
  FINISHED_PREVIEW_PORT,
  FINISH_PROFILE_ITEM_PORT,
  FinishProfileItemPort,
  FinishedPreviewPort,
  SIZE_PROFILE_OPTION_PORT,
  SizeProfileOptionPort,
  TENANT_LOOKUP_PORT,
  TenantCartOverview,
  TenantLookupPort,
} from "../types/cart.types.js";

const ABANDONED_CART_CUTOFF_MS = 24 * 60 * 60 * 1000; // Duration.ofDays(1), verbatim from source

@Injectable()
export class CartService {
  constructor(
    private readonly repo: CartRepository,
    @Inject(FABRIC_PREVIEW_PORT) private readonly fabricPreview: FabricPreviewPort,
    @Inject(FINISHED_PREVIEW_PORT) private readonly finishedPreview: FinishedPreviewPort,
    @Inject(SIZE_PROFILE_OPTION_PORT) private readonly sizeProfileOption: SizeProfileOptionPort,
    @Inject(FINISH_PROFILE_ITEM_PORT) private readonly finishProfileItem: FinishProfileItemPort,
    @Inject(TENANT_LOOKUP_PORT) private readonly tenantLookup: TenantLookupPort,
    @Inject(EMAIL_ENCODER_PORT) private readonly emailEncoder: EmailEncoderPort,
  ) {}

  /**
   * prepareCartItems(List<CartItem> items) — enrichment pass applied before
   * returning cart items to clients. Source mutates managed entities in
   * place; here we build fresh view objects instead since Drizzle rows are
   * plain data, not managed entities.
   */
  async prepareCartItems(items: (typeof cartItem.$inferSelect)[]): Promise<CartItemView[]> {
    const views: CartItemView[] = [];

    for (const row of items) {
      const view: CartItemView = {
        id: Number(row.id),
        version: Number(row.version),
        fabricProductPreview: null,
        finishedProductPreview: null,
        selectedFabric: null,
        selectedSizeOption: null,
        sizeDisplayName: null,
        selectedFinishId: row.selectedFinishId ?? "",
        selectedFinishList: [],
        finishDisplayName: null,
        customSize: row.customSize,
        productGroup: row.productGroup,
        orderType: row.orderType,
        quantity: Number(row.quantity),
        unit: row.unit,
        makingCharge: Number(row.makingCharge),
        lastUpdatedAt: Number(row.lastUpdatedAt),
        clickId: row.clickId,
        clickIdType: row.clickIdType,
        clickCapturedAt: row.clickCapturedAt,
        utmSource: row.utmSource,
        utmMedium: row.utmMedium,
        utmCampaign: row.utmCampaign,
      };

      if (row.fabricProductId) {
        view.fabricProductPreview = await this.fabricPreview.retrieveEntity(row.fabricProductId);
      }
      if (row.finishedProductId) {
        view.finishedProductPreview = await this.finishedPreview.retrieveEntity(row.finishedProductId);
      }
      if (row.selectedFabricId) {
        view.selectedFabric = await this.fabricPreview.retrieveFabricProductByProductId(row.selectedFabricId);
      }
      if (row.selectedSizeOptionId) {
        view.selectedSizeOption = await this.sizeProfileOption.retrieveSizeProfileOption(row.selectedSizeOptionId);
      }

      if (view.selectedFinishId === "") {
        view.selectedFinishList = [];
      } else {
        const finishIds = view.selectedFinishId.split(",");
        const resolved: unknown[] = [];
        for (const finishIdStr of finishIds) {
          const item = await this.finishProfileItem.retrieveEntity(Number(finishIdStr));
          if (item) {
            view.finishDisplayName = item.finishProfile.displayName; // last-one-wins, see class doc
            resolved.push(item);
          }
        }
        view.selectedFinishList = resolved;
      }

      views.push(view);
    }

    return views;
  }

  /** retrieveCartItems(LoomTenant tenant) */
  async retrieveCartItems(tenantId: number): Promise<CartItemView[]> {
    const items = await this.repo.findByTenantId(tenantId);
    return this.prepareCartItems(items);
  }

  /** retrieveRawCartItems(LoomTenant tenant) — unhydrated, for order-creation attribution reads */
  retrieveRawCartItems(tenantId: number) {
    return this.repo.findByTenantId(tenantId);
  }

  /** retrieveAdAttributedCartItems(long from, long to) */
  retrieveAdAttributedCartItems(from: number, to: number) {
    return this.repo.findByClickIdNotNullAndCapturedBetween(from, to);
  }

  /** retrieveCartItemsByUid(String uid) */
  async retrieveCartItemsByUid(uid: string): Promise<CartItemView[]> {
    const tenant = await this.tenantLookup.retrieveUserByUid(uid);
    if (!tenant) return [];
    const items = await this.repo.findByTenantId(tenant.id);
    return this.prepareCartItems(items);
  }

  /** retrieveTenantWiseCartOverview() */
  async retrieveTenantWiseCartOverview(): Promise<TenantCartOverview[]> {
    const tenantIds = await this.repo.findDistinctTenantIds();
    const cutoffTime = Date.now() - ABANDONED_CART_CUTOFF_MS;
    const summaries = await this.repo.getTenantCartItemsSummary(tenantIds, cutoffTime);

    const overviews: TenantCartOverview[] = [];
    for (const row of summaries) {
      const estimatedTotalPrice = (await this.repo.getTotalCartValueForTenant(Number(row.tenantId))) ?? 0;
      const tenant = await this.tenantLookup.retrieveUserByUid(row.tenantId.toString());

      let decryptedEmail: string | null = null;
      try {
        if (tenant) decryptedEmail = await this.emailEncoder.decode(tenant.email);
      } catch {
        // source: swallowed so one undecryptable email doesn't abort the whole overview
      }

      overviews.push({
        tenant: tenant ? { ...tenant, decryptedEmail } : null,
        cartItemCount: Number(row.itemCount),
        hasAbandonedItem: row.hasAbandonedItem,
        lastUpdatedAt: Number(row.lastUpdatedAt),
        estimatedTotalPrice,
      });
    }
    return overviews;
  }

  /** addCartItem(LoomTenant tenant, CartItem cartItem) */
  async addCartItem(tenantId: number, input: AddCartItemRequest): Promise<number> {
    const values = toInsertValues(tenantId, input);

    if (input.fabricProductId && input.fabricProductId !== 0) {
      values.fabricProductId = input.fabricProductId;
    }

    if (input.finishedProductId && input.finishedProductId !== 0) {
      values.finishedProductId = input.finishedProductId;
    }

    if (input.selectedFabricId && input.selectedFabricId !== 0) {
      values.selectedFabricId = input.selectedFabricId;
    }

    if (input.selectedSizeOptionId && input.selectedSizeOptionId !== 0) {
      values.selectedSizeOptionId = input.selectedSizeOptionId;
    }

    try {
      await this.repo.insert(values);
      return ActionCode.INSERT_SUCCESS;
    } catch (err) {
      console.error("[CartService] Insert error:", err);
      return ActionCode.INSERT_FAILURE;
    }
  }

  /**
   * updateCartItem(CartItem updatedItem) — source only ever writes quantity
   * and lastUpdatedAt; every other field is intentionally left untouched
   * (see class doc, quirk #1). The existence check and the version-checked
   * write both happen inside repo.update's transaction now (source: single
   * findCartItemById + save() call, same atomicity) — no separate
   * pre-check here, to avoid a check-then-act race the transaction already
   * closes. OptimisticLockError is intentionally not caught here; it
   * propagates to the controller, mirroring an uncaught
   * OptimisticLockException in the Java source.
   */
  async updateCartItem(input: UpdateCartItemRequest): Promise<number> {
    try {
      const updated = await this.repo.update(BigInt(input.id), toUpdateValues(input.quantity));
      return updated ? ActionCode.UPDATE_SUCCESS : ActionCode.NO_ACTION;
    } catch (err) {
      if (err instanceof OptimisticLockError) throw err;
      return ActionCode.UPDATE_FAILURE;
    }
  }

  /** deleteCartItem(Long id) */
  async deleteCartItem(id: bigint): Promise<boolean> {
    const count = await this.repo.deleteById(id);
    return count === 1;
  }

  /** deleteAllCartItem(LoomTenant tenant) */
  async deleteAllCartItem(tenantId: number): Promise<boolean> {
    await this.repo.deleteAllByTenantId(tenantId);
    return true;
  }

  /** getCartItemsBySizeOption(SizeProfileOption option) — internal, not exposed via Cart routes */
  getCartItemsBySizeOption(sizeOptionId: number) {
    return this.repo.findBySelectedSizeOptionId(sizeOptionId);
  }

  /** deleteCartItemBySizeOption(SizeProfileOption option) — internal, not exposed via Cart routes */
  async deleteCartItemBySizeOption(sizeOptionId: number): Promise<boolean> {
    await this.repo.deleteBySelectedSizeOptionId(sizeOptionId);
    return true;
  }

  /** deleteCartItemByFinishId(Long finishId) — internal, not exposed via Cart routes */
  async deleteCartItemByFinishId(finishId: bigint): Promise<boolean> {
    await this.repo.deleteByFinishId(finishId.toString());
    return true;
  }

  /** retrieveCartItemData(int page, int size) */
  retrieveCartItemData(page: number, size: number): Promise<CartItemData[]> {
    return this.repo.retrieveCartItemData(size, page * size);
  }

  /** retrieveCartItemById(Long id) */
  retrieveCartItemById(id: bigint) {
    return this.repo.retrieveEntity(id);
  }

  /** retrieveCartItemDataById(Long id) */
  retrieveCartItemDataById(id: bigint): Promise<CartItemData | null> {
    return this.repo.retrieveCartItemDataById(id);
  }
}
// @ts-nocheck
