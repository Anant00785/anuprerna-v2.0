"use client";

/**
 * FAQClient — list view for FAQ groups, with create + edit wired to the
 * sandbox backend (Phase 2: content-faqs).
 *
 * Data: all FAQs fetched server-side via getFaqList(); passed as a prop.
 * Search + pagination handled by useClientTable (client-side, no round-trips).
 *
 * Writes: "+ New FAQ" opens FaqDrawer in create mode -> POST /api/crud add/faq.
 * The pencil icon per row opens FaqDrawer in edit mode (pre-filled from the
 * already-fetched row, which carries the full faqQuestionList) -> PATCH
 * /api/crud update/faq. Whole-group delete is intentionally NOT offered —
 * live's own deleteFaq(index) is an empty no-op and no delete/faq backend
 * route exists (NO-BACKEND, not a parity gap).
 *
 * Live reference: live-weave-ref/src/app/manage-faq/
 *   List columns (faq-preview-table.component.html line 6): "FAQ Heading" only.
 *   Extended here with # Questions + Created date for operational visibility.
 */

import React, { useMemo, useCallback, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { WeaveShell } from "@/components/weave/WeaveShell";
import { DataList, DataListColumn, Badge, Button } from "@/components/ui";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useClientTable } from "@/lib/useClientTable";
import { FaqDrawer } from "./FaqDrawer";
import type { FaqItem } from "@/lib/content-api";

// ── Helpers ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

function formatDate(epochMs: number): string {
  if (!epochMs) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(epochMs));
}

// ── Component ─────────────────────────────────────────────────────────────

interface FAQClientProps {
  faqs: FaqItem[];
}

export function FAQClient({ faqs }: FAQClientProps) {
  const searchFields = useCallback(
    (faq: FaqItem) => [faq.heading, String(faq.id)],
    [],
  );

  const table = useClientTable(faqs, { searchFields, pageSize: PAGE_SIZE });

  const [drawer, setDrawer] = useState<{ mode: "create" | "edit"; faq?: FaqItem } | null>(null);

  const columns = useMemo<DataListColumn<FaqItem>[]>(
    () => [
      {
        key: "heading",
        label: "FAQ Heading",
        render: (faq) => (
          <Link
            href={`/content/faqs/${faq.id}`}
            className="font-medium text-sm hover:underline"
            style={{ color: "#1A1714" }}
          >
            {faq.heading || "(no heading)"}
          </Link>
        ),
      },
      {
        key: "questions",
        label: "Questions",
        headerClassName: "text-center",
        cellClassName: "text-center",
        render: (faq) => (
          <Badge variant="stone">{faq.faqQuestionList.length}</Badge>
        ),
      },
      {
        key: "linked",
        label: "Linked to",
        render: (faq) => {
          if (faq.storyContentId) {
            return (
              <Badge variant="blue">
                Story #{faq.storyContentId}
              </Badge>
            );
          }
          if (faq.blogContentId) {
            return (
              <Badge variant="purple">
                Blog #{faq.blogContentId}
              </Badge>
            );
          }
          return <span className="text-xs" style={{ color: "#AAA39E" }}>—</span>;
        },
      },
      {
        key: "created",
        label: "Created",
        render: (faq) => (
          <span className="text-xs" style={{ color: "#847D77" }}>
            {formatDate(faq.timeOfCreation)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "",
        headerClassName: "w-12",
        cellClassName: "text-right",
        render: (faq) => (
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-stone-100 transition-colors"
            style={{ color: "#847D77" }}
            title="Edit FAQ"
            onClick={(e) => {
              e.stopPropagation();
              setDrawer({ mode: "edit", faq });
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <WeaveShell
      breadcrumb={
        <div className="flex items-center gap-2 text-sm" style={{ color: "#847D77" }}>
          <Link href="/content" className="hover:underline">Content</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "#1A1714" }}>FAQs</span>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-serif text-2xl font-semibold"
              style={{ color: "#1A1714" }}
            >
              FAQs
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
              Frequently asked question groups published on the storefront.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setDrawer({ mode: "create" })}>
            + New FAQ
          </Button>
        </div>

        {/* Error state: getFaqList never throws, but an empty result from a
            500/network failure will land here as an empty array. Show the list
            component; DataList's emptyMessage handles zero results gracefully. */}

        {faqs.length === 0 ? (
          <ErrorBanner message="FAQ list returned empty — the backend may be unavailable or no FAQs exist." />
        ) : (
          <DataList
            data={table.paged}
            columns={columns}
            getId={(faq) => String(faq.id)}
            total={table.filtered.length}
            page={table.page}
            pageSize={PAGE_SIZE}
            onPageChange={table.setPage}
            onSearch={table.setSearch}
            searchPlaceholder="Search by heading or id…"
            emptyMessage="No FAQs match your search."
          />
        )}

        {drawer && (
          <FaqDrawer
            mode={drawer.mode}
            faq={drawer.faq}
            onClose={() => setDrawer(null)}
          />
        )}
      </div>
    </WeaveShell>
  );
}
