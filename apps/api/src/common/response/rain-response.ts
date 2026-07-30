// Minimal dummy — satisfies imports for commerce/cart. No business logic.
export interface RainSimple {
  success: boolean;
  message: string;
}

export function simpleResponse(success: boolean, message: string): RainSimple {
  return { success, message };
}

export function keyedResponse<K extends string, T>(
  key: K,
  payload: T,
  success = true,
  message = "",
): RainSimple & Record<K, T> {
  return { success, message, [key]: payload } as RainSimple & Record<K, T>;
}
