import { Cart, CartItem } from "@/types/domain/cart";
import { mapLegacyCartToDomain } from "../adapters/legacy-cart.adapter";
import { LegacyCartItemDto } from "../dto/legacy-springboot.dto";

// ---------------------------------------------------------------------------
// ONE cart stack.
//
// This repository used to talk to `/api/backend/*`, which proxies to the NEST /
// Spring base URL and authenticated off a `jwt_token` cookie that no mounted
// login form ever wrote. Every call therefore went out unauthenticated, to the
// wrong backend, and 401'd — and `getCart` swallowed that into an empty cart,
// which is what surfaced to buyers as "your cart is empty" and as a delete
// button that did nothing.
//
// The cart now goes through the SAME `/api/cart/*` BFF routes checkout already
// used: server-side, Loom-backed, authenticated from the httpOnly `loom_jwt`
// cookie. Drawer, PDP and checkout consequently read and write one cart.
//
// Errors are RAISED, never masked. An empty cart and an unreachable cart are
// different facts and the UI must be able to tell them apart.
// ---------------------------------------------------------------------------

/** Thrown when the session is gone. The UI prompts a re-login rather than lying about an empty cart. */
export class CartAuthError extends Error {
  constructor(message = "Your session has expired — please sign in again.") {
    super(message);
    this.name = "CartAuthError";
  }
}

export const EMPTY_CART: Cart = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  estimatedShipping: 0,
  total: 0,
  currency: "INR",
};

type BffResponse = {
  success?: boolean;
  message?: string;
  reauth?: boolean;
  cartItemList?: unknown[];
  entity?: unknown[];
  authenticated?: boolean;
};

async function readBody(response: Response): Promise<BffResponse> {
  try {
    return (await response.json()) as BffResponse;
  } catch {
    return {};
  }
}

/**
 * Every cart mutation answers the same way, so the failure handling lives here
 * once. Loom reports some failures as HTTP 200 with `success:false`, so the
 * status code alone is not the verdict.
 */
async function mutate(url: string, init: RequestInit): Promise<void> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await readBody(response);

  if (response.status === 401 || body.reauth) {
    throw new CartAuthError(body.message);
  }
  if (!response.ok || body.success === false) {
    throw new Error(body.message || "We could not update your cart. Please try again.");
  }
}

/**
 * What Loom's `POST /add/cart-item` binds to: the `CartItem` JPA entity, sent
 * flat, not wrapped. The owning tenant is NOT part of the body — Loom resolves
 * it from the bearer token, so this only works for a signed-in customer.
 */
export interface AddCartItemInput {
  /** `FabricPreview` id (the PDP payload's top-level `id`), for `productGroup: "fabric"`. */
  fabricProductId?: number;
  /** `FinishedPreview` id, for `productGroup: "finished"`. */
  finishedProductId?: number;
  quantity: number;
  unit: string;
  price: number;
  sku: string;
  orderType?: "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER";
  productGroup?: "fabric" | "finished" | "swatch";
  selectedFabricId?: number;
  selectedSizeOptionId?: number;
  selectedFinishId?: string;
  makingCharge?: number;
  customSize?: Record<string, unknown>;
  minOrderQuantity?: number;
}

/**
 * Loom rejects a zero foreign key outright (there is no id 0 to join to), so
 * those keys are deleted rather than sent as 0. The columns Loom marks NOT NULL
 * (`selectedFinishId`, `customSize`, `productGroup`, `orderType`,
 * `makingCharge`) always have to be present.
 */
function toLegacyCartItem(input: AddCartItemInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    quantity: input.quantity,
    unit: input.unit,
    price: input.price,
    sku: input.sku,
    orderType: input.orderType ?? "IN_STOCK",
    productGroup: input.productGroup ?? "fabric",
    selectedSizeOptionId: input.selectedSizeOptionId ?? 0,
    selectedFinishId: input.selectedFinishId ?? "",
    makingCharge: input.makingCharge ?? 0,
    customSize: input.customSize ?? {},
  };
  if (input.fabricProductId && input.fabricProductId > 0) body.fabricProductId = input.fabricProductId;
  if (input.finishedProductId && input.finishedProductId > 0) body.finishedProductId = input.finishedProductId;
  if (input.selectedFabricId && input.selectedFabricId > 0) body.selectedFabricId = input.selectedFabricId;
  if (input.minOrderQuantity) body.minOrderQuantity = input.minOrderQuantity;
  return body;
}

export const cartRepository = {
  /**
   * Read the cart. Signed out yields an empty cart (a fact, not a failure);
   * a transport or backend failure THROWS so the drawer can say so.
   */
  async getCart(): Promise<Cart> {
    const response = await fetch("/api/cart", { cache: "no-store" });
    const body = await readBody(response);

    // Signed out is a legitimately empty cart, not an error.
    if (body.authenticated === false) return EMPTY_CART;

    if (response.status === 401 || body.reauth) throw new CartAuthError(body.message);
    if (!response.ok || body.success === false) {
      throw new Error(body.message || "We could not load your cart.");
    }

    const rows = (body.cartItemList ?? body.entity ?? []) as LegacyCartItemDto[];
    return mapLegacyCartToDomain(rows);
  },

  /** Add an item to the cart. */
  async addToCart(input: AddCartItemInput): Promise<void> {
    await mutate("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toLegacyCartItem(input)),
    });
  },

  /**
   * Change the quantity on an existing row.
   *
   * Only `{id, quantity}` is sent. The previous version re-serialised the whole
   * row from the cached preview, which re-sent the BASE price (silently
   * discarding any volume discount) and dropped `selectedFabricId`,
   * `selectedSizeOptionId` and `customSize` — so bumping the quantity on a
   * customised or bulk line wiped the customisation and re-priced it upward.
   * Loom re-prices the row itself, so quantity is the only thing to send.
   */
  async updateQuantity(item: CartItem, quantity: number): Promise<void> {
    await mutate("/api/cart/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(item.id), quantity }),
    });
  },

  /**
   * Remove a single row. `cartItemId` is the domain CartItem's `id` — Loom's
   * `cart_item` primary key, not a product id.
   */
  async removeCartItem(cartItemId: string): Promise<void> {
    await mutate("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(cartItemId) }),
    });
  },
};
