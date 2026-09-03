/**
 * apps/api/src/common/testing/gate-spec.ts
 *
 * Shared harness for the per-controller `*.controller.gates.spec.ts` files.
 *
 * It drives the REAL RolesGuard against the REAL @RequireGate metadata on
 * each handler, with a REAL GatekeeperService — nothing about the gate is
 * mocked. The expected gate is spelled out in each spec rather than read
 * back off the metadata, so deleting or weakening a @RequireGate fails the
 * spec instead of silently opening the endpoint.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../auth/roles.guard.js";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";
import { GateCode, type AuthenticatedTenant } from "../../auth/types/auth.types.js";

const fakeConfig = {
  get: (key: string) =>
    ({ AUTH_JWT_SECRET: "test-jwt-secret-not-real", AUTH_PASSWORD_PEPPER: "test-pepper", AUTH_JWT_TTL_SECONDS: 3600 })[
      key
    ],
} as unknown as ConstructorParameters<typeof GatekeeperService>[0];

const gatekeeper = new GatekeeperService(fakeConfig);
const guard = new RolesGuard(new Reflector(), gatekeeper);

export const ROLE_SU = "ROLE_SUPER_USER";
export const ROLE_CU = "ROLE_CUSTOMER";
export const ROLE_AR = "ROLE_ARTISAN";
/** A real, verifiable token holding a role no LoomGatekeeper gate accepts. */
export const ROLE_NONE = "ROLE_ADMIN";

/** [a role the gate must accept, a role the gate must reject] */
const ROLES_FOR: Record<GateCode, [string, string]> = {
  [GateCode.CODE_SU]: [ROLE_SU, ROLE_CU],
  [GateCode.CODE_CU]: [ROLE_CU, ROLE_SU],
  [GateCode.CODE_AR]: [ROLE_AR, ROLE_CU],
  [GateCode.CODE_SUCU]: [ROLE_CU, ROLE_AR],
  [GateCode.CODE_SUAR]: [ROLE_AR, ROLE_CU],
  [GateCode.CODE_CUAR]: [ROLE_CU, ROLE_SU],
  [GateCode.CODE_SUCUAR]: [ROLE_CU, ROLE_NONE],
};

type Ctor = { new (...args: never[]): object; prototype: Record<string, unknown> };

function contextFor(ctor: Ctor, handler: string, token?: string): ExecutionContext {
  return {
    getHandler: () => ctor.prototype[handler],
    getClass: () => ctor,
    switchToHttp: () => ({ getRequest: () => ({ headers: token ? { authorization: `Bearer ${token}` } : {} }) }),
  } as unknown as ExecutionContext;
}

/**
 * @param gated       handler name -> the gate it must carry
 * @param publicRoutes handler names that are deliberately reachable with no token
 */
export function describeGates(
  controllerName: string,
  ctor: Ctor,
  gated: ReadonlyArray<readonly [string, GateCode]>,
  publicRoutes: readonly string[] = [],
): void {
  describe(`${controllerName} — @RequireGate enforcement`, () => {
    const tokens: Record<string, string> = {};

    beforeAll(async () => {
      for (const role of [ROLE_SU, ROLE_CU, ROLE_AR, ROLE_NONE]) {
        tokens[role] = await gatekeeper.generateToken({
          id: 42,
          uid: "u42",
          email: "t@b.com",
          roles: [role],
        } as AuthenticatedTenant);
      }
    });

    for (const [handler, gate] of gated) {
      const [allowed, denied] = ROLES_FOR[gate];

      it(`${handler} is unreachable without a token`, () => {
        expect(() => guard.canActivate(contextFor(ctor, handler))).toThrow(UnauthorizedException);
      });

      it(`${handler} denies a ${denied} token`, () => {
        expect(() => guard.canActivate(contextFor(ctor, handler, tokens[denied]))).toThrow(ForbiddenException);
      });

      it(`${handler} allows a ${allowed} token`, () => {
        expect(guard.canActivate(contextFor(ctor, handler, tokens[allowed]))).toBe(true);
      });
    }

    if (publicRoutes.length > 0) {
      it("leaves the intentionally-public routes reachable without a token", () => {
        for (const handler of publicRoutes) {
          expect(guard.canActivate(contextFor(ctor, handler))).toBe(true);
        }
      });
    }
  });
}
