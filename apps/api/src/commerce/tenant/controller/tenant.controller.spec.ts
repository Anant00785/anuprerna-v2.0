/**
 * apps/api/src/commerce/tenant/controller/tenant.controller.spec.ts
 *
 * Authorization + input-handling regression tests for TenantController.
 *
 * The gate tests drive the REAL RolesGuard against the REAL @RequireGate
 * metadata on each handler and a REAL GatekeeperService — nothing about
 * the gate is mocked, so deleting a @RequireGate (which is exactly what
 * this branch did) fails these tests rather than silently opening the
 * endpoint.
 */
import "reflect-metadata";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../../../common/auth/roles.guard.js";
import { GatekeeperService } from "../../../auth/service/gatekeeper.service.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { TenantController } from "./tenant.controller.js";
import type { TenantService } from "../service/tenant.service.js";

const fakeConfig = {
  get: (key: string) =>
    ({ AUTH_JWT_SECRET: "test-jwt-secret-not-real", AUTH_PASSWORD_PEPPER: "test-pepper", AUTH_JWT_TTL_SECONDS: 3600 })[
      key
    ],
} as any;

const gatekeeper = new GatekeeperService(fakeConfig);
const guard = new RolesGuard(new Reflector(), gatekeeper);

const tokenFor = (roles: string[]) =>
  gatekeeper.generateToken({ id: 42, uid: "u42", email: "t@b.com", roles } as AuthenticatedTenant);

type HandlerName = keyof TenantController;

function contextFor(handler: HandlerName, token: string): ExecutionContext {
  return {
    getHandler: () => TenantController.prototype[handler],
    getClass: () => TenantController,
    switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }) }),
  } as unknown as ExecutionContext;
}

/** endpoint -> [required role that passes, a role that must NOT pass] */
const GATED: Array<[HandlerName, string, string]> = [
  ["getSuperUserProfile", "ROLE_SUPER_USER", "ROLE_CUSTOMER"],
  ["getTenantProfile", "ROLE_SUPER_USER", "ROLE_CUSTOMER"],
  ["getCustomerProfile", "ROLE_CUSTOMER", "ROLE_SUPER_USER"],
  ["getUserRoles", "ROLE_SUPER_USER", "ROLE_CUSTOMER"],
  ["getUserRoleById", "ROLE_SUPER_USER", "ROLE_CUSTOMER"],
  ["updateCustomerProfile", "ROLE_CUSTOMER", "ROLE_SUPER_USER"],
];

describe("TenantController — @RequireGate enforcement", () => {
  const tokens: Record<string, string> = {};

  beforeAll(async () => {
    for (const role of ["ROLE_SUPER_USER", "ROLE_CUSTOMER", "ROLE_ADMIN"]) {
      tokens[role] = await tokenFor([role]);
    }
  });

  for (const [handler, allowedRole, deniedRole] of GATED) {
    it(`${handler} denies a token lacking ${allowedRole}`, () => {
      expect(() => guard.canActivate(contextFor(handler, tokens[deniedRole]))).toThrow(ForbiddenException);
    });

    it(`${handler} denies a bare ROLE_ADMIN token`, () => {
      expect(() => guard.canActivate(contextFor(handler, tokens["ROLE_ADMIN"]))).toThrow(ForbiddenException);
    });

    it(`${handler} allows a ${allowedRole} token`, () => {
      expect(guard.canActivate(contextFor(handler, tokens[allowedRole]))).toBe(true);
    });
  }
});

describe("TenantController#updateCustomerProfile — validate + sanitize", () => {
  function build() {
    const service = { updateCustomerProfile: vi.fn().mockResolvedValue({ id: 42 }) };
    return { service, controller: new TenantController(service as unknown as TenantService) };
  }

  it("rejects a non-string name without touching the service", async () => {
    const { service, controller } = build();

    await expect(controller.updateCustomerProfile({ id: 42 }, { name: 123 })).rejects.toThrow(/Name must be a string/);
    expect(service.updateCustomerProfile).not.toHaveBeenCalled();
  });

  it("trims name and phone before they reach the service", async () => {
    const { service, controller } = build();

    await controller.updateCustomerProfile({ id: 42 }, { name: "  Anant Kumar  ", phone: " +919876543210 " });

    expect(service.updateCustomerProfile).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ name: "Anant Kumar", phone: "+919876543210" }),
    );
  });
});

describe("TenantController#getCustomerProfile — response key", () => {
  /**
   * Loom's CustomerController.getCustomerProfile() builds through
   * CustomerResponse/CustomerDataResponse, which call
   * prepareEntity(entity, ResponseParameter.CUSTOMER) where CUSTOMER = "customer".
   * The storefront reads `response.customer`
   * (apps/storefront/src/lib/api/repositories/profile.repository.ts), so keying
   * this `profile` rendered an empty profile page.
   */
  it("returns the payload under `customer`, matching Loom and the storefront", async () => {
    const profile = { id: 42, email: "t@b.com" };
    const service = { getCustomerProfile: vi.fn().mockResolvedValue(profile) };
    const controller = new TenantController(service as unknown as TenantService);

    const res = (await controller.getCustomerProfile({ tenantId: 42 })) as Record<string, unknown>;

    expect(res.customer).toEqual(profile);
    expect(res).not.toHaveProperty("profile");
  });
});
