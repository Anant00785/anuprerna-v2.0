#!/usr/bin/env node

/**
 * Route coverage: legacy Spring Boot (loom) vs new NestJS API (apps/api).
 *
 * Usage:
 *   node scripts/route-coverage.mjs [--loom <path>] [--json <out.json>]
 *
 * Default loom path: ../loom relative to this repo (override with --loom or LOOM_DIR).
 *
 * ---------------------------------------------------------------------------
 * HOW EACH SIDE IS PARSED
 * ---------------------------------------------------------------------------
 * LEGACY (authority): every *Controller.java under loom/src/main/java.
 *   Route paths are almost never string literals; they are constants such as
 *   `RequestMapper.ADD_CART_ITEM` (or statically imported bare `ADD_CART_ITEM`).
 *   So we first build a constant table from every `public static final String`
 *   declaration in the loom source tree (RequestMapper.java and friends),
 *   resolving simple literals and literal + CONST concatenations transitively.
 *   Then for each `@Get|Post|Put|Patch|DeleteMapping( ... )` block we take the
 *   `value = X` / `path = X` argument (or the single positional argument) and
 *   resolve it. Class-level `@RequestMapping` is honoured if present (in loom
 *   today: zero controllers declare one, so the constant IS the full path).
 *   Constants whose value is an absolute URL (http…) are outbound third-party
 *   client endpoints (Zoho, WhatsApp), not routes we serve — excluded, counted.
 *
 * NEW: every *.ts under apps/api/src containing `@Controller(...)`; the class
 *   base path is joined with each `@Get|Post|Put|Patch|Delete("sub")`.
 *
 * ---------------------------------------------------------------------------
 * NORMALISATION RULES (each is counted so the error bar is auditable)
 * ---------------------------------------------------------------------------
 *   R0 exact        - identical after lowercasing and trimming slashes.
 *   R1 param        - `{id}`, `:id`, `{anything}` -> `:p` (name-insensitive).
 *   R2 slash        - leading/trailing slashes and duplicate slashes collapsed.
 *   R3 case         - lowercased (legacy is kebab-case, new side mostly is too).
 *   R4 verb-prefix  - legacy paths carry an action verb segment that Nest drops:
 *                     `/get/cart/item` vs `/cart/item` with GET. We strip a
 *                     leading get|add|update|delete|create|remove|post|patch|put
 *                     segment from the legacy path and try again. Only applied
 *                     when the HTTP method is compatible with the verb.
 *   R5 segment-set  - last resort: same method and the same *set* of remaining
 *                     path segments in any order (catches `/cart/item/all` vs
 *                     `/cart/all/item`). Reported separately as "weak match".
 *
 * A legacy route counts as MATCHED at the first rule that fires; the report
 * prints how many matches each rule contributed, so R4/R5 (the fuzzy ones)
 * are the measurable error bar rather than an asserted +/- percentage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const args = process.argv.slice(2);
const argVal = (name, fallback) => {
  const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return fallback;
  const a = args[i];
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : args[i + 1];
};

const loomDir = path.resolve(argVal('loom', process.env.LOOM_DIR || path.join(rootDir, '..', 'loom')));
const apiSrc = path.join(rootDir, 'apps', 'api', 'src');
const jsonOut = argVal('json', null);

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// ---------------------------------------------------------------- fs helpers

function walk(dir, filter, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      walk(p, filter, out);
    } else if (filter(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/** Return the substring inside the parentheses that start at `open`. */
function balanced(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return '';
}

// ------------------------------------------------------- legacy: constants

/**
 * Build NAME -> string value for every `public static final String NAME = ...`
 * in the loom tree. Values may be literals, concatenations of literals, or
 * references to other constants (possibly qualified `RequestMapper.X`).
 * Resolution is iterated to a fixed point.
 */
