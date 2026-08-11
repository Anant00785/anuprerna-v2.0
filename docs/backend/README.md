# docs/backend — Core Commerce migration analysis

Authored 2026-07-25, ahead of the backend migration. Merged into the mainline docs set on 2026-08-12.

## Read these as two different kinds of document

| File | Kind | Still accurate? |
|---|---|---|
| `commerce/01-module-analysis.md` | **Reference.** What the legacy Java commerce domain does, read directly from `loom-c90d2c23…` source. | Yes. Describes the legacy system, which has not changed. |
| `commerce/02-api-documentation.md` | **Reference.** Every legacy commerce route with its auth code, handler, DTO, validation rules and DB tables — verified against `*Controller.java` / `RequestMapper.java`. | Yes, and it is the most precise endpoint documentation in the repo. Use it when reimplementing or verifying a commerce endpoint. |
| `commerce/03-nextjs-migration-design.md` | **Planning.** Proposed folder structure and design for the NestJS migration. | Partly superseded. Written before the backend was built. The delivered structure differs — see `docs/MODULE-MAP.md` for what `apps/api` actually looks like today. |
| `commerce/04-migration-checklist.md` | **Planning.** Per-endpoint checklist, every item marked "Not started". | **Status marks are stale.** 21 items are marked not-started; the commerce module has since been built (116 controllers). The *testing checklists* in the right-hand column are still valuable and largely unaddressed — `apps/api` has 2 test files. |
| `commerce/05-implementation-order.md` | **Planning.** Sequenced task breakdown. | Historical. The work was done in a different order. |

## Why the planning documents were kept

They record the reasoning, the source-verified behaviour, and the open questions flagged for a team
decision — for example whether an unfiltered `limit` in the catalog listing is a bug to fix or a
behaviour to preserve, and long-poll versus SSE for the catalog PDF wait endpoints. Those questions
are still open and are not captured anywhere else. Deleting the documents would lose them.

The per-endpoint **testing checklists** in `04-migration-checklist.md` are the most immediately useful
part: they describe, endpoint by endpoint, what a correct implementation must be tested for. Given
`apps/api` currently ships 2 test files for roughly 42,700 lines, that column is close to a ready-made
test backlog.

## Where to go for current state

- What `apps/api` actually contains today: `docs/MODULE-MAP.md`
- What the frontends actually call: `docs/ENDPOINT-INVENTORY.md`
- What is not done: `docs/KNOWN-GAPS.md`
