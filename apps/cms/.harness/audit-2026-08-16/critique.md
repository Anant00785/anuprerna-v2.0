# ArtisanFlow vs live Weave — functional audit, 2026-08-16

**Verdict: FAIL** — 2 blockers, 10 major, 4 minor. All seven builder claims PASS on their own terms; the build fails on what nobody claimed.

Judged: sandbox `localhost:3010`, pm2 `weave`, BUILD_ID `8ce5UBx5UAwX2H-DDiehb` built 16:47 UTC, no source newer than the build, tree clean at `d3fdee9`. Reference: `weave.bloomscorp.com` logged in as admin, read-only throughout. Zero console errors on either side.

## What is genuinely solid — say this plainly

All seven claims verified, several by independent reproduction rather than inspection:

- **Template 490267** renders 3 stages / 76 days, and every stage and sub-process name matches live's flowchart exactly (Yarn Processing / Processed Yarn QC, Fabric Initial Sample / Complete Production, Washing / QC Fabric). 20+50+6=76 is internally consistent. Live shows no durations at all, so the day totals are enrichment.
- **38% reproduces from scratch**: 4 stages x 2 tasks = 8; 3 done; 3/8 = 37.5% -> 38%. Not taken off the screen.
- **Column placement verified geometrically**, not by eye: the Done column spans x=1091-1391 and all three completed cards sit at x=1104. The original complaint is fixed, and `workflow-ops.ts` implements stage-dominance as a display rule that refuses to rewrite the underlying row — the right call, and documented.
- **Four artisans on 114027735** by name across job/stage/task levels, where live's own panel shows one.
- **One production table.** No duplicate Items card, no repeated workflow block, all 9 columns present.
- **Ready/dispatch dates and quantities reproduce** (50 METER 6 Jul, 50 METER 13 Jul), carrying courier, tracking link and package id.
- **1,316 order jobs** confirmed on screen.

Three things are better than live and should not be lost: the **data-honesty banner** ("Recorded up to — Ready to 13 Aug 2026 · Dispatch to 13 Jul 2026 (34 days ago) — these quantities are only as fresh as the dates above"), the **artisan staleness disclosure** ("last mirror sync 17 Jul... A name here can lag live"), and the **jobs list search + All + Halted filters** that live simply does not have. On the freshness question the brief raised: the UI does not mislead — it states the exact lag in the place the numbers are read.

On HALTED: the builders' framing was loose but the engineering is right. HALTED is a first-class value in both live enums with its own grey swatch — it has *not* been proven not to exist, only measured absent from today's rows, which I corroborated (the Halted filter returns "Showing 0 order jobs"). `columnForStatus()` routes an unknown status to *In progress* and still prints its true label, explicitly refusing to fold it into "To do". That is the one lie a production board must not tell, and the code does not tell it.

## Blockers

### B-1 — Half the production table cannot be reached on screen
The table lives in a `div.overflow-x-auto` measuring **scrollWidth 1112 / clientWidth 758**. 354px are permanently hidden — and it is **identical at 1440 and 1600**: the extra viewport becomes whitespace, not table. ARTISAN is cut mid-word, WORKFLOW % is cut, and the whole STAGES column plus every row action (Open job / edit / delete) is off-screen, with no visible scrollbar. The content is correct — force-scrolling proves it renders fine — so this is purely a visibility failure that hides the entire point of the change.

The builder's own framing ("the stage-chip strip still needs horizontal scroll at 1600px") understates it: it is not the chip strip, it is the right half of the table including all row actions.

**Fix:** stop making Production share a row with the 390px Pricing rail — put Pricing/Payment/Customer below the table, or collapse the grid to one column under ~1700px. Then the 9 columns fit in ~1150px. If a scroller must survive, give it a persistent scrollbar and a sticky right-hand actions column.

