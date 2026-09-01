"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatEpoch, formatCount } from "@/lib/utils";
import type { WorkflowTemplatePreview } from "@/lib/artisanflow-api";
import { GitBranch, MessageSquare, ChevronRight, Plus, Search } from "lucide-react";

export function WorkflowClient({ templates }: { templates: WorkflowTemplatePreview[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredTemplates = q
    ? templates.filter((t) => t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
    : templates;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "#1A1714" }}>Job Templates</h1>
        <p className="mt-1 text-sm" style={{ color: "#847D77" }}>
          {formatCount(templates.length)} reusable production template{templates.length === 1 ? "" : "s"} — stages &amp;
          tasks. Live production jobs live on the{" "}
          <Link href="/artisanflow" className="font-medium hover:underline" style={{ color: "#A86120" }}>
            Production board →
          </Link>
          . A job is started from the ORDER ITEM it is for — open the order and
          use “Start production” on the line.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#AAA39E" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates..."
            className="form-input h-9 w-full pl-9 text-sm"
          />
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            href="/artisanflow/workflow/template/new"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition-shadow hover:shadow-card"
            style={{ borderColor: "#E8E4DE", color: "#A86120" }}
          >
            <Plus className="h-3.5 w-3.5" /> New template
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="group flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3.5 transition-shadow hover:shadow-card"
            style={{ borderColor: "#E8E4DE" }}
          >
            <Link href={`/artisanflow/workflow/template/${t.id}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "#FEF3E2", color: "#A86120" }}>
                  <GitBranch className="h-3.5 w-3.5" />
                </span>
                <p className="truncate text-sm font-semibold" style={{ color: "#1A1714" }}>{t.name}</p>
              </div>
              {t.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "#847D77" }}>{t.description}</p>}
              <p className="mt-1.5 text-[11px]" style={{ color: "#AAA39E" }}>
                {t.productAssociated ? "Product-linked" : "Generic"} · updated {formatEpoch(t.updatedAt)}
              </p>
            </Link>
            <Link href={`/artisanflow/workflow/template/${t.id}`} className="flex-shrink-0">
              <ChevronRight className="mt-1 h-4 w-4" style={{ color: "#AAA39E" }} />
            </Link>
          </div>
        ))}
        {filteredTemplates.length === 0 && <Empty>{q ? "No templates match your search." : "No workflow templates found."}</Empty>}
      </div>

      <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs" style={{ borderColor: "#E8E4DE", color: "#847D77" }}>
        <MessageSquare className="h-3.5 w-3.5" style={{ color: "#6D28D9" }} />
        Workflow feedback (PENDING / APPROVED / REJECTED) is reviewed on the
        <Link href="/artisanflow/workflow/feedback" className="ml-1 font-medium hover:underline" style={{ color: "#6D28D9" }}>
          Feedback queue →
        </Link>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border py-10 text-center text-sm" style={{ background: "#FAF9F7", borderColor: "#E8E4DE", color: "#AAA39E" }}>
      {children}
    </div>
  );
}
