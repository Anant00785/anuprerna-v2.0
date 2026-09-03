import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw.js";

// `onUnhandledRequest: "error"` is the guard that stops a test ever reaching
// the live legacy backend at loom-v2.anuprerna.com. See src/test/msw.ts.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  // AuthService reads and writes localStorage directly from static methods,
  // so state leaks between tests unless it is cleared here.
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => server.close());
