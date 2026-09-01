import React from "react";
import { Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import type { Detail, Stage } from "./stages";
import { stageDays } from "./stages";

/**
 * One capture field: `key: datatype, valuetype`, exactly as live prints it.
 *
 * The metadata is not decoration. `valuetype` is one of required / optional /
 * deferred, and DEFERRED means the field does not block completing its task —
 * printing the key alone loses the only signal that says whether an operator is
 * stuck waiting on it. Deferred is tinted so it reads at a glance; a field with
 * no metadata (one a human just typed in the builder) prints as a bare label
 * rather than inventing a type for it.
 */
function DetailChip({ detail: d }: { detail: Detail }) {
  const meta = [d.datatype, d.valuetype].filter(Boolean).join(", ");
  const deferred = (d.valuetype || "").toLowerCase() === "deferred";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
      style={
        deferred
          ? { background: "#FFFBEB", border: "1px solid #FCD34D", color: "#78350F" }
          : { background: "#FAF9F7", border: "1px solid #E8E4DE", color: "#635D58" }
      }
      title={deferred ? "Deferred — captured later; does not block completing this task" : undefined}
    >
      {d.label || "Detail"}
      {meta && (
        <span className="font-normal" style={{ color: deferred ? "#B45309" : "#AAA39E" }}>
          : {meta}
        </span>
      )}
    </span>
  );
}

/**
 * Read-only STAGE card -- one per production phase. A named stage, its tasks
 * (name . Nd . optional approval), the details to capture (as chips), and the
 * auto rolled-up time + optional cost. Pure render -> SSR-deterministic.
 * Palette: number chip amber, approval purple.
 */
export function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const days = stageDays(stage);
  const hasCost = typeof stage.cost === "number" && stage.cost > 0;
  const overridden = stage.daysOverride != null;
  return (
    <div className="flex gap-3">
      {/* Numbered chip */}
      <span
        className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{ background: "#FEF3E2", color: "#A86120" }}
      >
        {index + 1}
      </span>

      <div
        className="min-w-0 flex-1 rounded-xl border bg-white"
        style={{ borderColor: "#E8E4DE", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="px-4 py-3.5">
          {/* Title */}
          <p className="text-[15px] font-semibold leading-snug" style={{ color: "#1A1714" }}>
            <span style={{ color: "#A86120" }}>Stage {index + 1}</span>
            <span className="mx-1.5" style={{ color: "#D8D3CC" }}>.</span>
            {stage.name || "Untitled stage"}
          </p>

          {/* Time + optional cost */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]" style={{ color: "#635D58" }}>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" style={{ color: "#847D77" }} />
              <span className="font-semibold" style={{ color: "#1A1714" }}>{days}</span> days
              {overridden && <span style={{ color: "#AAA39E" }}>(set by hand)</span>}
            </span>
            {hasCost && (
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" style={{ color: "#847D77" }} />
                <span className="font-semibold" style={{ color: "#1A1714" }}>{stage.cost!.toLocaleString("en-IN")}</span>
              </span>
            )}
          </div>

          {/* Tasks */}
          {stage.tasks.length > 0 && (
            <div className="mt-3 border-t pt-2.5" style={{ borderColor: "#F3F1ED" }}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
                Tasks
              </p>
              <ul className="flex flex-col gap-1">
                {stage.tasks.map((t) => (
                  <li key={t.id} className="text-[13px]" style={{ color: "#4A4540" }}>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "#D8D3CC" }} />
                      <span className="min-w-0 flex-1 truncate">{t.name || "Untitled task"}</span>
                      <span className="flex-shrink-0 text-[11px]" style={{ color: "#847D77" }}>{t.days}d</span>
                      {t.needsApproval && (
                        <span
                          className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "#F5F3FF", color: "#6D28D9" }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" /> approval
                        </span>
                      )}
                    </div>
                    {/* TASK-level capture fields. Live hangs these off the
                        individual node, and reading only the stage level made
                        them vanish — Stage 3 of template 490267 showed nothing
                        at all while live printed "Comments on the Quality:
                        string, deferred" on QC Fabric. Indented under the task
                        so it is unambiguous WHICH task must capture it. */}
                    {(t.details || []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5 pl-3.5">
                        {t.details!.map((d) => (
                          <DetailChip key={d.id} detail={d} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details to capture -> chips */}
          {stage.details.length > 0 && (
            <div className="mt-3 border-t pt-2.5" style={{ borderColor: "#F3F1ED" }}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA39E" }}>
                Details to capture
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stage.details.map((d) => (
                  <DetailChip key={d.id} detail={d} />
                ))}
              </div>
            </div>
          )}

          {/* Optional maker note */}
          {stage.note && stage.note.trim() && (
            <p className="mt-3 border-t pt-2.5 text-[13px] leading-snug" style={{ borderColor: "#F3F1ED", color: "#847D77" }}>
              {stage.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
