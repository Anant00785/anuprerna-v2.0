import React from "react";

/**
 * ErrorBanner — the single shared "failed to load" banner.
 *
 * Previously duplicated verbatim in LogisticsClient and WholesaleClient. Renders
 * an amber warning strip so a Loom outage is visibly distinct from an empty
 * result set (a data outage must NEVER look like "no records found").
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border px-4 py-3 text-sm"
      style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
    >
      Failed to load: {message}
    </div>
  );
}
