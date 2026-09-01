"use client";

/**
 * FaqDrawer — create/edit drawer for an FAQ group, with inline question
 * add/edit/delete before a single Save.
 *
 * Mirrors live manage-faq.component.ts:faqCRUD() semantics: on Save, the
 * ENTIRE faqQuestionList for the group is sent (add/faq or update/faq) —
 * there is no per-question endpoint. Adding a question = push a draft row;
 * editing = mutate it in local state; deleting = splice it out — all client
 * side until Save fires the single POST/PATCH. Backend's updateFaq REPLACES
 * the whole nested list on every update (fresh ids each time), matching
 * Java's updateExistingFaq behaviour, so omitting a question here really
 * deletes it server-side.
 *
 * Delete-the-whole-group is intentionally NOT offered here — live's own
 * faq-preview-table.component.ts:deleteFaq(index) is an empty no-op and no
 * delete/faq backend route exists (NO-BACKEND, not a parity gap).
 */

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, FormField, TextInput, Textarea } from "@/components/ui";
import type { FaqItem } from "@/lib/content-api";

interface QuestionDraft {
  id?: number;
  question: string;
  answer: string;
}

export interface FaqDrawerProps {
  mode: "create" | "edit";
  /** Required for edit mode. */
  faq?: FaqItem;
  onClose: () => void;
}

export function FaqDrawer({ mode, faq, onClose }: FaqDrawerProps) {
  const router = useRouter();
  const [heading, setHeading] = useState(faq?.heading ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    (faq?.faqQuestionList ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = useCallback(() => {
    setQuestions((qs) => [...qs, { question: "", answer: "" }]);
  }, []);

  const updateQuestion = useCallback(
    (idx: number, patch: Partial<QuestionDraft>) => {
      setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    },
    [],
  );

  const removeQuestion = useCallback((idx: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }, []);

  const doSave = useCallback(async () => {
    if (!heading.trim()) return;
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      heading: heading.trim(),
      faqQuestionList: questions
        .filter((q) => q.question.trim() || q.answer.trim())
        .map((q) => ({ question: q.question, answer: q.answer })),
    };
    if (mode === "edit" && faq) body.id = faq.id;
    try {
      const res = await fetch("/api/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: mode === "create" ? "add/faq" : "update/faq",
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
  }, [heading, questions, mode, faq, onClose, router]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl border-l"
        style={{ borderColor: "#E8E4DE" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3 shrink-0"
          style={{ borderColor: "#E8E4DE" }}
        >
          <h3 className="font-serif text-base font-semibold" style={{ color: "#1A1714" }}>
            {mode === "create" ? "New FAQ Group" : `Edit FAQ #${faq?.id}`}
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
            Saves to the sandbox test DB only (never live).
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <FormField label="FAQ Heading" required>
            <TextInput
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. Shipping &amp; Returns"
              autoFocus
            />
          </FormField>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "#1A1714" }}>
              Questions ({questions.length})
            </span>
            <Button variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 && (
            <p className="text-xs" style={{ color: "#AAA39E" }}>
              No questions yet — click &quot;Add Question&quot; to add one.
            </p>
          )}

          {questions.map((q, idx) => (
            <div
              key={q.id ?? `draft-${idx}`}
              className="rounded-lg border p-3 flex flex-col gap-2"
              style={{ borderColor: "#E8E4DE", background: "#FAF9F7" }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="mt-1.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "#FEF3E2", color: "#A86120" }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 flex flex-col gap-2">
                  <TextInput
                    value={q.question}
                    onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                    placeholder="Question"
                  />
                  <Textarea
                    value={q.answer}
                    onChange={(e) => updateQuestion(idx, { answer: e.target.value })}
                    placeholder="Answer"
                    rows={2}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-md p-1.5 hover:bg-red-50 transition-colors mt-1"
                  style={{ color: "#AAA39E" }}
                  title="Remove question"
                  onClick={() => removeQuestion(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-end gap-3 border-t px-5 py-3 shrink-0"
          style={{ borderColor: "#E8E4DE" }}
        >
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancel
          </Button>
          {error && (
            <span className="text-xs mr-2" style={{ color: "#B91C1C" }}>{error}</span>
          )}
          <Button
            variant="primary"
            onClick={doSave}
            size="sm"
            disabled={saving || !heading.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
