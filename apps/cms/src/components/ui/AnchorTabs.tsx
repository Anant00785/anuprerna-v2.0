"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface AnchorTab {
  id: string;
  label: string;
}

interface AnchorTabsProps {
  tabs: AnchorTab[];
  /** px offset from top where sticky headers end (scroll target alignment). */
  offset?: number;
  className?: string;
}

/**
 * Sticky sectioned-form nav with scroll-spy. Clicking a tab smooth-scrolls to
 * the matching element id; the active tab tracks the section in view.
 * Business-logic-free — caller renders sections with matching ids.
 */
export function AnchorTabs({ tabs, offset = 120, className }: AnchorTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id);

  const handleClick = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        // scrollIntoView works inside any scroll container (the shell uses an
        // overflow-y-auto <main>, not the window) and honours scroll-margin-top.
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(id);
      }
    },
    [offset],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: 0 },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [tabs, offset]);

  return (
    <nav
      className={cn("flex flex-wrap gap-1", className)}
      role="tablist"
      aria-label="Product sections"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(t.id)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              isActive
                ? { background: "#A86120", color: "white" }
                : { background: "transparent", color: "#635D58" }
            }
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
