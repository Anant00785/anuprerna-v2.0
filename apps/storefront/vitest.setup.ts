import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./src/test/msw";

// `onUnhandledRequest: "error"` is the guard that stops a test ever reaching
// the live legacy backend at loom-v2.anuprerna.com. See src/test/msw.ts.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  // auth.store persists the JWT to localStorage via zustand/persist, so state
  // leaks between tests unless it is cleared here.
  localStorage.clear();
});

afterAll(() => server.close());
