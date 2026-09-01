/**
 * /impact — Impact Factor page (Server Component shell).
 *
 * Data loads client-side via the single /api/impact/batch request, so this shell
 * is a pure static wrapper (no force-dynamic needed here).
 */

import { ImpactClient } from './ImpactClient';

export default function ImpactPage() {
  return <ImpactClient />;
}
