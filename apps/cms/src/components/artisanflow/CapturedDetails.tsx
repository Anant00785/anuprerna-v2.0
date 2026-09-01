"use client";

/**
 * CapturedDetails — the details a stage or a task was asked to capture, and the
 * VALUES actually recorded against them, rendered where the work is.
 *
 * Amit, 2026-08-17, comparing the job board against live Weave: live shows
 * "Properties: Warp Yarn Color & Shade: Ecru, Weft Yarn Color & Shade: Ecru" on
 * hover and we rendered none of it — "I need to see this data that we added,
 * which is in text or whatever format, so that I can see, visualize, and modify
 * it."
 *
 * This was never a data gap. `properties[]` has always been on the wire for both
 * node levels (measured on job 133044983: Target GSM = 150 on the Yarn
 * Processing STAGE, Warp/Weft Yarn Color & Shade = "Ecru" on its Yarn Processing
 * TASK, and an uncaptured "Comments on the Quality" on Base Fabric QC). What was
 * missing was the api type declaring the field and any component printing it.
 *
 * THREE deliberate rules:
 *
 *   • A detail with NO value is shown as "not captured yet", never as a blank.
 *     That state is the common one and it is the one that needs an action —
 *     "Comments on the Quality" on a QC task is a field waiting for a human.
 *
 *   • WHICH details exist is the TEMPLATE's decision, so this panel never adds
 *     or removes one. It edits values only. Adding a capture field is what the
 *     template builder is for.
 *
 *   • `datatype` picks the input (number vs text) and NOTHING else is offered —
 *     no type dropdown, no required switch. That machinery was deliberately
 *     removed from the builder on 2026-07-02 and is not coming back through a
 *     side door. `datatype`/`valuetype` ride through a save UNTOUCHED, because
 *     rewriting a `deferred` field as `required` silently turns an optional QC
 *     comment into a blocker.
 *
 * Saving goes through the caller (the board owns the one PATCH), because the
 * write is a WHOLE-TREE `steps` payload — see mergePropertiesIntoSteps.
 */

import React, { useEffect, useState } from "react";
import { Lock, Pencil, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";
import type { NodeProperty } from "@/lib/artisanflow-api";
import {
  applyPropertyValue,
  hasPropertyValue,
  isNumericProperty,
  propertyValueText,
  type WriteCapability,
} from "@/lib/workflow-ops";

const INK = "#1A1714";
const MUTED = "#847D77";
const FAINT = "#AAA39E";
const LINE = "#F0EDE8";

export function CapturedDetails({
  properties,
  nodeName,
  capability,
  saving,
  onSave,
  /** "stage" | "task" — only used in the operator-facing wording. */
  level,
}: {
  properties: NodeProperty[] | undefined;
  nodeName: string;
  capability: WriteCapability;
  saving: boolean;
  onSave: (next: NodeProperty[]) => Promise<void>;
  level: "stage" | "task";
}) {
  const stored = React.useMemo(() => properties ?? [], [properties]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NodeProperty[]>(stored);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the draft whenever the stored values change underneath us (a
  // router.refresh() after any save on this board re-renders every card).
  useEffect(() => {
    if (!editing) setDraft(stored);
  }, [stored, editing]);

  // A node the template asked nothing of renders NOTHING. A permanent "no
  // details" line on every card would be noise on the majority of them —
  // measured on 133044983, 3 of 4 stages and 5 of 7 tasks carry no properties.
  if (stored.length === 0) return null;

  const dirty = draft.some((d, i) => {
    const s = stored[i];
    return !s || String(d.value ?? "") !== String(s.value ?? "");
  });
  const capturedCount = stored.filter(hasPropertyValue).length;

  async function save() {
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="border-t pt-1.5" style={{ borderColor: LINE }}>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
          Captured details
          <span className="ml-1 font-normal" style={{ color: FAINT }}>
            {capturedCount}/{stored.length} recorded
          </span>
        </span>
        {!editing &&
          (capability.ok ? (
            <button
              type="button"
              onClick={() => {
                setDraft(stored);
                setError(null);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "#FEF3E2", color: "#A86120" }}
              title={`Edit the values captured against this ${level}`}
            >
              <Pencil className="h-2.5 w-2.5" /> Edit values
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[10px]"
              style={{ color: FAINT }}
              title={capability.reason}
            >
              <Lock className="h-2.5 w-2.5" /> read-only
            </span>
          ))}
      </div>

      {!editing && (
        <dl className="mt-1 flex flex-col gap-0.5">
          {stored.map((p, i) => {
            const v = propertyValueText(p);
            return (
              <div key={`${p.key}-${i}`} className="flex flex-wrap items-baseline gap-x-1.5 text-[10px] leading-snug">
                <dt style={{ color: MUTED }}>{p.key}:</dt>
                {v !== null ? (
                  <dd className="font-semibold" style={{ color: INK }}>
                    {v}
                  </dd>
                ) : (
                  <dd
                    className="italic"
                    style={{ color: FAINT }}
                    title={
                      (p.valuetype || "").toLowerCase() === "deferred"
                        ? "Deferred — this field does not block completing the task"
                        : undefined
                    }
                  >
                    not captured yet
                    {(p.valuetype || "").toLowerCase() === "deferred" ? " · deferred" : ""}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      )}

      {editing && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {draft.map((p, i) => (
            <label key={`${p.key}-${i}`} className="flex flex-col gap-0.5">
              <span className="text-[10px]" style={{ color: MUTED }}>
                {p.key}
                {(p.valuetype || "").toLowerCase() === "deferred" && (
                  <span className="ml-1" style={{ color: FAINT }}>
                    · deferred
                  </span>
                )}
              </span>
              <input
                type={isNumericProperty(p) ? "number" : "text"}
                value={p.value === undefined || p.value === null ? "" : String(p.value)}
                aria-label={`${p.key} for ${nodeName}`}
                placeholder="not captured yet"
                onChange={(e) =>
                  setDraft((cur) => cur.map((x, j) => (j === i ? applyPropertyValue(x, e.target.value) : x)))
                }
                className="rounded border px-2 py-1 text-[11px] outline-none"
                style={{ borderColor: "#E8E4DE", color: INK }}
              />
            </label>
          ))}

          {error && (
            <p className="rounded-md px-2 py-1 text-[10px]" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={save} disabled={!dirty || saving} loading={saving}>
              {saving ? "Saving…" : "Save values"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setDraft(stored);
                setEditing(false);
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-medium hover:underline"
              style={{ color: MUTED }}
            >
              <RotateCcw className="h-2.5 w-2.5" /> Cancel
            </button>
            {saving && <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#A86120" }} />}
          </div>
        </div>
      )}

      {/* The REASON is deliberately NOT repeated here. A job with four stages and
          seven tasks renders this panel eleven times, and printing the full
          refusal in each one turned a 180px stage rail into six lines of the same
          sentence and buried the values underneath it. The board already states
          the refusal ONCE at the top (the same rule the date chips follow), and
          the "read-only" chip carries it verbatim on hover. */}
    </div>
  );
}
