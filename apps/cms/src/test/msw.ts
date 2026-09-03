import { setupServer } from "msw/node";
import type { RequestHandler } from "msw";

// The CMS talks to the LIVE legacy backend in production. A test that reaches
// the network would hit real customer data, so the server below is configured
// with `onUnhandledRequest: "error"`: any request without an explicit handler
// fails the test rather than escaping. Do not relax this.
export const server = setupServer();

/** Register handlers for a single test. Reset automatically after each test. */
export function useHandlers(...handlers: RequestHandler[]) {
  server.use(...handlers);
}

/**
 * The legacy backend always replies 200 with a RainTree envelope; the payload
 * sits under a per-endpoint key. Fixtures must use this real shape — a flat
 * array would bypass both `assertEnvelopeOk` (which reads `success`) and the
 * per-module `pickArray` key lookup that every CMS response goes through.
 * See docs/frontend/cms/data-layer.md.
 */
export function envelope<T>(listKey: string, payload: T) {
  return { success: true, message: "", [listKey]: payload };
}

export function errorEnvelope(message: string) {
  return { success: false, message };
}
