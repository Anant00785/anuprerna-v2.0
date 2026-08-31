# B2C / B2B Buyer-Aware Storefront — Requirements Contract
_Governing spec for the buyer-aware storefront. Every build touching the B2C/B2B experience is judged against this. The contract remembers the rules — not memory, not reminders. A separate evaluator scores each build against it; where a rule is mechanically checkable it is automated; where it is taste, a judge/reviewer scores it._

**Owner:** Amit · **Authored:** 2026-07-12 · **Status legend:** ✅ met · 🟡 partial · 🔴 not met (honestly marked so it can't be quietly skipped) · ⛔ blocked on another lane

---

## The model (decided)
- **Guest = B2C shopping + wholesale INVITATION (not the data).** Anuprerna is B2B-first, so we *promote* the wholesale path to guests (a "log in as a wholesale buyer" CTA) — but the actual bulk DATA (pre-order, volume prices, MOQ) is **gated behind wholesale login**. Guests shop retail freely (add-to-cart, guest checkout). **Login defaults to B2C → totally B2C experience** + an "upgrade to wholesale" option; bulk data unlocks only on upgrade to B2B. Pre-order requires login.
- **B2B ("Business mode") is an opt-in upgrade layer**, not a separate club. It unlocks **features, not prices**.
- **Tiered upgrade:** instant "Business mode" (light business data) unlocks bulk features; a deeper wholesale tier (Partner Program / credit / approval) comes later. The Wholesale Partner Program is *one* path, not the gate.
- **One account, one pipeline**, B2C → B2B upgrade path. Guests default to B2C; on login a user may pick B2C or B2B; any B2C account may upgrade later.

---

## Requirements

| # | Rule | Surface | How it's validated | Status |
|---|------|---------|--------------------|--------|
| C1 | **Same prices in both modes.** B2B never changes a displayed price; it only reveals bulk features. | PDP, PLP, cart | AUTOMATED — render both modes, assert the retail price element is byte-identical | ✅ met (slice 1) |
| C2 | **Bulk DATA = wholesale-login only.** Pre-order / volume-prices / MOQ render for **B2B (logged-in wholesale) ONLY**. Guest + B2C see the *invitation* (guest → "log in as wholesale"; b2c → "upgrade"), never the data. | PDP, PLP | AUTOMATED — bulk data ABSENT for guest+b2c, PRESENT for b2b; wholesale prompt shown to guest+b2c | 🟡 building (correction in flight) |
| C3 | **B2B unlocks bulk features.** Pre-order, volume tiers, MOQ, larger quantities appear in Business mode. | PDP, PLP | AUTOMATED — assert markers present in b2b | ✅ met on PDP; 🔴 PLP pending |
| C4 | **B2C flow stays dead-simple.** A one-time finished-goods buyer reaches add-to-cart/checkout in minimal steps; nothing forced. | Landing, PLP, PDP, cart | JUDGE — reviewer scores "does B2C feel effortless"; + AUTOMATED step-count check where feasible | 🟡 partial |
| C5 | **No forced login for B2C.** Browse → add-to-cart → checkout works as a guest. | Cart, checkout | AUTOMATED — guest reaches checkout without a login wall | 🟡 met (front-end): guest adds + reaches /checkout guest-cart view, no login wall; completing order/payment still 🔴 backend |
| C6 | **Guest cart persists.** A guest's add-to-cart — including made-to-order fabric & product selections — survives a reload/return, kept in the cart table/cache. | Cart (backend) | AUTOMATED — guest adds item → reload → item still present | 🟡 met (client-side): localStorage guest cart survives reload + carries customization; server-side cart-table still ⛔ backend |
| C7 | **Guest cart merges on login.** When a guest later logs in, their guest cart merges into the account cart (nothing lost). | Cart + auth | AUTOMATED — add as guest → login → item present in account cart | ✅ built: mergeGuestCartOnLogin replays guest lines to account cart + clears (verified via mock; rides the live account-cart add path) |
| C8 | **Full catalogue visible to all.** Buyer-type gates *features*, never *product visibility*. Everyone can see fabric + finished. | All | AUTOMATED — same product set both modes | ✅ met |
| C9 | **Entry: guest→B2C default; login→choose B2C/B2B; upgrade later.** | Landing, login | JUDGE + AUTOMATED (default cookie = b2c) | 🟡 partial (default ✅; login-choice + upgrade flow pending) |
| C10 | **Buyer-type persists on the account** once logged in (not just session). Instant-light captures basic business data. | Auth/account | AUTOMATED once auth lands | 🔴 not met ⛔ (no buyer-type field on account; native auth flag-gated) |
| C11 | **B2B/B2C/guest are all testable.** | — | MANUAL — the buyer-mode toggle + a guest session must exercise all three | 🟡 partial (toggle ✅ for guest/B2C/B2B experience; real *logins* ⛔ pending auth) |
| C12 | **No perf/CLS regression.** Buyer-aware changes stay within the existing perf + interaction gates. | All | AUTOMATED — the perf-budget + interaction gates | ✅ met (slice 1) |

---

## Test scenarios (what "test it" means)
1. **Guest (no login):** default B2C. Buyable finished goods, retail, simple, cart persists (C6 pending). — testable now via default.
2. **B2C:** same as guest but optionally logged-in; retail experience.
3. **B2B (Business mode):** bulk features unlocked, same prices.

**Today:** all three *experiences* are testable via the **buyer-mode toggle** (bottom-left) — no login needed. **Real B2B/B2C logins** are ⛔ blocked (native customer auth is flag-gated `CUSTOMER_AUTH_ENABLED` + not yet validated, and there's no buyer-type field on the account yet — both are migration-lane work). Two seeded test logins (one B2C, one B2B) get created the moment native auth is validated + a buyer-type field exists.

---

## Enforcement
- **Automated contract-check** (to be built, mirroring the perf-budget gate): a script that, for the mechanically-checkable rules (C1, C2, C3, C5, C6, C7, C8, C12), drives both modes + a guest and asserts each — run on every buyer-aware build, exits non-zero on any regression.
- **Judge review** for the taste rules (C4, C9) — a separate evaluator, never the builder self-grading.
- **New rules** Amit gives are added here once, then enforced every build.

---
## Deviations from live (intentional — do NOT flag as parity gaps)
- **D1 — Dye/finish selection is SINGLE-SELECT** (decided by Amit 2026-07-12). Live is multi-select-and-sum (3 dyes → +₹1,044; Full+Short sleeves → +₹130, comma-joined ids), but that is physically nonsensical (one fabric cannot be 3 dye colours; a garment cannot be full AND short sleeve). The demo intentionally uses single-select (switch-on-change). Parity audits must treat single-select as the SPEC, not a gap.

## Login → buyer-mode (built 2026-07-12)
- Native `buyerType` (b2c|b2b) column on owned `relational.customer_credential` (default b2c); emitted in `/get/customer/profile`; storefront `/api/auth/me` sets `ap_buyer_mode` from it; logout → guest. Real login now drives mode (C10 → met for native accounts). Seeded test users: test.b2c / test.b2b @anuprerna-sandbox.test. Upgrade endpoint = minimal flag-flip; KYC/business-data capture STUBBED (follow-up).