function buildConstantTable(javaFiles) {
  const raw = new Map(); // NAME -> expression source
  const decl = /(?:public|protected|private)?\s*static\s+(?:final\s+)?String\s+([A-Z0-9_]+)\s*=\s*([^;]+);/g;
  for (const f of javaFiles) {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = decl.exec(src))) {
      const [, name, expr] = m;
      if (!raw.has(name)) raw.set(name, expr.trim());
    }
  }

  const resolved = new Map();
  const resolveExpr = (expr, depth = 0) => {
    if (depth > 8) return null;
    // Function calls (getAbsoluteApiUri("...")) -> take inner literal, mark absolute later
    const callMatch = expr.match(/^([A-Za-z_.]+)\s*\((.*)\)$/s);
    if (callMatch) return resolveExpr(callMatch[2], depth + 1);
    const parts = expr.split('+').map((s) => s.trim());
    let out = '';
    for (const part of parts) {
      const lit = part.match(/^"((?:[^"\\]|\\.)*)"$/);
      if (lit) {
        out += lit[1];
        continue;
      }
      const ref = part.match(/^(?:[A-Za-z_][\w]*\.)?([A-Z0-9_]+)$/);
      if (ref && raw.has(ref[1])) {
        const v = resolveExpr(raw.get(ref[1]), depth + 1);
        if (v === null) return null;
        out += v;
        continue;
      }
      return null; // unresolvable term
    }
    return out;
  };

  for (const [name, expr] of raw) {
    const v = resolveExpr(expr);
    if (v !== null) resolved.set(name, v);
  }
  return { resolved, rawCount: raw.size };
}

// ------------------------------------------------------- legacy: controllers

function parseLegacy() {
  const javaFiles = walk(loomDir, (n) => n.endsWith('.java'));
  const { resolved, rawCount } = buildConstantTable(javaFiles);
  const controllers = javaFiles.filter((f) => path.basename(f).endsWith('Controller.java'));

  const routes = [];
  const unresolved = [];
  const external = [];

  for (const f of controllers) {
    const src = fs.readFileSync(f, 'utf8');
    const cls = path.basename(f, '.java');

    // class-level @RequestMapping (none in loom today, but honour it if added)
    let base = '';
    const rm = src.match(/^@RequestMapping\s*\(/m);
    if (rm) {
      const inner = balanced(src, src.indexOf('(', rm.index));
      base = resolveArg(inner, resolved) || '';
    }

    const ann = /@(Get|Post|Put|Patch|Delete)Mapping\s*\(/g;
    let m;
    while ((m = ann.exec(src))) {
      const method = m[1].toUpperCase();
      const openIdx = src.indexOf('(', m.index);
      const inner = balanced(src, openIdx);
      const after = src.slice(openIdx + inner.length + 2);
      const fn = after.match(/\b(\w+)\s*\(/);
      const handler = fn ? fn[1] : '?';
      const argSrc = extractPathArg(inner);
      const value = resolveArg(argSrc, resolved);
      const rec = {
        method,
        controller: cls,
        handler,
        file: path.relative(loomDir, f),
        raw: argSrc,
      };
      if (value === null) {
        unresolved.push(rec);
        continue;
      }
      if (/^https?:\/\//i.test(value)) {
        external.push({ ...rec, path: value });
        continue;
      }
      routes.push({ ...rec, path: join(base, value) });
    }
  }
  return { routes, unresolved, external, controllerCount: controllers.length, constantCount: resolved.size, rawCount };
}

/** From an annotation argument list, pull the path expression. */
function extractPathArg(inner) {
  const kv = inner.match(/(?:^|,)\s*(?:value|path)\s*=\s*([\s\S]*?)(?=,\s*\w+\s*=|$)/);
  if (kv) return kv[1].trim();
  // positional single arg (may itself contain `=` only for other named args)
  const first = inner.split(/,(?![^{(]*[})])/)[0].trim();
  if (first && !/^\w+\s*=/.test(first)) return first;
  return '';
}

function resolveArg(expr, table) {
  if (!expr) return null;
  let e = expr.trim().replace(/^\{|\}$/g, '').trim(); // @GetMapping({A, B}) -> take first
  e = e.split(',')[0].trim();
  const lit = e.match(/^"((?:[^"\\]|\\.)*)"$/);
  if (lit) return lit[1];
  const parts = e.split('+').map((s) => s.trim());
  let out = '';
  for (const p of parts) {
    const l = p.match(/^"((?:[^"\\]|\\.)*)"$/);
    if (l) {
      out += l[1];
      continue;
    }
    const ref = p.match(/^(?:[A-Za-z_][\w]*\.)?([A-Z0-9_]+)$/);
    if (ref && table.has(ref[1])) {
      out += table.get(ref[1]);
      continue;
    }
    return null;
  }
  return out;
}

