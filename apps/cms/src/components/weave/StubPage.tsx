import React from "react";
import { WeaveShell } from "./WeaveShell";
import { Hammer } from "lucide-react";

interface StubPageProps {
  title: string;
  section?: string;
}

/**
 * Placeholder page rendered for nav routes not yet built.
 * Keeps the sidebar fully navigable with zero 404s.
 * Business-logic-free — just shows the shell + a consistent "coming soon" card.
 */
export function StubPage({ title, section }: StubPageProps) {
  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      {section && <><span>{section}</span><span>/</span></>}
      <span className="font-medium" style={{ color: "#1A1714" }}>{title}</span>
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>
            {title}
          </h1>
        </div>

        <div
          className="flex flex-col items-center gap-4 rounded-2xl border py-16 text-center"
          style={{ background: "#FAF9F7", borderColor: "#E8E4DE" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "#FEF3E2" }}
          >
            <Hammer className="h-5 w-5" style={{ color: "#A86120" }} />
          </div>
          <div>
            <p className="font-serif text-lg font-medium" style={{ color: "#1A1714" }}>
              {title} — coming soon
            </p>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              This section is under construction and will be available in a future release.
            </p>
          </div>
        </div>
      </div>
    </WeaveShell>
  );
}
