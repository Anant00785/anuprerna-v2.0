'use client';

// -----------------------------------------------------------------------------
// TopProgressBar — global route-change progress indicator.
//
// Gives an instant "something is happening" cue on EVERY internal link click so
// the storefront never feels frozen while the (fast) server responds. Self-
// contained: ~1 file, no deps. A capture-phase click listener on internal <a>
// tags trims the bar in within ~50ms; the bar completes when usePathname /
// useSearchParams change (navigation committed). Brand accent = clay (#7D5B20).
//
// useSearchParams is wrapped in its own Suspense boundary so the root layout is
// NOT opted into client-side rendering.
// -----------------------------------------------------------------------------

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    trickle.current = null;
    safety.current = null;
  };

  const start = () => {
    if (finishT.current) clearTimeout(finishT.current);
    clearTimers();
    setVisible(true);
    setWidth(8);
    // Ease toward ~90% while we wait for the route to commit.
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.18 : w));
    }, 180);
    // Safety: never leave the bar stuck if a click didn't cause navigation.
    safety.current = setTimeout(() => done(), 8000);
  };

  const done = () => {
    clearTimers();
    setWidth(100);
    finishT.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 220);
  };

  // Complete the bar whenever the committed route (path or query) changes.
  useEffect(() => {
    if (visible) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Start the bar on any same-origin left-click navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download')) return;
      // External links: let them go, no bar.
      if (/^[a-z]+:/i.test(href) && !href.startsWith(location.origin) && !href.startsWith('/')) {
        if (!href.startsWith('http') || !href.includes(location.host)) return;
      }
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return; // same page
      } catch {
        return;
      }
      start();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { clearTimers(); if (finishT.current) clearTimeout(finishT.current); }, []);

  if (!visible) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: width + '%',
        zIndex: 9999,
        background: 'linear-gradient(90deg,#7D5B20,#B08A3E)',
        boxShadow: '0 0 8px rgba(125,91,32,0.6)',
        transition: 'width 0.18s ease-out, opacity 0.22s ease',
        opacity: width >= 100 ? 0 : 1,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
