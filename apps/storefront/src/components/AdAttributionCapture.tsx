'use client';

import { useEffect } from 'react';
import { captureFromUrl } from '@/lib/ad-attribution';

/**
 * Fires ad-attribution capture on every landing. Mounted once in the root layout
 * so it runs on ANY entry URL (home, PDP, /ads/[slug], etc). captureFromUrl() is a
 * no-op when the URL carries no gclid/gbraid/wbraid/utm_*, and last-click-wins when
 * it does. Renders nothing.
 */
export default function AdAttributionCapture() {
  useEffect(() => {
    captureFromUrl();
  }, []);
  return null;
}
