import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CMS auth boundary. VERIFY the JWT signature here (the legacy CMS did not — forgeable admin).
// dev: validate the session cookie's signature against AUTH_JWT_SECRET before allowing /admin/*.
export function middleware(_req: NextRequest) {
  // TODO(dev): verify signed session; redirect to /login if invalid.
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
