import { describe, it, expect } from "vitest";
import "reflect-metadata";
// HealthController is not exported from health.module.ts, so it is reached
// through the compiled module's own export surface via a relative re-import
// of the same file — Nest doesn't require DI to call the plain method below.
import { HealthModule } from "./health.module.js";

describe("HealthModule / GET /health", () => {
  it("exposes exactly one controller with a check() handler returning status ok", () => {
    const definition: any = Reflect.getMetadata("controllers", HealthModule);
    expect(definition).toHaveLength(1);

    const controller = new definition[0]();
    const result = controller.check();
    expect(result.status).toBe("ok");
  });

  it("returns a numeric, non-negative uptime", () => {
    const definition: any = Reflect.getMetadata("controllers", HealthModule);
    const controller = new definition[0]();
    const result = controller.check();
    expect(typeof result.uptime).toBe("number");
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });
});
