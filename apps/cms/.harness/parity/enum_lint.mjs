#!/usr/bin/env node
/**
 * enum_lint.mjs — Gate 7 of the Weave parity harness.
 *
 * Mechanically extracts every `export enum` literal from the LIVE Angular source
 * (live-weave-ref) and fails if the sandbox uses a status literal that is not in
 * the corresponding live union at a status-bearing call site:
 *   - string args to getWorkflowList(...) / getWorkflowListMulti([...])  -> WorkflowStatus
 *   - the workflow-status const arrays                                    -> WorkflowStatus
 *   - deriveOrderStatus / orderStatusVariant bodies                       -> OrderStatus
 *   - derivePaymentStatus / paymentStatusVariant bodies                   -> PaymentStatus
 *
 * Deliberate sandbox-only literals go in ALLOWLIST with a justification.
 * Exit 0 = clean, exit 1 = at least one fabricated literal (prints file:line).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = '/home/clawd/.openclaw/workspace/anuprerna-rebuild';
const WEAVE_SRC = process.env.ENUM_LINT_SRC || join(WORKSPACE, 'weave/src');
const LIVE_SRC = join(WORKSPACE, 'live-weave-ref/src');

// ── Allowlist: deliberate sandbox-only literals (each needs a justification) ──
const ALLOWLIST = {
  OrderStatus: [],
  PaymentStatus: [
    { literal: 'PRE_ORDER', why: 'OrderItemType guard used to pick the pre-order payment status first (mirrors Loom COALESCE FILTER orderType=PRE_ORDER); it is not a payment value.' },
  ],
  WorkflowStatus: [],
};
const allowed = (concept, lit) => (ALLOWLIST[concept] || []).some((e) => e.literal === lit);

// ── Walk a dir for .ts/.tsx ──────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// ── Extract live enums (glob broadly across all enum files) ──────────────────
const LIVE = {};
for (const f of walk(LIVE_SRC)) {
  if (!/enum/i.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  const re = /export\s+enum\s+(\w+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    const vals = new Set();
    const vre = /['"]([A-Za-z0-9_]+)['"]/g;
    let vm;
    while ((vm = vre.exec(m[2]))) vals.add(vm[1]);
    LIVE[name] = LIVE[name] ? new Set([...LIVE[name], ...vals]) : vals;
  }
}
for (const need of ['OrderStatus', 'PaymentStatus', 'WorkflowStatus', 'WorkflowStepStatus']) {
  if (!LIVE[need]) {
    console.error('enum-lint: FATAL — could not extract live enum ' + need + ' from ' + LIVE_SRC);
    process.exit(2);
  }
}

// ── Helpers: line number + status-like literal test ──────────────────────────
const lineAt = (src, idx) => src.slice(0, idx).split('\n').length;
const isStatusLit = (s) => /^[A-Z][A-Z0-9_]{2,}$/.test(s);

// Extract a brace-balanced function body given a 'function NAME(' start.
function funcBody(src, fnName) {
  const key = 'function ' + fnName + '(';
  const sig = src.indexOf(key);
  if (sig < 0) return null;
  // Balance the parameter parens first, so a { } inside a parameter TYPE
  // annotation (e.g. Array<{ orderStatus: string }>) is not mistaken for the
  // body brace.
  let i = sig + key.length - 1;
  let pd = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') pd++;
    else if (src[i] === ')') { pd--; if (pd === 0) { i++; break; } }
  }
  const start = src.indexOf('{', i); // body brace, after the return type
  if (start < 0) return null;
  let depth = 0; i = start;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return { body: src.slice(start, i), offset: start };
}

const violations = [];
const add = (file, idx, src, concept, lit) =>
  violations.push({ where: file.replace(WEAVE_SRC, 'src') + ':' + lineAt(src, idx), concept, lit });

// ── Probes ───────────────────────────────────────────────────────────────────
const FN_PROBES = [
  { fn: 'deriveOrderStatus', concept: 'OrderStatus' },
  { fn: 'orderStatusVariant', concept: 'OrderStatus' },
  { fn: 'derivePaymentStatus', concept: 'PaymentStatus' },
  { fn: 'paymentStatusVariant', concept: 'PaymentStatus' },
];

let checked = 0;
for (const file of walk(WEAVE_SRC)) {
  const src = readFileSync(file, 'utf8');

  // Probe A1: getWorkflowList("LIT")
  let m;
  const gwl = /getWorkflowList\s*\(\s*(['"])([A-Za-z0-9_]+)\1/g;
  while ((m = gwl.exec(src))) {
    checked++;
    const lit = m[2];
    if (!LIVE.WorkflowStatus.has(lit) && !allowed('WorkflowStatus', lit))
      add(file, m.index, src, 'WorkflowStatus', lit);
  }
  // Probe A2: inline arrays -> getWorkflowListMulti([...]) and the *_WORKFLOW_STATUSES consts
  const arrRe = /(?:getWorkflowListMulti\s*\(\s*|WORKFLOW_STATUSES\s*=\s*)\[([^\]]*)\]/g;
  while ((m = arrRe.exec(src))) {
    const inner = m[1];
    const lre = /['"]([A-Za-z0-9_]+)['"]/g;
    let lm;
    while ((lm = lre.exec(inner))) {
      checked++;
      const lit = lm[1];
      if (!LIVE.WorkflowStatus.has(lit) && !allowed('WorkflowStatus', lit))
        add(file, m.index + lm.index, src, 'WorkflowStatus', lit);
    }
  }

  // Probe B/C: named status-styling / derivation functions
  for (const { fn, concept } of FN_PROBES) {
    const fb = funcBody(src, fn);
    if (!fb) continue;
    const lre = /['"]([A-Za-z0-9_]+)['"]/g;
    let lm;
    while ((lm = lre.exec(fb.body))) {
      const lit = lm[1];
      if (!isStatusLit(lit)) continue;
      checked++;
      if (!LIVE[concept].has(lit) && !allowed(concept, lit))
        add(file, fb.offset + lm.index, src, concept, lit);
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const fmt = (s) => [...s].sort().join(', ');
console.log('enum-lint — live unions:');
console.log('  OrderStatus   = ' + fmt(LIVE.OrderStatus));
console.log('  PaymentStatus = ' + fmt(LIVE.PaymentStatus));
console.log('  WorkflowStatus= ' + fmt(LIVE.WorkflowStatus));
console.log('  (WorkflowStepStatus = ' + fmt(LIVE.WorkflowStepStatus) + ')');
console.log('enum-lint — status literals checked at call sites: ' + checked);

if (violations.length) {
  console.error('\nenum-lint: FAIL — ' + violations.length + ' fabricated status literal(s):');
  for (const v of violations)
    console.error('  ' + v.where + '  "' + v.lit + '" is not a live ' + v.concept +
      ' (allowed: ' + fmt(LIVE[v.concept]) + ')');
  process.exit(1);
}
console.log('\nenum-lint: PASS — every status literal is in the live union.');
process.exit(0);
