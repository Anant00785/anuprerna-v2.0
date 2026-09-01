# ArtisanFlow — repeatable test suite (from live-source parity audit, 2026-08-16)

Live reference source: `anuprerna-rebuild/live-weave-ref/src/app/`. Live URLs on `weave.bloomscorp.com`.
Category: UI = renders correctly / matches live; FN = actually works when driven.
Run every case at **1440, 1600 and 390**. A case that was never DRIVEN is a MISS, not a pass.

## A. Workflow template — `/artisanflow/workflow/template/:id` (live `/manage-workflow/template/view/:id`)

| ID | Element | Cat | Action / Check | Expected (live + source ref) | Sev |
|---|---|---|---|---|---|
| T-01 | Stage count | UI | Load 490267 | 3 stages | blocker |
| T-02 | Stage names | UI | Read | Yarn Processing, Yarn Weaving, Fabric Finishing — `manage-process-details.component.html:10` | blocker |
| T-03 | Sub-process names | UI | Read each stage | YP: Yarn Processing, Processed Yarn QC / YW: Fabric Initial Sample, Complete Production / FF: Washing, QC Fabric | blocker |
| T-04 | Total time | UI | Read | 76 days = 20+50+6; must equal the sum of stage days | major |
| T-05 | Sub-process capture props | UI | Inspect Stage 3 / QC Fabric | "Comments on the Quality: string, deferred" must appear, attached to the TASK not the stage — live `.html:59` | major |
| T-06 | Property datatype/valuetype | UI | Read any chip | Renders `{key}: {datatype}, {valuetype}`; `deferred` must be distinguishable | major |
| T-07 | Sub-process ordering | FN | Compare order vs live | Link-chain walk on `nextSubProcessId`; orphans dropped — `.ts:50-66` | major |
| T-08 | Deleted steps | FN | Template with a soft-deleted step | Filtered out — `.ts:33` | major |
| T-09 | Delete button | FN | Click it | Must open a confirm, or persist, or show an explicit refusal. Must not be inert. Live has NO delete on this page | major |
| T-10 | Edit template | FN | Click | Navigates to the edit route | major |
| T-11 | Empty template | UI | Load a template with 0 steps | Explicit empty state (live renders a blank canvas — improve, don't copy) | minor |

## B. Workflow instance — `/artisanflow/workflow/instance/:id` (live `/manage-workflow/custom-process/view/:id`)

| ID | Element | Cat | Action / Check | Expected | Sev |
|---|---|---|---|---|---|
| I-01 | Status columns | UI | Load 133044983 | Exactly TO DO / IN PROGRESS / DONE | blocker |
| I-02 | Completed-stage dominance | FN | Measure card x vs column x | Every card of a COMPLETED stage sits in Done — `workflow-ops.columnForCard` | blocker |
| I-03 | Unknown status | FN | Force a HALTED node | Card prints "HALTED" verbatim, never relabelled "To do" — `workflow-ops.statusLabel` | blocker |
| I-04 | Progress % | FN | Recompute by hand | done_tasks/total_tasks; 133044983 = 3/8 = 38% | blocker |
| I-05 | Stage roll-up counts | UI | Read | "1/4 stages done · 1 in progress" must agree with the schedule table's stage list | major |
| I-06 | Artisan names | UI | Load 114027735 | 4 distinct: Anuprerna Fabric, Anuprerna Garments, Gautam Das, Kartick Das, each labelled Job/Task level | major |
| I-07 | Artisan staleness | UI | Read | Mirror-sync dates stated in-UI; must not imply completeness | blocker |
| I-08 | Base Pay per artisan | UI | Read | `basePay` shown per row (live: "Base Pay / m") | major |
| I-09 | Base-pay conflict | FN | Artisan with 2 rates across levels | Warn — live blocks the save; silent conflict = never paid (`util/base-pay-consistency.ts`) | major |
| I-10 | End dates | UI | Compare header vs schedule card | One end date, or the schedule labelled a simulator. Live: 11-09-2026 | major |
| I-11 | Avg hours/metre | UI | Read | 133044983 = 2, 114027735 = 8 | major |
| I-12 | Overdue badge | FN | Node past its estimate | Badge + reason string — `.ts:609-629` | major |
| I-13 | Mark done | FN | **Drive on a disposable record** | Either persists or shows an explicit refusal. Currently UNVERIFIED | blocker |
| I-14 | Write refusal | UI | Live-synced job | "sandbox-only write: refusing to edit..." visible on every write surface | blocker |
| I-15 | Payment-ready banner | UI | COMPLETED workflow | Live shows a green banner + View Payment Ledger | major |
| I-16 | Feedback view | FN | Node with feedback | Text + images render from CDN | major |
| I-17 | Note | FN | Workflow with a note | Note visible; live tints the button amber | major |

## C. Jobs list — `/artisanflow/jobs` (live `/manage-workflow/custom-process`)

| ID | Element | Cat | Action / Check | Expected | Sev |
|---|---|---|---|---|---|
| J-01 | Counts | UI | Load | Order jobs 1,316 / Custom-order 1,138 / Overdue 213 | blocker |
| J-02 | Status filters | FN | Click each of All/Created/In progress/Halted/Completed | List re-filters; count line updates | blocker |
| J-03 | Halted filter | FN | Click Halted | "Showing 0 order jobs" while data has none — must not error or show everything | major |
| J-04 | Order vs custom toggle | FN | Click both | Two distinct populations | blocker |
| J-05 | Search | FN | Type a job #, name, SKU | Filters correctly; live has no search at all | major |
| J-06 | Row -> instance | FN | Click a row | Opens the right workflow | blocker |
| J-07 | Overdue badge | UI | Read | Matches `hasOverdueSubProcess && status != COMPLETED` | major |
| J-08 | Empty result | UI | Filter to zero | Explicit empty state, not a blank pane | major |
| J-09 | Long list | FN | Scroll to end | No jank/truncation; live renders the whole bucket unpaginated | minor |

## D. Custom order — `/artisanflow/custom-orders/:id` (live `/logistic/custom-order/view/:id`)

| ID | Element | Cat | Action / Check | Expected | Sev |
|---|---|---|---|---|---|
| O-01 | One production table | UI | Count tables/cards | Exactly 1; no duplicate Items card | blocker |
| O-02 | Columns | UI | Read headers | ITEM, PRICE, ARTISAN, ORDERED, READY, DISPATCHED, WORKFLOW, STAGES, actions | blocker |
| O-03 | **All columns visible** | UI | Measure at 1440/1600 | No column clipped; `scrollWidth <= clientWidth` on the table wrapper | blocker |
| O-04 | Row actions reachable | FN | Click Open job / edit / delete without horizontal scrolling | All clickable | blocker |
| O-05 | Freshness banner | UI | Read | States ready-to and dispatch-to dates + staleness | blocker |
| O-06 | Ready/dispatch history | FN | Expand a disclosure | Per-record qty + date + courier + tracking + package id | blocker |
| O-07 | History values | FN | Verify 2 records | 50 METER on 6 Jul 2026; 50 METER on 13 Jul 2026 | blocker |
| O-08 | Item id on chips | UI | Read | "Custom Order Item #<id>" as live does | major |
| O-09 | Per-item workflow note | UI | KMD3000026 | Amber note "Aug 13 : Mariam will dispatch the Kantha fabric within 4-5 days" | major |
| O-10 | Global note | UI | Read | Order-level note card present | major |
| O-11 | Pricing | UI | Compare to live | Subtotal 17,65,426.47 / shipping 17,499.53 / adjusted 17,82,926.00, en-IN grouping | blocker |
| O-12 | Impact dashboard | UI | Scroll to bottom | 8 metric cards + 15-col item impact table + skipped list + Recalculate | major |
| O-13 | Workflow % per row | FN | Compare to instance page | Same % for the same job | major |
| O-14 | Stage chips | UI | Read | One chip per stage, current stage emphasised | major |
| O-15 | Totals vs rows | FN | Sum ORDERED/READY/DISPATCHED | Must equal the header 1,496.00 / 585.00 / 100.00 METER | blocker |
| O-16 | Fully-dispatched order | UI | **Different order variant** | Renders correctly; live moves it to Full Shipments | major |
| O-17 | Order with no workflow | UI | **Different order variant** | No workflow block; live offers Start | major |
| O-18 | Cancelled order | UI | **Different order variant** | Cancellation reason shown | major |

## E. Cross-cutting

| ID | Element | Cat | Action / Check | Expected | Sev |
|---|---|---|---|---|---|
| X-01 | Mobile shell | UI | Every screen at 390 | Sidebar collapses to an icon rail; content readable; live collapses at 390 | blocker |
| X-02 | Page-level overflow | UI | Every screen, all widths | `document.scrollWidth <= innerWidth` | blocker |
| X-03 | Nested overflow | UI | Every screen | No element clipped without a visible scroll affordance | blocker |
| X-04 | Console | FN | Every screen | Zero errors | major |
| X-05 | Read-only banner | UI | Every screen | DRAFT banner names what is intentionally absent | major |
| X-06 | Dead controls | FN | Click EVERY rendered control | Each acts, or explains its refusal. None inert | blocker |
| X-07 | Artisan Payments | FN | Navigate | Live tile with no rebuild equivalent — scope or state the absence | major |
