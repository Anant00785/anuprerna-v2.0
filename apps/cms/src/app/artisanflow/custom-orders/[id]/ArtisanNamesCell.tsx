"use client";

/**
 * ArtisanNamesCell — the ARTISAN column's contents on the custom-order detail
 * table. Names, not the word "Assigned".
 *
 * Amit, 2026-08-17: the column rendered the literal string "Assigned" on every
 * row, which answers "is someone on it" but never "who". The roster behind this
 * is built in lib/order-artisan-roster.ts (three assignment levels, names off
 * artisan.tenant.name).
 *
 * ── THE THREE STATES ARE DELIBERATELY DIFFERENT ────────────────────────────
 * The brief is explicit that a fallback must never be mistakable for a
 * resolved name, so each state gets its own visual weight:
 *
 *   named        stone-dark text, the name itself          "Ananda Singha"
 *   assigned but an amber-bordered id chip, NOT plain text  "Artisan #51657368"
 *     unnamed    — reads as a data gap, because it is one
 *   none         quiet neutral em-dash                      "—"
 *   no job yet   quiet neutral em-dash (assigned === null)   "—"
 *   job, nobody  the existing amber "Unassigned" pill       "Unassigned"
 *
 * Two names show inline; the rest collapse to a "+N" control that EXPANDS in
 * place (click) as well as carrying the full list in its title. Hover alone was
 * rejected: it is unreachable on the 390px layout this page is checked at.
 */

import React, { useState } from "react";
import { UserX, Users } from "lucide-react";
import type { RosterArtisan } from "@/lib/order-artisan-roster";
import { levelLabel } from "@/lib/order-artisan-roster";

const INLINE = 2;

/** "Ananda Singha (job)" / "Artisan #123 (task: Kantha stitch)" — the tooltip
 *  and expanded forms, where there is room to say where the row lives. */
function describe(a: RosterArtisan): string {
  const who = a.name ?? `Artisan #${a.artisanId}`;
  const lv = a.levels.map(levelLabel).join("/");
  const where = a.where.length ? `: ${a.where.join(", ")}` : "";
  return `${who} (${lv}${where})`;
}

export function ArtisanNamesCell({
  roster,
  assigned,
}: {
  /** Distinct artisans on this line's job. Empty when none resolved. */
  roster: RosterArtisan[];
  /** The production model's own flag: null = no job yet, false = job with
   *  nobody on it. Only consulted when the roster is empty, so a real name
   *  always wins over a stale boolean. */
  assigned: boolean | null;
}) {
  const [open, setOpen] = useState(false);

  if (roster.length === 0) {
    // No NAMES. Fall back to the flag — and keep its three meanings distinct.
    if (assigned == null) return <span className="text-xs" style={{ color: "#AAA39E" }}>—</span>;
    if (assigned === false) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ background: "#FEF3C7", color: "#92400E" }}
        >
          <UserX className="h-3 w-3" /> Unassigned
        </span>
      );
    }
    // assigned === true but no mapping row resolved to a name. Say exactly
    // that rather than printing a confident "Assigned" over missing data.
    return (
      <span
        className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium"
        style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}
        title="The job is flagged as assigned, but no artisan mapping row resolves to a name. Assignment mirrors lag the rest of the sync."
      >
        Assigned · name not synced
      </span>
    );
  }

  const shown = open ? roster : roster.slice(0, INLINE);
  const hidden = roster.length - shown.length;
  const fullList = roster.map(describe).join("\n");

  return (
    <div className="flex max-w-[210px] min-w-0 flex-col gap-0.5">
      {shown.map((a) => (
        <span
          key={a.artisanId}
          className="truncate text-xs"
          style={{ color: a.name ? "#1A1714" : "#92400E" }}
          title={describe(a)}
        >
          {a.name ?? (
            <span
              className="rounded border px-1 py-0.5 text-[10px] font-medium"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
            >
              Artisan #{a.artisanId}
            </span>
          )}
        </span>
      ))}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={fullList}
          className="inline-flex w-fit items-center gap-1 rounded px-1 py-0.5 text-[10px] font-semibold"
          style={{ background: "#F3F1ED", color: "#635D58" }}
        >
          <Users className="h-3 w-3" /> +{hidden} more
        </button>
      )}

      {open && roster.length > INLINE && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-fit text-[10px] font-medium underline"
          style={{ color: "#847D77" }}
        >
          show fewer
        </button>
      )}
    </div>
  );
}
