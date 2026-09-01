"use client";

import React from "react";

/**
 * TabBar — the single tab-bar primitive, replacing four hand-rolled tab bars.
 *
 * Two visual variants, matching the sandbox exactly (no visual change):
 *   • "underline" — border-bottom active indicator (WhatsApp view/filter,
 *                    Logistics, Wholesale main/sub).
 *   • "pill"      — rounded chips. pillStyle "soft" = peach fill + border
 *                    (WhatsApp class filter, Wholesale eligible mode);
 *                    pillStyle "solid" = solid orange fill (Impact order type).
 *
 * Proper ARIA: role=tablist on the container, role=tab + aria-selected on each
 * button. Optional count badge and leading icon.
 *
 * Palette (unchanged): #A86120 active, #847D77 inactive, #E8E4DE borders,
 * #FEF3E2 soft-active fill.
 */
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pill";
  /** Only for variant="pill". */
  pillStyle?: "soft" | "solid";
  /** Font weight of the tab label. */
  weight?: "medium" | "semibold";
  ariaLabel?: string;
}

export function TabBar({
  tabs,
  active,
  onChange,
  variant = "underline",
  pillStyle = "soft",
  weight = "medium",
  ariaLabel,
}: TabBarProps) {
  const weightClass = weight === "semibold" ? "font-semibold" : "font-medium";

  const containerClass =
    variant === "underline"
      ? "flex flex-wrap gap-1 border-b"
      : pillStyle === "solid"
        ? "flex gap-1"
        : "flex flex-wrap gap-1";
  const containerStyle: React.CSSProperties =
    variant === "underline" ? { borderColor: "#E8E4DE" } : {};

  return (
    <div role="tablist" aria-label={ariaLabel} className={containerClass} style={containerStyle}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        const Icon = t.icon;

        let btnClass: string;
        let btnStyle: React.CSSProperties;

        if (variant === "underline") {
          btnClass =
            "flex items-center gap-2 px-4 py-2.5 text-sm " +
            weightClass +
            " transition-colors -mb-px border-b-2";
          btnStyle = {
            color: isActive ? "#A86120" : "#847D77",
            borderColor: isActive ? "#A86120" : "transparent",
          };
        } else if (pillStyle === "solid") {
          btnClass = "rounded-lg px-4 py-2 text-sm " + weightClass + " transition-colors";
          btnStyle = isActive
            ? { background: "#A86120", color: "#FFFFFF" }
            : { background: "transparent", color: "#635D58" };
        } else {
          btnClass =
            "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm " +
            weightClass +
            " transition-colors border";
          btnStyle = {
            color: isActive ? "#A86120" : "#847D77",
            borderColor: isActive ? "#A86120" : "#E8E4DE",
            background: isActive ? "#FEF3E2" : "#FFFFFF",
          };
        }

        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={btnClass}
            style={btnStyle}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {t.count != null && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={
                  variant === "pill"
                    ? {
                        background: isActive ? "#FFFFFF" : "#F3F1ED",
                        color: isActive ? "#A86120" : "#847D77",
                      }
                    : {
                        background: isActive ? "#FEF3E2" : "#F3F1ED",
                        color: isActive ? "#A86120" : "#847D77",
                      }
                }
              >
                {t.count.toLocaleString("en-IN")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
