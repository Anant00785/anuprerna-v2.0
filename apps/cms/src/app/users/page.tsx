/**
 * /users — Users screen (Server Component shell).
 *
 * Renders INSTANTLY: the shell + tabs + skeleton paint with zero server-side
 * data fetching. The current tab's page of rows (and the tab counts) load
 * client-side via the /api/admin/* routes, which hit the paginated native
 * wrapper endpoints backed by our pg copy. This replaces the old
 * force-dynamic page that blocked SSR fetching ALL ~6,800 customers +
 * ~2,400 carts from remote live Loom.
 */
import React from "react";
import { UsersClient } from "./UsersClient";

export default function UsersPage() {
  return <UsersClient />;
}
