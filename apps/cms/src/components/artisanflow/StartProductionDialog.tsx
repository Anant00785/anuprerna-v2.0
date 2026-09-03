"use client";

/**
 * StartProductionDialog — "Start production" trigger on an ORDER or CUSTOM
 * ORDER item row, and since 2026-08-16 the ONLY way to start a job.
 *
 * Live Weave triggers production PER ORDER-ITEM: a play control on the line,
 * shown only while that line has no job, carrying its orderItemId (and its
 * quantity, so the review screen knows how big the run is). The rebuild had
 * also grown a standalone picker on the Job Templates page that asked for an
 * order and then a product — a second route to the same outcome, and a worse
 * one: it could only offer lines whose product it could match back to the
 * catalogue by SKU/name, so an unmatched line was simply unstartable there.
 * That picker is gone; this trigger is the entry point.
 *
 * The dialog collects template/name/description/estimated start date — order,
 * product and quantity are fixed by the row it was opened from and shown
 * read-only. "Review Job" hands off to /artisanflow/workflow/start/configure,
 * the TemplateBuilder job-mode view where stages are reviewed and the job is
 * actually created; that page routes INTO the new job's instance view.
 *
 * Used from four item-row surfaces: the Order detail page and its list inline
 * expand, the Custom Order detail page, and the Order Watch per-SKU table.
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Play, X } from "lucide-react";
import { Button, FormField, SearchSelect, type SearchSelectOption } from "@/components/ui";

export interface ProductionItemContext {
  kind: "order" | "custom-order";
  orderId: number;
  orderItemId: number;
  productId?: number;
  productName: string;
  productSku?: string;
  /** Quantity ordered on THIS line, and its unit. Carried with orderItemId so
   *  the review screen shows how much this run is actually for -- production is
   *  triggered per order-item, and "how many" is half of what an order-item is. */
  quantity?: number;
  unit?: string;
  orderLabel: string;
}

function todayInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function StartProductionDialog({ item }: { item: ProductionItemContext }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<SearchSelectOption[] | null>(null);
  const [template, setTemplate] = useState<SearchSelectOption | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayInput());

  useEffect(() => {
    if (!open || templates) return;
    fetch("/artisanflow/api/templates")
      .then((r) => r.json())
      .then((j) => {
        const rows: Array<{ id: number; name: string; description: string }> = Array.isArray(j?.templates) ? j.templates : [];
        setTemplates(rows.map((t) => ({ id: t.id, label: t.name, sublabel: t.description || undefined })));
      })
      .catch(() => setTemplates([]));
  }, [open, templates]);

  function openDialog() {
    setTemplate(null);
    setName("");
    setDescription("");
    setStartDate(todayInput());
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function onTemplateChange(opt: SearchSelectOption | null) {
    setTemplate(opt);
    if (opt && !name.trim()) setName(`${opt.label} — ${item.orderLabel}`);
  }

  function goToConfigure() {
    if (!template || !name.trim()) return;
    const params = new URLSearchParams({
      templateId: String(template.id),
      name: name.trim(),
      productName: item.productName,
      orderId: String(item.orderId),
      orderItemId: String(item.orderItemId),
      orderLabel: item.orderLabel,
      orderKind: item.kind,
    });
    if (item.quantity != null && Number.isFinite(item.quantity)) params.set("quantity", String(item.quantity));
    if (item.unit) params.set("unit", item.unit);
    if (item.productId) params.set("productId", String(item.productId));
    if (description.trim()) params.set("description", description.trim());
    if (startDate) params.set("estimatedStartDate", startDate);
    router.push(`/artisanflow/workflow/start/configure?${params.toString()}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:shadow-card"
        style={{ borderColor: "#E8E4DE", background: "white", color: "#A86120" }}
      >
        <Play className="h-3.5 w-3.5" /> Start production
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <div
            className="relative flex w-full max-w-sm flex-col rounded-xl border bg-white shadow-2xl"
            style={{ borderColor: "#E8E4DE", maxHeight: "85vh" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-2">
              <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
                Start production
              </h3>
              <button type="button" onClick={close} style={{ color: "#AAA39E" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto px-5 py-2">
              <FormField label="Template" required>
                <SearchSelect
                  value={template}
                  onChange={onTemplateChange}
                  options={templates ?? []}
                  placeholder={templates ? "Search templates…" : "Loading templates…"}
                />
              </FormField>
              <FormField label="Job name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Job name"
                  className="form-input h-9 text-sm"
                />
              </FormField>
              <FormField label="Job description (optional)">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything worth noting about this run…"
                  className="form-input h-9 text-sm"
                />
              </FormField>
              <FormField label="Estimated start date">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input h-9 text-sm"
                />
              </FormField>
              <FormField label="Order">
                <div className="form-input flex h-9 items-center text-sm" style={{ color: "#847D77", background: "#FAF9F7" }}>
                  {item.orderLabel}
                </div>
              </FormField>
              <FormField label="Product">
                <div className="form-input flex h-9 items-center truncate text-sm" style={{ color: "#847D77", background: "#FAF9F7" }}>
                  {item.productSku ? <span className="font-mono">{item.productSku}</span> : item.productName}
                </div>
              </FormField>
              {item.quantity != null && (
                <FormField label="Quantity on this line">
                  <div className="form-input flex h-9 items-center text-sm" style={{ color: "#847D77", background: "#FAF9F7" }}>
                    {item.quantity} {item.unit || ""}
                  </div>
                </FormField>
              )}
              <p className="text-[11px]" style={{ color: "#AAA39E" }}>
                Next, review the stages inherited from the template — day counts and steps can be tweaked before it&apos;s created.
              </p>
            </div>

            <div className="mt-auto flex items-center justify-end gap-3 border-t px-5 py-3" style={{ borderColor: "#E8E4DE" }}>
              <Button variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={goToConfigure} disabled={!template || !name.trim()}>
                {templates === null ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Review Job
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
