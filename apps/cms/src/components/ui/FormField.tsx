import React from "react";
import { cn } from "@/lib/utils";

// ── FormField ─────────────────────────────────────────────────────────────

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Stable selector hook for the parity harness (renders data-field=...). */
  dataField?: string;
  /** Optional right-aligned counter / adornment shown next to the label. */
  adornment?: React.ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
  dataField,
  adornment,
}: FormFieldProps) {
  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      data-field={dataField}
    >
      {(label || adornment) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-sm font-medium" style={{ color: "#4A4540" }}>
              {label}
              {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
          )}
          {adornment && <span className="text-xs" style={{ color: "#847D77" }}>{adornment}</span>}
        </div>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs" style={{ color: "#847D77" }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

// ── TextInput ─────────────────────────────────────────────────────────────

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function TextInput({ error, className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "form-input",
        error && "border-red-400 focus:border-red-400",
        className,
      )}
      {...props}
    />
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "form-input resize-none",
        error && "border-red-400 focus:border-red-400",
        className,
      )}
      {...props}
    />
  );
}

// ── Select ──────────────────────────────────────────────────────────────
// Styled native <select>. Business-logic-free: caller supplies options.

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export function Select({
  options,
  placeholder,
  error,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        "form-input bg-white",
        error && "border-red-400 focus:border-red-400",
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
