import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { RolesGuard, GATE_CODE_KEY, RequireGate, GateCode } from "./roles.guard.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

// Characterization tests for the guard every @RequireGate route depends on.
// Fakes expose only the two methods the guard actually calls — no
// Test.createTestingModule, per docs/TESTING.md / the task brief.

function makeContext(opts: { headers?: Record<string, string>; requiredGate?: GateCode | undefined }) {
  const request: any = { headers: opts.headers ?? {} };
  return {
    request,
    context: {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any,
    reflector: {
      getAllAndOverride: () => opts.requiredGate,
    } as any,
  };
}

describe("RolesGuard", () => {
  const tenant: AuthenticatedTenant = { id: 1, uid: "u1", email: "a@b.com", roles: ["ROLE_CUSTOMER"] };

  it("allows the request through when no @RequireGate metadata is present (public route)", () => {
    const { context, reflector } = makeContext({ requiredGate: undefined });
    const gatekeeper = { verifyToken: vi.fn(), userHasAppropriateAuthority: vi.fn() };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(guard.canActivate(context)).toBe(true);
    expect(gatekeeper.verifyToken).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedException when Authorization header is missing", () => {
    const { context, reflector } = makeContext({ requiredGate: GateCode.CODE_CU, headers: {} });
    const gatekeeper = { verifyToken: vi.fn(), userHasAppropriateAuthority: vi.fn() };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  // Pinned oddity: the header is `.trim()`-med BEFORE the "Bearer "-stripping
  // while-loop, so "Bearer " (trailing space, nothing else) becomes "Bearer"
  // (no trailing space) and no longer matches `startsWith("bearer ")`. The
  // literal string "Bearer" is passed to verifyToken() as-is — it is NOT
  // treated as an empty/missing token. Characterizing this exactly, not
  // "fixing" it.
  it("a header of 'Bearer ' with nothing after it trims to 'Bearer' and is NOT stripped further", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "Bearer " },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    guard.canActivate(context);
    expect(gatekeeper.verifyToken).toHaveBeenCalledWith("Bearer");
  });

  it("throws UnauthorizedException when the Authorization header is an empty string", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "" },
    });
    const gatekeeper = { verifyToken: vi.fn(), userHasAppropriateAuthority: vi.fn() };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("strips a single 'Bearer ' prefix before verifying the token", () => {
    const { context, reflector, request } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "Bearer tok123" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(guard.canActivate(context)).toBe(true);
    expect(gatekeeper.verifyToken).toHaveBeenCalledWith("tok123");
    expect(request.tenant).toBe(tenant);
  });

  // The guard strips "bearer " in a while-loop, so a doubled prefix is
  // silently unwrapped too — pinning the actual (slightly odd) behavior,
  // not "fixing" it.
  it("strips repeated 'Bearer Bearer ' prefixes (while-loop behavior, pinned as-is)", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "Bearer Bearer tok123" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    guard.canActivate(context);
    expect(gatekeeper.verifyToken).toHaveBeenCalledWith("tok123");
  });

  it("treats the prefix case-insensitively ('bearer' lowercase)", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "bearer tok123" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    guard.canActivate(context);
    expect(gatekeeper.verifyToken).toHaveBeenCalledWith("tok123");
  });

  it("passes a header with no 'Bearer' prefix through untouched as the raw token", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_CU,
      headers: { authorization: "raw-token-no-prefix" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    guard.canActivate(context);
    expect(gatekeeper.verifyToken).toHaveBeenCalledWith("raw-token-no-prefix");
  });

  it("throws ForbiddenException when the resolved tenant lacks the required gate authority", () => {
    const { context, reflector } = makeContext({
      requiredGate: GateCode.CODE_SU,
      headers: { authorization: "Bearer tok123" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(false),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(gatekeeper.userHasAppropriateAuthority).toHaveBeenCalledWith(tenant, GateCode.CODE_SU);
  });

  it("returns true and attaches the resolved tenant to the request when authorized", () => {
    const { context, reflector, request } = makeContext({
      requiredGate: GateCode.CODE_SU,
      headers: { authorization: "Bearer tok123" },
    });
    const gatekeeper = {
      verifyToken: vi.fn().mockReturnValue(tenant),
      userHasAppropriateAuthority: vi.fn().mockReturnValue(true),
    };
    const guard = new RolesGuard(reflector, gatekeeper as any);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.tenant).toEqual(tenant);
  });
});

describe("RequireGate", () => {
  it("stamps the gate code onto GATE_CODE_KEY metadata via SetMetadata", () => {
    class Dummy {
      @RequireGate(GateCode.CODE_AR)
      handler() {}
    }
    const value = Reflect.getMetadata(GATE_CODE_KEY, Dummy.prototype.handler);
    expect(value).toBe(GateCode.CODE_AR);
  });
});
