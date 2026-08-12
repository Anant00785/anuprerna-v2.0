import { setupServer } from "msw/node";
import type { RequestHandler } from "msw";

// The storefront serves real customers off the LIVE legacy backend. A test that
// reached the network would hit production, so this server runs with
// `onUnhandledRequest: "error"`: any request without an explicit handler fails
// the test rather than escaping. Do not relax this.
export const server = setupServer();

/** Register handlers for a single test. Reset automatically after each test. */
export function useHandlers(...handlers: RequestHandler[]) {
  server.use(...handlers);
}

/**
 * In the browser the client routes everything through the Next proxy at
 * /api/backend (see src/lib/api/client.ts getBaseUrl). Under jsdom that
 * resolves relative to localhost, so handlers should match this base unless
 * the test is exercising a server-side path. See docs/DATA-FLOW.md.
 */
export const PROXY_BASE = "http://localhost:3000/api/backend";

/** The legacy Spring backend's response envelope. */
export function envelope<T>(listKey: string, payload: T) {
  return { success: true, message: "", [listKey]: payload };
}
