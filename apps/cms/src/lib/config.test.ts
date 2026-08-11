import { describe, it, expect, afterEach, vi } from "vitest";

// ConfigurationService bakes process.env at module load (docs/DATA-FLOW.md,
// config.ts:1,20). Each case must stub env, reset the module cache, and
// re-import so the module body re-runs with the new env.
describe("ConfigurationService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults RAW_SERVER_ENDPOINT to a hardcoded production URL when the env var is unset", async () => {
    // Deliberately not asserting the literal hostname here -- test files must
    // never contain a production hostname (docs/TESTING.md rule 1). The
    // shape check below is sufficient to characterize the fallback.
    vi.stubEnv("NEXT_PUBLIC_SERVER_ENDPOINT", "");
    vi.resetModules();
    const { ConfigurationService } = await import("./config");
    expect(ConfigurationService.RAW_SERVER_ENDPOINT).toMatch(/^https:\/\//);
    expect(ConfigurationService.RAW_SERVER_ENDPOINT).not.toBe("https://custom.example.test");
  });

  it("uses NEXT_PUBLIC_SERVER_ENDPOINT when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SERVER_ENDPOINT", "https://custom.example.test");
    vi.resetModules();
    const { ConfigurationService } = await import("./config");
    expect(ConfigurationService.RAW_SERVER_ENDPOINT).toBe("https://custom.example.test");
  });

  it("SERVER_ENDPOINT is the in-browser proxy path in a DOM environment (window defined under jsdom)", async () => {
    vi.resetModules();
    const { ConfigurationService } = await import("./config");
    // vitest's jsdom environment always has `window`, so this branch of
    // config.ts (`typeof window !== 'undefined' ? '/api/backend' : RAW...`)
    // always resolves to the proxy path in this test suite -- the
    // server-side RAW_SERVER_ENDPOINT branch is not reachable from these tests.
    expect(ConfigurationService.SERVER_ENDPOINT).toBe("/api/backend");
    expect(ConfigurationService.API_ENDPOINT).toBe("/api/backend");
  });

  it("LFS_SERVER_ENDPOINT uses NEXT_PUBLIC_LFS_SERVER_ENDPOINT when set, else the bloomscorp default", async () => {
    vi.stubEnv("NEXT_PUBLIC_LFS_SERVER_ENDPOINT", "https://lfs.example.test");
    vi.resetModules();
    let mod = await import("./config");
    expect(mod.ConfigurationService.LFS_SERVER_ENDPOINT).toBe("https://lfs.example.test");

    vi.unstubAllEnvs();
    vi.resetModules();
    mod = await import("./config");
    expect(mod.ConfigurationService.LFS_SERVER_ENDPOINT).toBe("https://hercules.bloomscorp.com");
  });

  it("dead flags (FAKE_API, BYPASS_AUTH, MAINTENANCE_MODE, SECURE_CONNECT) are static constants with no env wiring", async () => {
    // These four fields never read process.env at all -- grepping the repo
    // for references outside config.ts finds none. Pin their hardcoded
    // values so a future accidental wiring shows up as a diff here.
    vi.stubEnv("FAKE_API", "true");
    vi.stubEnv("BYPASS_AUTH", "true");
    vi.stubEnv("MAINTENANCE_MODE", "true");
    vi.stubEnv("SECURE_CONNECT", "false");
    vi.resetModules();
    const { ConfigurationService } = await import("./config");
    expect(ConfigurationService.FAKE_API).toBe(false);
    expect(ConfigurationService.BYPASS_AUTH).toBe(false);
    expect(ConfigurationService.MAINTENANCE_MODE).toBe(false);
    expect(ConfigurationService.SECURE_CONNECT).toBe(true);
  });
});
