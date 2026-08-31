'use client';
import { useEffect, useRef } from 'react';

interface LazyHeroVideoProps {
  src: string;
  poster: string;
  className?: string;
}

/**
 * LazyHeroVideo — ambient autoplaying video panel.
 *
 * Load strategy:
 * - preload="none" + no src on initial render → zero network cost during page load.
 * - Waits for window.onload (all critical resources done) BEFORE scheduling anything.
 * - Then uses requestIdleCallback (fallback: setTimeout 200ms) to pick a truly idle moment.
 * - IntersectionObserver: only assigns src + plays when the panel is in the viewport.
 * - Pauses when scrolled out of view or tab hidden (visibilitychange).
 * - Respects prefers-reduced-motion: skips video, leaves poster intact.
 */
export default function LazyHeroVideo({ src, poster, className = '' }: LazyHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadedRef = useRef(false);
  const inViewRef  = useRef(false);

  useEffect(() => {
    // Respect reduced-motion — do nothing; poster stays as the only content.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const video = videoRef.current;
    if (!video) return;

    let observer: IntersectionObserver | null = null;
    let idleHandle: number | ReturnType<typeof setTimeout> | null = null;
    let pageLoaded = false;

    const loadAndPlay = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      video.src = src;
      video.load();
      video.play().catch(() => {});
    };

    // Only schedule once window.onload has fired AND the panel is in view.
    const maybeSchedule = () => {
      if (loadedRef.current || !pageLoaded || !inViewRef.current) return;
      if (idleHandle !== null) return; // already queued
      if (typeof window.requestIdleCallback !== 'undefined') {
        idleHandle = window.requestIdleCallback(loadAndPlay, { timeout: 3000 });
      } else {
        idleHandle = setTimeout(loadAndPlay, 200);
      }
    };

    // Gate 1: page fully loaded (after LCP resources are done)
    if (document.readyState === 'complete') {
      pageLoaded = true;
    } else {
      window.addEventListener('load', () => {
        pageLoaded = true;
        maybeSchedule();
      }, { once: true });
    }

    // Gate 2: IntersectionObserver — only act when panel is visible
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            inViewRef.current = true;
            maybeSchedule();
            // If already loaded and paused (tab-hidden resume), play again
            if (loadedRef.current && video.paused) {
              video.play().catch(() => {});
            }
          } else {
            inViewRef.current = false;
            if (!video.paused) video.pause();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);

    // If page was already loaded when this effect ran, kick maybeSchedule now.
    if (pageLoaded) maybeSchedule();

    // Gate 3: pause when tab is hidden
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else if (loadedRef.current && inViewRef.current) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (idleHandle !== null) {
        if (typeof window.requestIdleCallback !== 'undefined' && typeof idleHandle === 'number') {
          window.cancelIdleCallback(idleHandle as number);
        } else {
          clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
        }
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      className={className}
    />
  );
}