// ------------------------------------------------------------------- new side

function parseNew() {
  const files = walk(apiSrc, (n) => n.endsWith('.ts') && !n.endsWith('.spec.ts'));
  const routes = [];
  const controllers = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    if (!src.includes('@Controller(')) continue;
    const ctrl = /@Controller\s*\(/g;
    let m;
    while ((m = ctrl.exec(src))) {
      const openIdx = src.indexOf('(', m.index);
      const inner = balanced(src, openIdx);
      const baseLit = inner.match(/["'`]([^"'`]*)["'`]/);
      const base = baseLit ? baseLit[1] : '';
      const after = src.slice(openIdx + inner.length + 2);
      const clsM = after.match(/class\s+(\w+)/);
      const cls = clsM ? clsM[1] : path.basename(f);
      controllers.add(cls);
      const nextCtrl = after.indexOf('@Controller(');
      const body = nextCtrl === -1 ? after : after.slice(0, nextCtrl);
      // Nest accepts BOTH @Get("a") and @Get(["a", "b"]) — the array form
      // registers one handler on several paths and is how legacy aliases are
      // kept alive. Matching only the single-string form reported those alias
      // paths as absent when they are in fact served.
      const verb = /@(Get|Post|Put|Patch|Delete)\s*\(/g;
      let r;
      while ((r = verb.exec(body))) {
        const argOpen = r.index + r[0].length - 1;
        const args = balanced(body, argOpen);
        const literals = [...args.matchAll(/["'`]([^"'`]*)["'`]/g)].map((m) => m[1]);
        // skip any further decorators (@HttpCode, @RequireGate, @ApiOperation…)
        const rest = body
          .slice(argOpen + args.length + 2)
          .replace(/^(?:\s*@\w+\s*(\([\s\S]*?\))?\s*)*/, '');
        const fn = rest.match(/(?:async\s+)?(\w+)\s*\(/);
        for (const lit of literals.length ? literals : ['']) {
          routes.push({
            method: r[1].toUpperCase(),
            path: join(base, lit),
            controller: cls,
            handler: fn ? fn[1] : '?',
            file: path.relative(rootDir, f),
          });
        }
      }
    }
  }
  // A controller class only serves traffic if some *.module.ts lists it in
  // `controllers: [...]`. Declared-but-unregistered controllers are dead code.
  const registered = new Set();
  for (const f of files) {
    if (!f.endsWith('.module.ts')) continue;
    const src = fs.readFileSync(f, 'utf8');
    const m = src.match(/controllers\s*:\s*\[([\s\S]*?)\]/);
    if (!m) continue;
    for (const x of m[1].split(',')) {
      const t = x.trim().replace(/\/\/.*$/, '').trim();
      if (/^\w+$/.test(t)) registered.add(t);
    }
  }
  for (const r of routes) r.registered = registered.has(r.controller);
  const unregisteredControllers = [...controllers].filter((c) => !registered.has(c)).sort();
  return { routes, controllerCount: controllers.size, unregisteredControllers };
}

// --------------------------------------------------------------- normalising

function join(...segs) {
  const s = segs
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .join('/');
  return '/' + s.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

const VERB_SEGMENTS = {
  get: ['GET'],
  fetch: ['GET'],
  list: ['GET'],
  add: ['POST'],
  create: ['POST'],
  post: ['POST'],
  save: ['POST', 'PUT'],
  update: ['PUT', 'PATCH', 'POST'],
  patch: ['PATCH', 'PUT'],
  put: ['PUT', 'PATCH'],
  edit: ['PUT', 'PATCH'],
  delete: ['DELETE'],
  remove: ['DELETE'],
};

/** R1+R2+R3 */
function norm(p) {
  return (
    '/' +
    String(p)
      .toLowerCase()
      .replace(/\{[^}]*\}/g, ':p')
      .replace(/:[A-Za-z_][\w]*/g, ':p')
      .replace(/\*+/g, ':p')
      .split('/')
      .filter(Boolean)
      .join('/')
  );
}

/** R4: strip a leading action verb segment when method-compatible. */
function stripVerb(normPath, method) {
  const segs = normPath.split('/').filter(Boolean);
  if (!segs.length) return null;
  const allowed = VERB_SEGMENTS[segs[0]];
  if (!allowed || !allowed.includes(method)) return null;
  return '/' + segs.slice(1).join('/');
}

/** R5 key: method + sorted segment multiset. */
function segKey(normPath) {
  return normPath.split('/').filter(Boolean).sort().join('|');
}

// ------------------------------------------------------------------ matching

function match(legacy, nu) {
  const byExact = new Map();
  const bySeg = new Map();
  for (const r of nu) {
    const n = norm(r.path);
    const k = `${r.method} ${n}`;
    if (!byExact.has(k)) byExact.set(k, []);
    byExact.get(k).push(r);
    const sk = `${r.method} ${segKey(n)}`;
    if (!bySeg.has(sk)) bySeg.set(sk, []);
    bySeg.get(sk).push(r);
  }

  const ruleCounts = { R0_R3_direct: 0, R4_verb_prefix: 0, R5_segment_set: 0 };
  const matched = [];
  const missing = [];
  const usedNew = new Set();
  const idOf = (r) => `${r.method} ${norm(r.path)}`;

  for (const r of legacy) {
    const n = norm(r.path);
    let hit = byExact.get(`${r.method} ${n}`);
    let rule = 'R0_R3_direct';
    if (!hit) {
      const stripped = stripVerb(n, r.method);
      if (stripped) {
        hit = byExact.get(`${r.method} ${stripped}`);
        if (hit) rule = 'R4_verb_prefix';
      }
    }
    if (!hit) {
      const stripped = stripVerb(n, r.method) || n;
      hit = bySeg.get(`${r.method} ${segKey(stripped)}`) || bySeg.get(`${r.method} ${segKey(n)}`);
      if (hit) rule = 'R5_segment_set';
    }
    if (hit) {
      ruleCounts[rule]++;
      const chosen = hit.find((h) => h.registered) || hit[0];
      matched.push({
        ...r,
        rule,
        newRoute: `${chosen.method} ${chosen.path}`,
        newController: chosen.controller,
        unregistered: !hit.some((h) => h.registered),
      });
      for (const h of hit) usedNew.add(idOf(h));
    } else {
      missing.push(r);
    }
  }

  // Diagnostics on the MISSING set - not counted as matched, but they explain why.
  //  D1 method-mismatch : same normalised path exists on the new side under a
  //                       different HTTP verb (e.g. legacy POST -> new PATCH).
  //  D2 param-superseded: a new route matches if one literal legacy segment is
  //                       replaced by a path parameter (a generic handler that
  //                       swallowed a family of per-entity legacy routes).
  const anyMethod = new Map();
  const paramForms = new Map();
  for (const r of nu) {
    const n = norm(r.path);
    (anyMethod.get(n) || anyMethod.set(n, []).get(n)).push(r);
    if (n.includes(':p')) {
      const segs = n.split('/');
      for (let i = 0; i < segs.length; i++) {
        if (segs[i] !== ':p') continue;
        const k = `${r.method} ${segs.map((s, j) => (j === i ? '*' : s)).join('/')}`;
        (paramForms.get(k) || paramForms.set(k, []).get(k)).push(r);
      }
    }
  }
  for (const r of missing) {
    const n = norm(r.path);
    const other = (anyMethod.get(n) || []).filter((x) => x.method !== r.method);
    if (other.length) {
      r.diagnostic = 'D1_method_mismatch';
      r.newRoute = `${other[0].method} ${other[0].path}`;
      r.newController = other[0].controller;
      continue;
    }
    const segs = n.split('/');
    for (let i = 1; i < segs.length; i++) {
      const k = `${r.method} ${segs.map((s, j) => (j === i ? '*' : s)).join('/')}`;
      const cand = paramForms.get(k);
      if (cand) {
        r.diagnostic = 'D2_param_superseded';
        r.newRoute = `${cand[0].method} ${cand[0].path}`;
        r.newController = cand[0].controller;
        break;
      }
    }
    r.diagnostic ||= 'D0_absent';
  }

  const emitted = new Set();
  const newOnly = nu.filter((r) => {
    if (usedNew.has(idOf(r))) return false;
    if (emitted.has(idOf(r))) return false; // collapse duplicate registrations
    emitted.add(idOf(r));
    return true;
  });
  return { matched, missing, newOnly, ruleCounts };
}

// --------------------------------------------------------------------- family

const FAMILIES = [
  ['table-explorer', /table[-_/]?explorer/i],
  ['custom-made', /custom-(product|size-profile|workflow|order)|\/workflow|element\/feedback/i],
  ['forex', /forex/i],
  ['filter', /\/(filter|filter-page-config)/i],
  ['impact', /\/impact/i],
  ['analytics', /(ga-attribution|ads-conversion|attribution)/i],
  ['zoho', /zoho/i],
  ['whatsapp', /whatsapp/i],
  ['cart', /\/cart/i],
  ['order', /\/(order|sales-order|checkout)/i],
  ['payment', /\/(payment|razorpay|stripe|refund|transaction)/i],
  ['product', /\/(product|sku|variant|fabric|catalog|category|collection)/i],
  ['artisan', /\/(artisan|weaver|cluster|craft)/i],
  ['content', /\/(blog|story|stories|faq|content|banner|page|testimonial)/i],
  ['auth', /\/(auth|login|register|otp|token|password|session)/i],
  ['tenant-user', /\/(tenant|user|profile|address|role)/i],
  ['inventory', /\/(inventory|stock|warehouse)/i],
  ['media', /\/(image|media|upload|file|asset)/i],
  ['ops-diagnostics', /\/(diagnostics|health|cron|log|audit|metric|monitor|alfred|bloomsight)/i],
  ['notification', /\/(notification|email|mail|sms|push)/i],
  ['review', /\/(review|rating)/i],
];

function familyOf(p) {
  for (const [name, re] of FAMILIES) if (re.test(p)) return name;
  return 'other';
}

// ----------------------------------------------------------------------- main

const legacy = parseLegacy();
const nu = parseNew();

// de-duplicate identical (method,path,controller,handler) legacy rows
const seen = new Set();
const legacyRoutes = legacy.routes.filter((r) => {
  const k = `${r.method} ${r.path} ${r.controller}.${r.handler}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const uniqueLegacyEndpoints = new Set(legacyRoutes.map((r) => `${r.method} ${norm(r.path)}`));
const res = match(legacyRoutes, nu.routes);

const diagCounts = res.missing.reduce((a, r) => ((a[r.diagnostic] = (a[r.diagnostic] || 0) + 1), a), {});

const byFamily = {};
for (const r of res.missing) {
  const f = familyOf(r.path);
  (byFamily[f] ||= []).push(r);
}

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  loomDir,
  legacy: {
    controllerFiles: legacy.controllerCount,
    constantsResolved: legacy.constantCount,
    constantsDeclared: legacy.rawCount,
    routes: legacyRoutes.length,
    uniqueMethodPath: uniqueLegacyEndpoints.size,
    unresolvedAnnotations: legacy.unresolved.length,
    externalClientEndpoints: legacy.external.length,
  },
  new: {
    controllers: nu.controllerCount,
    routes: nu.routes.length,
    unregisteredControllers: nu.unregisteredControllers,
    routesOnUnregisteredControllers: nu.routes.filter((r) => !r.registered).length,
  },
  coverage: {
    matched: res.matched.length,
    missing: res.missing.length,
    newOnly: res.newOnly.length,
    matchedByRule: res.ruleCounts,
    missingByDiagnostic: diagCounts,
    matchedOnlyOnUnregisteredController: res.matched.filter((m) => m.unregistered).length,
  },
  matchedButUnserved: res.matched
    .filter((m) => m.unregistered)
    .map((m) => ({ method: m.method, path: m.path, newController: m.newController })),
  missingByFamily: Object.fromEntries(
    Object.entries(byFamily)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([k, v]) => [
        k,
        v
          .sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
          .map((r) => ({
            method: r.method,
            path: r.path,
            java: `${r.controller}.${r.handler}`,
            diagnostic: r.diagnostic,
            nearestNew: r.newRoute || null,
          })),
      ])
  ),
  newOnly: res.newOnly
    .sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
    .map((r) => ({ method: r.method, path: r.path, controller: `${r.controller}.${r.handler}` })),
  unresolvedAnnotations: legacy.unresolved.map((r) => ({
    method: r.method,
    java: `${r.controller}.${r.handler}`,
    expr: r.raw,
  })),
};

if (jsonOut) {
  fs.writeFileSync(path.resolve(jsonOut), JSON.stringify(report, null, 2) + '\n');
}

const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) : '0.0');
console.log(`route-coverage  (${report.generatedAt})`);
console.log(`  legacy  : ${loomDir}`);
console.log(`  new     : ${path.relative(rootDir, apiSrc)}`);
console.log('');
console.log(`LEGACY  ${legacy.controllerCount} controller files, ${legacy.constantCount}/${legacy.rawCount} String constants resolved`);
console.log(`        ${legacyRoutes.length} routes (${uniqueLegacyEndpoints.size} unique method+path)`);
console.log(`        ${legacy.unresolved.length} annotations with unresolvable path expression (excluded)`);
console.log(`        ${legacy.external.length} absolute-URL constants = outbound client calls (excluded)`);
console.log(`NEW     ${nu.controllerCount} controllers, ${nu.routes.length} route declarations`);
console.log(
  `        ${nu.unregisteredControllers.length} controllers are not listed in any module's controllers[] ` +
    `(${report.new.routesOnUnregisteredControllers} declared routes never served)`
);
console.log('');
console.log(`MATCHED ${res.matched.length}/${legacyRoutes.length}  (${pct(res.matched.length, legacyRoutes.length)}%)`);
for (const [k, v] of Object.entries(res.ruleCounts)) console.log(`        ${k.padEnd(16)} ${v}`);
console.log(
  `        of which ${report.coverage.matchedOnlyOnUnregisteredController} match ONLY a controller that no module registers (declared, not served)`
);
console.log(`MISSING ${res.missing.length}`);
for (const [k, v] of Object.entries(diagCounts).sort()) console.log(`        ${k.padEnd(20)} ${v}`);
console.log(`NEWONLY ${res.newOnly.length} routes on the new side with no legacy counterpart`);
console.log('');
console.log('MISSING BY FAMILY');
for (const [f, list] of Object.entries(report.missingByFamily)) {
  console.log(`  ${f.padEnd(18)} ${String(list.length).padStart(4)}`);
}
if (args.includes('--list')) {
  console.log('');
  for (const [f, list] of Object.entries(report.missingByFamily)) {
    console.log(`\n## ${f}`);
    for (const r of list)
      console.log(
        `  ${r.method.padEnd(6)} ${r.path}   [${r.java}]  ${r.diagnostic}${r.nearestNew ? ' -> ' + r.nearestNew : ''}`
      );
  }
}