### B-2 — Mobile is unusable, and worse than live
At 390px the 240px sidebar never collapses, leaving ~150px of content. The DRAFT banner renders one word per line, the order title overflows, the jobs stat cards clip mid-number ("1,3", "1,1", "21"). Live collapses to a ~62px icon rail and stacks cleanly — so this is a **regression against the reference**, not merely an unpolished breakpoint. The collapse toggle already exists; it just is not driven by a media query.

**Fix:** auto-collapse the shell to an icon rail (or off-canvas drawer) below ~1024px, then re-test all four screens at 390.

## Major

1. **Impact Dashboard entirely missing** from the order page — live renders 8 metric cards (fabric/CO2/water/artisan hours/women artisan hours/stitching/women stitching/total), a 15-column "Order item impact" table, a skipped-workflows list and a Recalculate button. It is populated on this very order. Porting it also fixes the item-traceability gap below, since that table is where items #132448589 and #132450307 actually appear.
2. **Per-item workflow NOTE dropped.** Live shows "Note: Aug 13 : Mariam will dispatch the Kantha fabric within 4-5 days" on KMD3000026. We render no notes at all (0 occurrences page-wide). That is a dispatch commitment existing nowhere else.
3. **Global Note card missing** — live's order-level running commentary ("July 27: 3 kantha stitch fabric is in production stage...").
4. **Artisan Payments has no screen at all** — a whole live tile: stat tiles, 3 filters, 11-column table with inline rate editing, Approve + delete, approval dialog, and a Settings tab over `artisan-incentive-config`. Also missing: live's green "payment ready for review" banner on every COMPLETED workflow.
5. **Base Pay / m not displayed** on the instance artisan card. This is the money field feeding payment calculation, and live guards it with a cross-level consistency rule that exists precisely to prevent the "shows base pay but is never paid" state.
6. **Two contradictory end dates on one screen** — header PLANNED/PROJECTED 12 Sept 2026, schedule card "Ends 29 Aug 2026", 14 days apart, unlabelled. Live says 11-09-2026. Either reconcile, or label the schedule card as a what-if simulator.
7. **Template capture-properties broken** — live hangs properties off the individual node and prints "Comments on the Quality: string, deferred" on QC Fabric. We attach chips to the *stage*, print the key only, and render **nothing for Stage 3**, so that property disappears. Losing `deferred` loses the signal that the field blocks task completion.
8. **Template Delete does not respond to a click** (locator resolved, 30s timeout — disabled or obscured). Live has no Delete on this page at all. Wire it or remove it. *Not fully diagnosed — needs a follow-up pass.*
9. **Order-level controls absent** (Zoho link, Edit order, confirmation e-mail, partial ready/fulfilment capture, checkboxes). Fine for a read-only preview, but the DRAFT banner should name what is deliberately absent.
10. **Ready/dispatch chips carry record ids, not item ids** — live prints "Custom Order Item #132440552" on every chip; we print #166662493. Add the item id so rows can be reconciled against live by hand.

## Minor
Planned end date off by one day (12 Sept vs 11-09-2026, likely a timezone boundary); dispatch chip renders a placeholder-looking "pkg PACKAGE"; HALTED would land in In progress (documented, honest, zero rows today); the template flowchart is redesigned as a list rather than live's box-and-diamond canvas (defensible, logged as a decision not an oversight).

## Not verified — do not read as passing
Write paths were **not driven**, because clicking them mutates application data and this audit was read-only. Specifically: the pipeline's **"Mark done"**, steps-write behaviour for STANDARD-order jobs, instance delete, and discussion. The artisan and schedule cards do render explicit refusals ("sandbox-only write: refusing to edit a live-synced custom workflow"), so those two are honest; "Mark done" carries only a "Sandbox test DB only" label and needs a follow-up pass on a disposable record to prove it is not a lying control. The feedback screen was skipped per instruction.

## Recommendation
Do not restart anything — the data layer, the status vocabulary and the column logic are sound and in several places better reasoned than live. Fix B-1 and B-2 as layout work (neither requires touching data), then close the four content gaps that lose information a human relies on: impact dashboard, per-item notes, global note, base pay.
