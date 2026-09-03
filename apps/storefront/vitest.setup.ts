// The backend base URL for tests. Production code deliberately has NO default
// (see src/lib/loom/config.ts) so a misconfigured deploy fails loudly instead of
// silently calling the wrong backend — which means the TEST environment has to
// supply one. MSW intercepts this origin; nothing leaves the machine.
process.env.LOOM_BASE_URL ||= "http://127.0.0.1:3000";
process.env.NEXT_PUBLIC_API_URL ||= "http://127.0.0.1:3000";

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
