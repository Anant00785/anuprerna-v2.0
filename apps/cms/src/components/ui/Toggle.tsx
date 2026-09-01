"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/** Business-logic-free on/off switch (Material slide-toggle parity). */
export function Toggle({ checked, onChange, label, disabled, className, id }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 select-none",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          background: checked ? "#A86120" : "#D8D3CC",
        }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
      {label && (
        <span className="text-sm" style={{ color: "#4A4540" }}>
          {label}
        </span>
      )}
    </label>
  );
}
