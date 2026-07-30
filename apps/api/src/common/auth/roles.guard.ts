// Minimal dummy — satisfies imports for commerce/cart. No business logic:
// this guard always allows the request through (canActivate -> true).
import { CanActivate, Injectable, SetMetadata } from "@nestjs/common";

export enum GateCode {
  CODE_SU = "CODE_SU",
  CODE_CU = "CODE_CU",
}

export const GATE_CODE_KEY = "gateCode";
export const RequireGate = (code: GateCode) => SetMetadata(GATE_CODE_KEY, code);

export interface AuthenticatedTenant {
  id: number;
  uid: string;
  roles: string[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
