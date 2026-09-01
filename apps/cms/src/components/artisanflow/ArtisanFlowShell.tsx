import React from "react";
import Link from "next/link";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { FlaskConical } from "lucide-react";

/**
 * Shell for every /artisanflow/* page.
 *
 * Wraps the standard WeaveShell but stamps a PROMINENT, distinct DRAFT banner at
 * the top of the content area. This banner is intentionally different from the
 * normal amber "Preview — saving goes live at launch" write-safety badge: it
 * tells Amit this whole module is an un-reviewed ArtisanFlow preview whose
 * money/workflow logic still needs his sign-off.
 *
 * Kept as a thin, self-contained boundary component so the ArtisanFlow module
 * can be extracted into its own app later with minimal coupling.
 */

export function ArtisanFlowDraftBanner() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: "#EEF0FF", border: "1px solid #C7CCF7" }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: "#4F46E5", color: "white" }}
      >
        <FlaskConical className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#312E81" }}>
          DRAFT — Workflow preview, for review
        </p>
        <p className="text-xs" style={{ color: "#4F46E5" }}>
          Production / traceability spine ported from Loom. Read-only — money &amp; job
          logic still needs Amit&apos;s verification before launch.
        </p>
      </div>
    </div>
  );
}

interface ArtisanFlowShellProps {
  /** Trailing crumb label (the page). The "ArtisanFlow" root crumb is added automatically. */
  crumb?: React.ReactNode;
  crumbHref?: string;
  /** Optional middle crumb between ArtisanFlow and the page. */
  parentCrumb?: { label: string; href: string };
  /**
   * Suppress the module-wide DRAFT banner for ONE page.
   *
   * The banner says "Read-only", and that sentence has to stop being printed on a
   * page the moment the page genuinely takes actions — otherwise the screen
   * contradicts itself and the reviewer cannot tell which half is stale. It is an
   * explicit per-page opt-out rather than a default flip: every other
   * /artisanflow/* page IS still a read-only preview and must keep the banner.
   *
   * Opted out so far: /artisanflow/workflow/feedback (approve / reject write
   * through /api/crud).
   */
  hideDraftBanner?: boolean;
  children: React.ReactNode;
}

export function ArtisanFlowShell({ crumb, parentCrumb, hideDraftBanner, children }: ArtisanFlowShellProps) {
  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
      <Link href="/artisanflow" style={{ color: "#847D77" }}>
        Workflow
      </Link>
      {parentCrumb && (
        <>
          <span>/</span>
          <Link href={parentCrumb.href} style={{ color: "#847D77" }}>
            {parentCrumb.label}
          </Link>
        </>
      )}
      {crumb && (
        <>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>
            {crumb}
          </span>
        </>
      )}
    </div>
  );

  return (
    <WeaveShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        {!hideDraftBanner && <ArtisanFlowDraftBanner />}
        {children}
      </div>
    </WeaveShell>
  );
}
