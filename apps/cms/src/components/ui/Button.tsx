import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-amber-700 text-white hover:bg-amber-800 focus:ring-amber-400 border-transparent",
  secondary:
    "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus:ring-stone-300",
  ghost:
    "bg-transparent text-stone-600 border-transparent hover:bg-stone-50 hover:text-stone-900 focus:ring-stone-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 border-transparent",
};

const sizes = {
  sm:  "h-7  px-2.5 text-xs  rounded-lg gap-1.5",
  md:  "h-9  px-4   text-sm  rounded-lg gap-2",
  lg:  "h-11 px-5   text-base rounded-xl gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium border transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
