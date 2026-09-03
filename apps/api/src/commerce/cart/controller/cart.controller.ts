/**
 * apps/api/src/commerce/cart/controller/cart.controller.ts
 *
 * Direct port of com.bloomscorp.loom.cart.controller.CartController.
 * Route paths, HTTP methods, and CODE_SU/CODE_CU restrictions are preserved
 * exactly. Response envelopes follow the RainTree protocol (see
 * common/response/rain-response.ts) so existing clients keep working
 * unchanged.
 *
 * Route map (verbatim from com.bloomscorp.loom.support.RequestMapper):
 *   GET    /get/table-explorer/data/cart-item              CODE_SU
 *   GET    /get/table-explorer/data/cart-item/:id           CODE_SU
 *   GET    /get/cart-item/list                              CODE_CU
 *   GET    /get/tenant/cart-item/list/:uid                  CODE_SU
 *   GET    /get/tenant/cart-item/list                       CODE_SU
 *   POST   /add/cart-item                                   CODE_CU
 *   PATCH  /update/cart-item                                CODE_CU
 *   DELETE /delete/cart-item/:cartItemId                    CODE_CU
 *   DELETE /delete/all-cart-item                             CODE_CU
 *
 * Swagger: @ApiTags("Cart") groups this controller. @ApiBearerAuth() is
 * applied at the class level — every route here carries @RequireGate
 * (CODE_SU or CODE_CU), so every route is protected; there is no public
 * Cart endpoint to exclude it from.
 */
import { Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CartService } from "../service/cart.service.js";
import { OptimisticLockError } from "../repository/cart.repository.js";
import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from "../../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { ActionCode } from "../../../common/errors/action-code.js";
import { validateCartItem } from "../validators/cart-item.validator.js";
import { sanitizeCartItem } from "../validators/cart-item.sanitizer.js";
import {
  AddCartItemDto,
  UpdateCartItemDto,
  parseAddCartItemRequest,
  parseCartItemIdParam,
  parseIdParam,
  parseTableExplorerPageQuery,
  parseUidParam,
  parseUpdateCartItemRequest,
} from "../dto/cart.dto.js";
import { CartMessages } from "../types/cart.types.js";

