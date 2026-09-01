"use client";

/**
 * ReviewDialog — create/edit dialog for an admin-authored review.
 *
 * Create: mirrors live's ReviewSubmissionComponent -> POST /add/review with
 * adminAdded:true (manage-review.component.ts:onReviewAdd).
 * Edit: only ever offered for adminAdded reviews (matches live's edit icon
 * visibility rule) -> PATCH /update/super-user/review
 * (review-preview-card.component.ts:onEdit).
 */

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button, FormField, TextInput, Textarea } from "@/components/ui";
import type { ReviewRow } from "@/lib/admin-api";

export interface ReviewDialogProps {
  mode: "create" | "edit";
  /** Required for edit mode. */
  review?: ReviewRow;
  onClose: () => void;
}

interface ReviewForm {
  name: string;
  city: string;
  country: string;
  rating: number;
  description: string;
  link: string;
  productId: string;
  productImages: string;
}

function emptyForm(review?: ReviewRow): ReviewForm {
  return {
    name: review?.reviewer ?? "",
    city: review?.city ?? "",
    country: review?.country ?? "",
    rating: review?.rating ?? 5,
    description: review?.description ?? "",
    link: review?.link ?? "",
    productId: review?.productId != null ? String(review.productId) : "",
    productImages: review?.productImages ?? "",
  };
}

export function ReviewDialog({ mode, review, onClose }: ReviewDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<ReviewForm>(() => emptyForm(review));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ReviewForm>) => setForm((f) => ({ ...f, ...patch }));

  const doSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      city: form.city || undefined,
      country: form.country || undefined,
      rating: form.rating,
      description: form.description,
      link: form.link || undefined,
      productId: form.productId ? Number(form.productId) : undefined,
      productImages: form.productImages || undefined,
      adminAdded: true,
    };
    if (mode === "edit" && review) body.id = review.id;
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: mode === "create" ? "add/review" : "update/super-user/review",
          method: mode === "create" ? "POST" : "PATCH",
          body,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.success === false) {
        throw new Error(j?.message || `Save failed (${res.status})`);
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [form, mode, review, onClose, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border bg-white shadow-2xl"
        style={{ borderColor: "#E8E4DE" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3 shrink-0"
          style={{ borderColor: "#E8E4DE" }}
        >
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
            {mode === "create" ? "Add Review" : `Edit Review #${review?.id}`}
          </h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "#847D77" }}>
            ×
          </button>
        </div>

        <div className="px-5 pt-4 shrink-0">
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ background: "#FFF8F0", borderColor: "#FDE9C5", color: "#8A4C19" }}
          >
            Saves to the sandbox test DB only (never live). Admin-authored review (adminAdded=true).
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <FormField label="Reviewer Name" required>
            <TextInput value={form.name} onChange={(e) => update({ name: e.target.value })} autoFocus />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <TextInput value={form.city} onChange={(e) => update({ city: e.target.value })} />
            </FormField>
            <FormField label="Country">
              <TextInput value={form.country} onChange={(e) => update({ country: e.target.value })} />
            </FormField>
          </div>

          <FormField label="Rating" required>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => update({ rating: i })}
                  className="p-0.5"
                  title={`${i} star${i > 1 ? "s" : ""}`}
                >
                  <Star
                    className="h-5 w-5"
                    style={{ color: i <= form.rating ? "#E0A93C" : "#E8E4DE" }}
                    fill={i <= form.rating ? "#E0A93C" : "none"}
                  />
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Review Text">
            <Textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={4}
            />
          </FormField>

          <FormField label="External Link" hint="Optional URL (e.g. social post) the review references.">
            <TextInput value={form.link} onChange={(e) => update({ link: e.target.value })} placeholder="https://…" />
          </FormField>

          <FormField label="Product ID" hint="Numeric id of the product this review is for.">
            <TextInput
              type="number"
              value={form.productId}
              onChange={(e) => update({ productId: e.target.value })}
              placeholder="e.g. 1042"
            />
          </FormField>

          <FormField
            label="Product Images"
            hint="Comma-separated image URLs (matches Loom's productImages field)."
          >
            <Textarea
              value={form.productImages}
              onChange={(e) => update({ productImages: e.target.value })}
              rows={2}
              placeholder="https://…jpg, https://…jpg"
            />
          </FormField>
        </div>

        <div
          className="flex items-center justify-end gap-3 border-t px-5 py-3 shrink-0"
          style={{ borderColor: "#E8E4DE" }}
        >
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          {error && <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>}
          <Button variant="primary" onClick={doSave} size="sm" disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
