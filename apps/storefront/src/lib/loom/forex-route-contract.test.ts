/**
 * Cross-app contract test: the forex paths this storefront requests must be
 * paths the NestJS API actually serves, AND must be ungated (the storefront's
 * SSR fetch carries no bearer token — see loomGet in ./client).
 *
 * This exists because the paths silently diverged once already: the API was
 * renamed to /get/forex and /get/forex/exchange-rate/:code while the storefront
 * kept calling Loom's original /get/forex-list and
 * /get/forex-exchange-rate/latest, and a later pass put @RequireGate(CODE_SU)
 * on the ungated Loom originals. Both failures are invisible to unit tests on
 * either side alone, so we assert against the API controller source directly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CONTROLLER = resolve(
  __dirname,
  "../../../../api/src/commerce/forex/controller/forex.controller.ts",
);
const src = readFileSync(CONTROLLER, "utf8");

/** Handler blocks: everything from one @Get/@Patch/@Post to the next. */
function handlerBlocks(): string[] {
  return src.split(/\n(?=\s*@(?:Get|Post|Patch|Put|Delete)\()/).slice(1);
}

function blockServing(path: string): string | undefined {
  return handlerBlocks().find((b) => {
    const decorator = b.slice(0, b.indexOf("\n  async"));
    return decorator.includes(`"${path}"`);
  });
}

/** Path -> the response key the storefront reads off it. */
const STOREFRONT_CALLS: ReadonlyArray<readonly [string, string]> = [
  // src/lib/loom/endpoints.ts getForexList + src/stores/currency.store.ts
  ["/get/forex-list", "forexList"],
  // src/lib/loom/endpoints.ts getForex + src/stores/currency.store.ts
  ["/get/forex-exchange-rate/latest", "forexExchangeRate"],
];

describe("forex API route contract", () => {
  it("the API controller source is reachable from the storefront", () => {
    expect(src).toContain("class ForexController");
  });

  for (const [path, key] of STOREFRONT_CALLS) {
    describe(path, () => {
      it("is declared on the API's ForexController", () => {
        expect(blockServing(path)).toBeDefined();
      });

      it("is NOT role-gated — the storefront calls it with no token", () => {
        expect(blockServing(path)).not.toMatch(/@RequireGate/);
      });

      it(`returns the response key the storefront reads (\`${key}\`)`, () => {
        expect(blockServing(path)).toContain(`keyedResponse("${key}"`);
      });
    });
  }

  it("the paths asserted here are the paths endpoints.ts actually requests", () => {
    const endpoints = readFileSync(resolve(__dirname, "endpoints.ts"), "utf8");
    for (const [path] of STOREFRONT_CALLS) {
      expect(endpoints).toContain(`'${path}'`);
    }
  });
});