@ApiTags("Cart")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** getCartItemData(request, page, size) */
  @Get("/get/table-explorer/data/cart-item")
  @ApiOperation({ summary: "Table-explorer: paginated list of all cart items (admin)." })
  @ApiResponse({ status: 200, description: "Paginated cart item list." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the super-user role." })
  @RequireGate(GateCode.CODE_SU)
  async getCartItemData(@Query() query: unknown) {
    const { page, size } = parseTableExplorerPageQuery(query);
    const items = await this.cartService.retrieveCartItemData(page, size);
    return keyedResponse("cartItemList", items);
  }

  /** getCartItemById(request, id) */
  @Get("/get/table-explorer/data/cart-item/:id")
  @ApiOperation({ summary: "Table-explorer: fetch a single cart item by id (admin)." })
  @ApiParam({ name: "id", description: "Cart item ID", example: 157423053, type: Number })
  @ApiResponse({ status: 200, description: "The cart item." })
  @ApiResponse({ status: 404, description: "No such cart item." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the super-user role." })
  @RequireGate(GateCode.CODE_SU)
  async getCartItemById(@Param("id") id: string) {
    const parsedId = parseIdParam(id);
    const item = await this.cartService.retrieveCartItemDataById(BigInt(parsedId));
    if (!item) throw new NotFoundException(`Cart item ${id} not found.`);
    return keyedResponse("cartItem", item);
  }

  /** getCartItemList(request) */
  @Get("/get/cart-item/list")
  @Get("/v1/cart")
  @ApiOperation({ summary: "List the authenticated customer's own cart items." })
  @ApiResponse({ status: 200, description: "The caller's cart item list." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the customer role." })
  @RequireGate(GateCode.CODE_CU)
  async getCartItemList(@CurrentTenant() tenant?: AuthenticatedTenant) {
    if (!tenant?.id) {
      return keyedResponse("cartItemList", []);
    }
    const items = await this.cartService.retrieveCartItems(tenant.id);
    return keyedResponse("cartItemList", items);
  }

  /** getCartItemListUsingUid(request, uid) */
  @Get("/get/tenant/cart-item/list/:uid")
  @ApiOperation({ summary: "List a specific tenant's cart items by uid (admin)." })
  @ApiParam({ name: "uid", description: "Tenant User UID", example: "e4d9ea92-78f6-4ce9-9d99-ce843f7e2fe4", type: String })
  @ApiResponse({ status: 200, description: "The tenant's cart item list." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the super-user role." })
  @RequireGate(GateCode.CODE_SU)
  async getCartItemListUsingUid(@Param("uid") uid: string) {
    const parsedUid = parseUidParam(uid);
    const items = await this.cartService.retrieveCartItemsByUid(parsedUid);
    return keyedResponse("cartItemList", items);
  }

  /** getCartItemListForTenants(request) */
  @Get("/get/tenant/cart-item/list")
  @ApiOperation({ summary: "Tenant-wise cart overview across all tenants (admin)." })
  @ApiResponse({ status: 200, description: "Per-tenant cart overview." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the super-user role." })
  @RequireGate(GateCode.CODE_SU)
  async getCartItemListForTenants() {
    const overview = await this.cartService.retrieveTenantWiseCartOverview();
    return keyedResponse("cartOverview", overview);
  }

  /** addCartItem(request, cartItem) */
  @Post("/add/cart-item")
  @Post("/v1/cart/items")
  @ApiOperation({ summary: "Add an item to the authenticated customer's cart." })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({ status: 201, description: "Cart item created." })
  @ApiResponse({ status: 200, description: "Request rejected by validation (see response body's success flag)." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the customer role." })
  @RequireGate(GateCode.CODE_CU)
  async addCartItem(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: unknown) {
    if (!tenant?.id) {
      return simpleResponse(false, "Please log in to add items to your cart.");
    }
    const parsed = parseAddCartItemRequest(body);
    const sanitized = sanitizeCartItem(parsed);

    if (!validateCartItem(sanitized)) {
      return simpleResponse(false, CartMessages.UNAUTH_CART_ITEM_CREATE_REQUEST);
    }

    const result = await this.cartService.addCartItem(tenant.id, sanitized);
    return simpleResponse(
      result === ActionCode.INSERT_SUCCESS,
      result === ActionCode.INSERT_SUCCESS ? CartMessages.NEW_CART_ITEM_CREATED : CartMessages.CART_ITEM_CREATE_FAILED,
    );
  }

  /** updateCartItem(request, updateCartItem) */
  @Patch("/update/cart-item")
  @Patch("/v1/cart/items/:cartItemId")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Update an existing cart item." })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({ status: 200, description: "Update result (see response body's success flag)." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the customer role." })
  @ApiResponse({ status: 409, description: "Optimistic lock conflict — item was modified concurrently." })
  async updateCartItem(@Body() body: unknown) {
    const parsed = parseUpdateCartItemRequest(body);
    const sanitized = sanitizeCartItem(parsed);

    if (!validateCartItem(sanitized)) {
      return simpleResponse(false, CartMessages.UNAUTH_CART_ITEM_UPDATE_REQUEST);
    }

    let result: number;
    try {
      result = await this.cartService.updateCartItem(sanitized);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This cart item was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(
      result === ActionCode.UPDATE_SUCCESS,
      result === ActionCode.UPDATE_SUCCESS ? CartMessages.CART_ITEM_UPDATED : CartMessages.CART_ITEM_UPDATE_FAILED,
    );
  }

  /** deleteCartItem(request, cartItemId) */
  @Delete("/delete/cart-item/:cartItemId")
  @Delete("/v1/cart/items/:cartItemId")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Delete a single cart item by id." })
  @ApiParam({ name: "cartItemId", description: "ID of the cart item to delete", example: 162902288, type: Number })
  @ApiResponse({ status: 200, description: "Delete result (see response body's success flag)." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the customer role." })
  @ApiResponse({ status: 409, description: "Optimistic lock conflict — item was modified concurrently." })
  async deleteCartItem(@Param("cartItemId") cartItemId: string) {
    const parsedId = parseCartItemIdParam(cartItemId);
    let deleted: boolean;
    try {
      deleted = await this.cartService.deleteCartItem(BigInt(parsedId));
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("This cart item was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(deleted, deleted ? CartMessages.CART_ITEM_DELETED : CartMessages.CART_ITEM_DELETE_FAILED);
  }

  /** deleteAllCartItem(request) */
  @Delete("/delete/all-cart-item")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "Delete every cart item belonging to the authenticated customer." })
  @ApiResponse({ status: 200, description: "All cart items deleted." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Caller lacks the customer role." })
  @ApiResponse({ status: 409, description: "Optimistic lock conflict — a cart item was modified concurrently." })
  async deleteAllCartItem(@CurrentTenant() tenant: AuthenticatedTenant) {
    let deleted: boolean;
    try {
      deleted = await this.cartService.deleteAllCartItem(tenant.id);
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        throw new ConflictException("Cart was modified by another request. Please retry.");
      }
      throw err;
    }
    return simpleResponse(deleted, CartMessages.ALL_CART_ITEM_DELETED);
  }
}
