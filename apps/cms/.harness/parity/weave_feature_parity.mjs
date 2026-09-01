import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE = '/home/clawd/.openclaw/workspace/anuprerna-rebuild';
const WEAVE_SRC = join(WORKSPACE, 'weave/src');
const HARNESS_DIR = join(WORKSPACE, 'weave/.harness/parity');

// ─── Load Input Files ─────────────────────────────────────────────────────────
const endpointDtoMap = JSON.parse(readFileSync(join(WORKSPACE, 'loom-source-analysis/endpoint-dto-map.json'), 'utf8'));
const contractManifest = JSON.parse(readFileSync(join(WORKSPACE, 'loom-contract/contract-manifest.json'), 'utf8'));
const liveNav = JSON.parse(readFileSync(join(HARNESS_DIR, 'live-nav.json'), 'utf8'));

// ─── Read all weave/src .ts/.tsx into a combined blob ─────────────────────────
function readDirRecursive(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (['node_modules', '.next', '.git'].includes(entry)) continue;
      const fp = join(dir, entry);
      try {
        const st = statSync(fp);
        if (st.isDirectory()) files.push(...readDirRecursive(fp));
        else if (['.ts', '.tsx'].includes(extname(entry))) files.push(fp);
      } catch (_) {}
    }
  } catch (_) {}
  return files;
}

const combinedSource = readDirRecursive(WEAVE_SRC)
  .map(f => { try { return readFileSync(f, 'utf8'); } catch (_) { return ''; } })
  .join('\n');

// ─── Path helpers ─────────────────────────────────────────────────────────────
function stripPathParams(path) {
  return path.replace(/{[^}]+}/g, '').replace(/\/+/g, '/');
}

function isPathInSource(path) {
  const s = stripPathParams(path);
  if (!s || s.length < 5) return false;
  const trimmed = (s.endsWith('/') && s.length > 1) ? s.slice(0, -1) : s;
  return combinedSource.includes(trimmed);
}

// ─── Table Explorer wrapper detection ─────────────────────────────────────────
// weave/src/app/api/table-explorer/route.ts calls `/get/table-explorer/data/${table}`
// DYNAMICALLY for any entity — so every /get/table-explorer/data/<entity> endpoint
// is data-reachable via the generic wrapper and should NOT count as a coverage gap.
// We mark these as COVERED-VIA-TABLE-EXPLORER and exclude them from missingEndpoints.
// They are reported separately as a useful signal (data accessible, no dedicated view).
const TABLE_EXPLORER_WRAPPER_EXISTS = combinedSource.includes('/get/table-explorer/data/');

function isTableExplorerDataPath(path) {
  const s = stripPathParams(path);
  return s.startsWith('/get/table-explorer/data/');
}

// ─── Parse sandbox NAV_BASE from WeaveShell.tsx ───────────────────────────────
// IMPORTANT: must find the actual array '= [' to skip the TypeScript type
// annotation 'NavGroup[]' which also contains '[' and ']'.
const weaveShellContent = readFileSync(join(WEAVE_SRC, 'components/weave/WeaveShell.tsx'), 'utf8');

function parseNavBase(content) {
  const declStart = content.indexOf('const NAV_BASE');
  if (declStart === -1) return { itemLabels: [] };

  // Find '= [' after the declaration to skip TypeScript type annotation
  const assignIdx = content.indexOf('= [', declStart);
  if (assignIdx === -1) return { itemLabels: [] };
  const arrStart = assignIdx + 2; // position of the '[' in '= ['

  // Collect the full outer array using depth tracking
  let depth = 0, begun = false, navStr = '';
  for (let i = arrStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === '[') { depth++; begun = true; }
    if (ch === ']') depth--;
    if (begun) navStr += ch;
    if (begun && depth === 0) break;
  }

  // Use [^{}]* to stay within a single {} object and avoid group-label → item-href mismatch
  const itemLabels = [];
  const fwdRe = /label:\s*"([^"]+)"[^{}]*href:\s*"([^"]+)"/g;
  const revRe = /href:\s*"([^"]+)"[^{}]*label:\s*"([^"]+)"/g;
  for (const m of navStr.matchAll(fwdRe)) itemLabels.push(m[1]);
  for (const m of navStr.matchAll(revRe)) itemLabels.push(m[2]);
  return { itemLabels: [...new Set(itemLabels)] };
}

const sandboxNavItems = parseNavBase(weaveShellContent).itemLabels;
process.stderr.write('Sandbox nav items (' + sandboxNavItems.length + '): ' + sandboxNavItems.join(', ') + '\n');

// ─── Nav alias map (live label → sandbox label) ───────────────────────────────
// The sandbox re-labeled several live nav items. Explicit aliases ensure renamed
// items match without relying on keyword fuzzy-matching (which fails for semantic
// renames like "Manage Product" → "Listings").
const NAV_ALIASES = {
  'Manage Product':   'Listings',           // /listings — KEY: formerly falsely MISSING
  'Manage Catalogs':  'Catalog',            // /catalog/* group
  'Manage Feedbacks': 'Order Feedback',     // /order-feedback — dedicated Order Feedback view (previously aliased to Workflow Feedback)
  'Manage User':      'Users',
  'Manage Whatsapp':  'WhatsApp',
  'Manage Workflow':  'Workflow',
  'Manage Content':   'Content',
  'Manage Reviews':   'Reviews',
  'Manage Inventory': 'Inventory',
  'Manage Artisans':  'Artisans',
  'Wholesale Program': 'Wholesale',   // /wholesale — nav label renamed
};

// ─── Keyword / fuzzy-match helpers ───────────────────────────────────────────
// stem: remove trailing 's' for simple plurals (reviews->review, users->user)
// threshold > 4 chars (so "users"=5 > 4, "user"=4 = 4 not > 4 is excluded by filter)
function stem(w) { return (w.length > 4 && w.endsWith('s')) ? w.slice(0, -1) : w; }

function extractKeywords(label) {
  return label.toLowerCase()
    .replace(/^manage\s+/, '')
    .split(/[\s\-\/]+/)
    .filter(w => w.length > 3)  // include 4+ char words (user, user, etc.)
    .map(stem);
}

function labelsMatch(live, sandbox) {
  const lkws = extractKeywords(live);
  const skws = extractKeywords(sandbox);
  if (lkws.length === 0) return live.toLowerCase() === sandbox.toLowerCase();
  // ALL live keywords must appear in sandbox keywords
  return lkws.every(lkw => skws.some(skw => skw === lkw));
}

function findSandboxMatch(item) {
  // Check explicit alias map first (handles semantic renames like "Manage Product" → "Listings")
  const alias = NAV_ALIASES[item];
  if (alias && sandboxNavItems.includes(alias)) return alias;
  // Fall back to keyword fuzzy-match for anything not in the alias map
  for (const sl of sandboxNavItems) if (labelsMatch(item, sl)) return sl;
  return null;
}

// ─── Contract manifest endpoints (read-only GET) ──────────────────────────────
const contractReadEps = contractManifest.endpoints
  .filter(ep => ep.classification === 'read' && ep.verb === 'GET');

function findRelatedContractEps(liveLabel) {
  const kws = extractKeywords(liveLabel);
  if (kws.length === 0) return [];
  return contractReadEps.filter(ep => kws.some(kw => ep.path.toLowerCase().includes(kw)));
}

// ─── Section A: Controller Gap ────────────────────────────────────────────────
const controllerMap = {};
for (const [domain, dv] of Object.entries(endpointDtoMap.domains)) {
  for (const ep of (Array.isArray(dv.endpoints) ? dv.endpoints : [])) {
    if (!controllerMap[ep.controller]) controllerMap[ep.controller] = { domain, eps: [] };
    controllerMap[ep.controller].eps.push(ep.path);
  }
}

const controllerGap = {};
for (const [ctrl, data] of Object.entries(controllerMap)) {
  const results = data.eps.map(p => ({
    path: p,
    found: isPathInSource(p),
    coveredViaTableExplorer: TABLE_EXPLORER_WRAPPER_EXISTS && isTableExplorerDataPath(p),
  }));
  const foundCount = results.filter(r => r.found).length;
  const teCoveredCount = results.filter(r => !r.found && r.coveredViaTableExplorer).length;
  const genuinelyMissing = results.filter(r => !r.found && !r.coveredViaTableExplorer);
  const total = results.length;
  const totalCovered = foundCount + teCoveredCount;
  controllerGap[ctrl] = {
    domain: data.domain,
    status: totalCovered === 0 ? 'MISSING' : totalCovered === total ? 'PRESENT' : 'PARTIAL',
    total, found: foundCount, teCovered: teCoveredCount,
    endpoints: results,
    missingEndpoints: genuinelyMissing.map(r => r.path),
    tableExplorerEndpoints: results.filter(r => r.coveredViaTableExplorer).map(r => r.path),
    samplePath: data.eps[0] || '',
  };
}

// ─── Collect live-nav items ───────────────────────────────────────────────────
const liveNavItems = liveNav.sections.flatMap(s => s.items.map(item => ({ item, section: s.label })));

// ─── Section B+C: Feature Gap ─────────────────────────────────────────────────
const featureGap = liveNavItems.map(({ item, section }) => {
  const sandboxMatch = findSandboxMatch(item);
  process.stderr.write('  ' + item + ' -> sandbox: ' + sandboxMatch + '\n');
  if (!sandboxMatch) {
    return {
      liveItem: item, liveSection: section, sandboxMatch: null, status: 'MISSING',
      relatedEndpoints: [], foundEndpoints: [], missingEndpoints: [], tableExplorerOnlyEndpoints: [],
    };
  }
  const related = findRelatedContractEps(item);
  const epResults = related.map(ep => ({
    name: ep.name,
    path: ep.path,
    found: isPathInSource(ep.path),
    coveredViaTableExplorer: TABLE_EXPLORER_WRAPPER_EXISTS && isTableExplorerDataPath(ep.path),
  }));
  const foundEps = epResults.filter(r => r.found);
  // TE-only: covered by generic table-explorer, NOT found as a dedicated call in source
  const teOnlyEps = epResults.filter(r => !r.found && r.coveredViaTableExplorer);
  // Genuinely missing: not in source AND not covered by TE — these are the real gaps
  const genuinelyMissingEps = epResults.filter(r => !r.found && !r.coveredViaTableExplorer);
  const total = epResults.length;
  // Status logic:
  //   PRESENT = all endpoints covered (directly found or via TE wrapper, no genuine gaps, no TE-only)
  //   PARTIAL = has genuine gaps (not in source, not via TE)
  //          OR has TE-only endpoints (data reachable, but no dedicated sandbox page for that sub-feature)
  //   Note: TE-only → PARTIAL is intentional. The table-explorer gives data access but is not a
  //   dedicated feature view, so the sub-feature is considered incomplete at the UX level.
  let status;
  if (total === 0) {
    status = 'PRESENT';
  } else if (genuinelyMissingEps.length === 0 && teOnlyEps.length === 0) {
    status = 'PRESENT';
  } else {
    status = 'PARTIAL';
  }
  return {
    liveItem: item, liveSection: section, sandboxMatch, status,
    relatedEndpoints: epResults.map(r => r.path),
    foundEndpoints: foundEps.map(r => r.path),
    missingEndpoints: genuinelyMissingEps.map(r => r.path),
    tableExplorerOnlyEndpoints: teOnlyEps.map(r => r.path),
  };
});

// ─── Section B: Extra sandbox items ───────────────────────────────────────────
const matchedSandbox = new Set(featureGap.filter(f => f.sandboxMatch).map(f => f.sandboxMatch));
const extraSandboxItems = sandboxNavItems.filter(sl => !matchedSandbox.has(sl));

// ─── Counters ─────────────────────────────────────────────────────────────────
const ctrlMissing = Object.entries(controllerGap).filter(([,v]) => v.status === 'MISSING');
const ctrlPartial = Object.entries(controllerGap).filter(([,v]) => v.status === 'PARTIAL');
const ctrlPresent = Object.entries(controllerGap).filter(([,v]) => v.status === 'PRESENT');
const featMissing = featureGap.filter(f => f.status === 'MISSING');
const featPartial = featureGap.filter(f => f.status === 'PARTIAL');
const featPresent = featureGap.filter(f => f.status === 'PRESENT');

// Collect all TE-only entity names across all features (for the useful-signal note)
const allTeOnlyEntities = [...new Set(
  featureGap.flatMap(f => (f.tableExplorerOnlyEndpoints || [])
    .map(p => p.replace('/get/table-explorer/data/', ''))
  )
)].sort();

// ─── JSON Report ──────────────────────────────────────────────────────────────
const jsonReport = {
  generatedAt: new Date().toISOString(),
  summary: {
    controllerGap: { present: ctrlPresent.length, partial: ctrlPartial.length, missing: ctrlMissing.length, total: Object.keys(controllerGap).length },
    featureGap: { present: featPresent.length, partial: featPartial.length, missing: featMissing.length, total: featureGap.length },
    extraSandboxItems: extraSandboxItems.length,
    tableExplorerOnlyEntities: allTeOnlyEntities,
  },
  controllerGap, featureGap, extraSandboxItems,
  navDiff: {
    liveNavMissingFromSandbox: featMissing.map(f => f.liveItem),
    liveNavPartialInSandbox: featPartial.map(f => ({
      item: f.liveItem,
      sandboxMatch: f.sandboxMatch,
      missingEndpoints: f.missingEndpoints,
      tableExplorerOnlyEndpoints: f.tableExplorerOnlyEndpoints,
    })),
  },
};
writeFileSync(join(HARNESS_DIR, 'weave-parity-report.json'), JSON.stringify(jsonReport, null, 2));

// ─── Markdown helpers ─────────────────────────────────────────────────────────
const NL = '\n';
function mdRow(cells) { return '| ' + cells.join(' | ') + ' |'; }
function mdTable(headers, rows) {
  return [mdRow(headers), mdRow(headers.map(() => '---')), ...rows.map(mdRow)].join(NL);
}

// ─── Validation gate statuses ─────────────────────────────────────────────────
const gate1 = featureGap.find(f => f.liveItem === 'Impact Factor')?.status ?? 'NOT_FOUND';
const gate2 = featureGap.find(f => f.liveItem === 'Manage Whatsapp')?.status ?? 'NOT_FOUND';
const gate3 = featureGap.find(f => f.liveItem === 'Manage Logistics')?.status ?? 'NOT_FOUND';
const gate4 = featureGap.find(f => f.liveItem === 'Wholesale Program')?.status ?? 'NOT_FOUND';
const gate5 = featureGap.find(f => f.liveItem === 'Artisan Payments')?.status ?? 'NOT_FOUND';
const gate2Detail = featureGap.find(f => f.liveItem === 'Manage Whatsapp');
const impactCtrlStatus = controllerGap['ImpactFactorController']?.status ?? 'N/A';

// ─── Gate 8 — Order Feedback (Manage Feedbacks → dedicated /order-feedback view) ──
// Live "Manage Feedbacks" exposes exactly one card, Order Feedbacks, backed by
// /get/order/feedback-list (preview list) + /get/super-user/order/feedback/{id}
// (detail). PRESENT = both live GET endpoints are wired in sandbox source AND a
// dedicated "Order Feedback" nav item exists (distinct from the developer
// Page-Feedback tool at /feedback). There is no status enum for this feature
// (buckets derive from numeric answers), so Gate 7 has nothing extra to lint.
const ORDER_FEEDBACK_EPS = ['/get/order/feedback-list', '/get/super-user/order/feedback/'];
const gate8EpsFound = ORDER_FEEDBACK_EPS.every((p) => isPathInSource(p));
const gate8HasNav = sandboxNavItems.includes('Order Feedback');
const gate8 = (gate8EpsFound && gate8HasNav) ? 'PRESENT' : 'MISSING';
process.stderr.write('Gate 8 (order-feedback): ' + gate8 + ' — eps=' + gate8EpsFound + ' nav=' + gate8HasNav + '\n');

// ─── Section D: Gate 6 — Zero Mutation (read-only invariant) ─────────────────
// (a) No exported handler other than GET under src/app/api/**/route.ts
// (b) No fetch() with a mutating method in the four feature dirs or their api libs
// (c) The loom proxy exports ONLY GET and contains the explicit allowlist
const OWNED_API_DIRS = ['app/api/impact', 'app/api/logistics', 'app/api/wholesale', 'app/api/loom'].map((p) => join(WEAVE_SRC, p));
const FEATURE_DIRS = ['app/whatsapp', 'app/impact', 'app/logistics', 'app/wholesale'].map((p) => join(WEAVE_SRC, p));
const FEATURE_LIBS = ['lib/whatsapp-api.ts', 'lib/impact-api.ts', 'lib/logistics-api.ts', 'lib/wholesale-api.ts'].map((p) => join(WEAVE_SRC, p));
const LOOM_PROXY = join(WEAVE_SRC, 'app/api/loom/[...path]/route.ts');

function listRouteFiles(dir) {
  const out = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fp = join(dir, entry);
      let st;
      try { st = statSync(fp); } catch (_) { continue; }
      if (st.isDirectory()) out.push(...listRouteFiles(fp));
      else if (entry === 'route.ts' || entry === 'route.tsx') out.push(fp);
    }
  } catch (_) {}
  return out;
}

const MUTATION_VERBS = 'POST|PUT|PATCH|DELETE';
const nonGetExportRe = new RegExp('export\\s+(?:async\\s+)?function\\s+(' + MUTATION_VERBS + ')\\b|export\\s+const\\s+(' + MUTATION_VERBS + ')\\b', 'g');
const mutatingFetchRe = new RegExp('method\\s*:\\s*[\\x27"](?:' + MUTATION_VERBS + ')[\\x27"]', 'gi');

const gate6Violations = [];

// (a)
for (const rf of OWNED_API_DIRS.flatMap((d) => listRouteFiles(d))) {
  let s;
  try { s = readFileSync(rf, 'utf8'); } catch (_) { continue; }
  nonGetExportRe.lastIndex = 0;
  let m;
  while ((m = nonGetExportRe.exec(s))) {
    gate6Violations.push('non-GET handler export (' + (m[1] || m[2]) + ') in ' + rf.replace(WEAVE_SRC, 'src'));
  }
}

// (b)
const featureScanFiles = [...FEATURE_DIRS.flatMap((d) => readDirRecursive(d)), ...FEATURE_LIBS];
for (const f of featureScanFiles) {
  let s;
  try { s = readFileSync(f, 'utf8'); } catch (_) { continue; }
  mutatingFetchRe.lastIndex = 0;
  if (mutatingFetchRe.test(s)) {
    gate6Violations.push('mutating fetch() method in ' + f.replace(WEAVE_SRC, 'src'));
  }
}

// (c)
try {
  const proxySrc = readFileSync(LOOM_PROXY, 'utf8');
  const hasGet = /export\s+(?:async\s+)?function\s+GET\b/.test(proxySrc);
  const hasAllowlist = proxySrc.includes('ALLOWED_PREFIXES');
  nonGetExportRe.lastIndex = 0;
  const hasMutation = nonGetExportRe.test(proxySrc);
  if (!hasGet) gate6Violations.push('loom proxy missing GET export');
  if (!hasAllowlist) gate6Violations.push('loom proxy missing ALLOWED_PREFIXES allowlist');
  if (hasMutation) gate6Violations.push('loom proxy exports a non-GET handler');
} catch (_) {
  gate6Violations.push('loom proxy route not found at ' + LOOM_PROXY.replace(WEAVE_SRC, 'src'));
}

const gate6 = gate6Violations.length === 0 ? 'PASS' : 'FAIL';
process.stderr.write('Gate 6 (zero-mutation): ' + gate6 + (gate6Violations.length ? ' — ' + gate6Violations.join('; ') : '') + '\n');

// ─── Section E: Gate 7 — Enum-union lint (child process) ──────────────────────
// Fails (exit 1) if any status literal at a call site is not in the LIVE enum
// union extracted from live-weave-ref. Run as a child so the lint stays a
// standalone, independently-runnable checker.
const enumLintPath = join(HARNESS_DIR, 'enum_lint.mjs');
const enumLint = spawnSync('node', [enumLintPath], { encoding: 'utf8' });
const gate7 = enumLint.status === 0 ? 'PASS' : 'FAIL';
const gate7Detail = ((enumLint.stdout || '') + (enumLint.stderr || '')).trim();
process.stderr.write('Gate 7 (enum-union lint): ' + gate7 + '\n');


// ─── Build Markdown ───────────────────────────────────────────────────────────
const lines = [];
lines.push('# Weave Feature Parity Report');
lines.push('Generated: ' + new Date().toISOString());
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(mdTable(['Metric', 'Count'], [
  ['Controllers PRESENT (all endpoints found in sandbox source)', String(ctrlPresent.length)],
  ['Controllers PARTIAL (some endpoints genuinely missing from sandbox source)', String(ctrlPartial.length)],
  ['Controllers MISSING (no endpoints found in sandbox source)', String(ctrlMissing.length)],
  ['Live Features PRESENT (sandbox nav + endpoint coverage)', String(featPresent.length)],
  ['Live Features PARTIAL (sandbox nav exists, some endpoints missing or TE-only)', String(featPartial.length)],
  ['Live Features MISSING (absent from sandbox entirely)', String(featMissing.length)],
  ['Extra sandbox improvements (not in live Loom nav)', String(extraSandboxItems.length)],
  ['TE-only entities (data via generic table-explorer, no dedicated view)', String(allTeOnlyEntities.length)],
]));
lines.push('');
lines.push('---');
lines.push('');
lines.push('## Section A — Gap Analysis by Controller');
lines.push('');
lines.push('> **Method**: For each controller in `endpoint-dto-map.json`, strip path params to get static prefixes,');
lines.push('> then grep all `weave/src/**/*.ts(x)` files. PRESENT = all found; PARTIAL = some genuinely missing; MISSING = none found.');
lines.push('> `/get/table-explorer/data/<entity>` paths are marked COVERED-VIA-TABLE-EXPLORER (dynamic wrapper in source)');
lines.push('> and are excluded from the missing-endpoints list. (No endpoint-dto-map controller currently has TE paths —');
lines.push('> those are distributed per-entity in the Java backend but not listed in domain endpoint arrays.)');
lines.push('');
lines.push('### MISSING Controllers (' + ctrlMissing.length + ')');
if (ctrlMissing.length === 0) lines.push('_None_');
else lines.push(mdTable(['Controller', 'Domain', 'Endpoints', 'Sample Path'], ctrlMissing.map(([ctrl, v]) => [ctrl, v.domain, String(v.total), v.samplePath])));

lines.push('');
lines.push('### PARTIAL Controllers (' + ctrlPartial.length + ')');
if (ctrlPartial.length === 0) lines.push('_None_');
else lines.push(mdTable(['Controller', 'Domain', 'Total Eps', 'Found', 'Missing Endpoint Paths'], ctrlPartial.map(([ctrl, v]) => [ctrl, v.domain, String(v.total), String(v.found), v.missingEndpoints.join(' ; ') || '_none (TE-covered)_'])));

lines.push('');
lines.push('### PRESENT Controllers (' + ctrlPresent.length + ')');
if (ctrlPresent.length === 0) lines.push('_None_');
else lines.push(mdTable(['Controller', 'Domain', 'Endpoints'], ctrlPresent.map(([ctrl, v]) => [ctrl, v.domain, String(v.total)])));

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Section B — Sandbox Improvements (EXTRA — not gaps)');
lines.push('');
lines.push('Sandbox nav items with no counterpart in the live Loom nav (intentional additions):');
lines.push('');
if (extraSandboxItems.length === 0) lines.push('_None_');
else extraSandboxItems.forEach(s => lines.push('- **' + s + '**'));

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Section C — Live Feature Gap (live-nav.json vs sandbox)');
lines.push('');
lines.push('> **Method**: For each live-nav item, check explicit NAV_ALIAS map first, then fuzzy-match against sandbox NAV_BASE.');
lines.push('> No match → MISSING. Match found → check related endpoints from contract-manifest.json against sandbox source.');
lines.push('> Endpoints are classified as: FOUND (in source directly), COVERED-VIA-TABLE-EXPLORER (dynamic TE wrapper),');
lines.push('> or GENUINELY-MISSING (not in source and not a TE path).');
lines.push('> Status: PRESENT = all covered; PARTIAL = has genuine gaps OR TE-only sub-features (no dedicated view).');
lines.push('');
lines.push('### MISSING Live Features (' + featMissing.length + ')');
if (featMissing.length === 0) lines.push('_None_');
else lines.push(mdTable(['Live Nav Item', 'Section', 'Notes'], featMissing.map(f => [f.liveItem, f.liveSection, 'No sandbox nav item found'])));

lines.push('');
lines.push('### PARTIAL Live Features (' + featPartial.length + ')');
if (featPartial.length === 0) lines.push('_None_');
else featPartial.forEach(f => {
  lines.push('');
  lines.push('**' + f.liveItem + '** (sandbox: `' + f.sandboxMatch + '`)');
  lines.push('- Found directly: ' + (f.foundEndpoints.length ? f.foundEndpoints.map(p => '`' + p + '`').join(', ') : '_none_'));
  if (f.missingEndpoints.length > 0) {
    lines.push('- Genuinely missing (not in source, not via TE): ' + f.missingEndpoints.map(p => '`' + p + '`').join(', '));
  } else {
    lines.push('- Genuinely missing: _none_');
  }
  if (f.tableExplorerOnlyEndpoints && f.tableExplorerOnlyEndpoints.length > 0) {
    lines.push('- Covered via Table Explorer (data reachable, no dedicated view): ' + f.tableExplorerOnlyEndpoints.map(p => '`' + p + '`').join(', '));
  }
});

lines.push('');
lines.push('### PRESENT Live Features (' + featPresent.length + ')');
if (featPresent.length === 0) lines.push('_None_');
else featPresent.forEach(f => lines.push('- **' + f.liveItem + '** → sandbox `' + (f.sandboxMatch || '—') + '`'));

lines.push('');
lines.push('### Table Explorer Only Entities (' + allTeOnlyEntities.length + ' entities across all features)');
lines.push('');
lines.push('> These entities are data-reachable via the generic `/table-explorer` page but have no dedicated');
lines.push('> sandbox feature view. Useful port-backlog signal — not a gap in the strict sense, but worth');
lines.push('> dedicated pages for each as the sandbox matures.');
lines.push('');
if (allTeOnlyEntities.length === 0) lines.push('_None_');
else allTeOnlyEntities.forEach(e => lines.push('- `' + e + '`'));

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Nav Diff');
lines.push('');
lines.push('### Present in live nav but ABSENT in sandbox');
if (featMissing.length === 0) lines.push('_None_');
else featMissing.forEach(f => lines.push('- **' + f.liveItem + '** (' + f.liveSection + ')'));

lines.push('');
lines.push('### Present in live nav with PARTIAL sandbox coverage');
if (featPartial.length === 0) lines.push('_None_');
else featPartial.forEach(f => {
  lines.push('- **' + f.liveItem + '** → sandbox `' + f.sandboxMatch + '`');
  if (f.missingEndpoints.length > 0) {
    lines.push('  - Genuinely missing: ' + f.missingEndpoints.join(', '));
  }
  if (f.tableExplorerOnlyEndpoints && f.tableExplorerOnlyEndpoints.length > 0) {
    lines.push('  - TE-only (no dedicated view): ' + f.tableExplorerOnlyEndpoints.join(', '));
  }
});

lines.push('');
lines.push('---');
lines.push('');
lines.push('## Validation Gate Results');
lines.push('');
lines.push(mdTable(['#', 'Feature', 'Expected', 'Actual', 'Pass?'], [
  ['1', 'Impact Factor (ImpactFactorController / `/get/impact/order/{orderId}`)', 'PRESENT', gate1, gate1 === 'PRESENT' ? '✓ PASS' : '✗ FAIL'],
  ['2', 'Manage Whatsapp — consent + notification-history both found (whatsapp-api.ts + dedicated history tab in WhatsAppClient.tsx)', 'PRESENT', gate2, gate2 === 'PRESENT' ? '✓ PASS' : '✗ FAIL'],
  ['3', 'Manage Logistics', 'PRESENT', gate3, gate3 === 'PRESENT' ? '✓ PASS' : '✗ FAIL'],
  ['4', 'Wholesale Program (alias ok; loyalty-config is TE-only -> PARTIAL)', 'PARTIAL', gate4, gate4 === 'PARTIAL' ? '\u2713 PASS' : '\u2717 FAIL'],
  ['5', 'Artisan Payments (workflow artisan-payments)', 'MISSING', gate5, gate5 === 'MISSING' ? '✓ PASS' : '✗ FAIL'],
  ['6', 'Zero mutation (read-only invariant: no non-GET handlers under api/(impact|logistics|wholesale|loom), no mutating fetches in whatsapp/impact/logistics/wholesale, allowlisted GET-only loom proxy)', 'PASS', gate6, gate6 === 'PASS' ? '✓ PASS' : '✗ FAIL'],
  ['7', 'Enum-union lint (status literals at getWorkflowList / derive* / status-styling call sites must be in the live OrderStatus / PaymentStatus / WorkflowStatus union)', 'PASS', gate7, gate7 === 'PASS' ? '✓ PASS' : '✗ FAIL'],
  ['8', 'Order Feedback (Manage Feedbacks -> dedicated /order-feedback list + detail; both GET endpoints found in source, nav item present, read-only)', 'PRESENT', gate8, gate8 === 'PRESENT' ? '✓ PASS' : '✗ FAIL'],
]));
lines.push('');
lines.push('> **ImpactFactorController (Section A note)**: Controller-level analysis shows **' + impactCtrlStatus + '**');
lines.push('> because `/get/impact/order/` IS present in `artisanflow-api.ts` (called by the Traceability feature).');
lines.push('> Feature-level analysis (Section C) now shows **PRESENT** — a dedicated /impact nav item');
lines.push('> was added to the sandbox; Impact Factor surfaces as a standalone feature (not only inline in Traceability.');
if (gate2Detail) {
  lines.push('');
  lines.push('> **Manage Whatsapp (Section C detail)**: Found `' + gate2Detail.foundEndpoints.join('`, `') + '`.');
  if (gate2Detail.missingEndpoints && gate2Detail.missingEndpoints.length > 0) {
    lines.push('> Genuinely missing: `' + gate2Detail.missingEndpoints.join('`, `') + '`.');
  } else {
    lines.push('> Genuinely missing: _none_.');
  }
  if (gate2Detail.tableExplorerOnlyEndpoints && gate2Detail.tableExplorerOnlyEndpoints.length > 0) {
    lines.push('> Covered via Table Explorer (data reachable, no dedicated view): `' + gate2Detail.tableExplorerOnlyEndpoints.join('`, `') + '`.');
  }
  lines.push('> Gate originally expected PARTIAL (notification-history was not yet ported). It is now PRESENT:');
  lines.push('> `weave/src/lib/whatsapp-api.ts` added a dedicated `getWhatsAppNotificationHistory()` that');
  lines.push('> hardcodes `/get/table-explorer/data/whatsapp-notification-history`, and `WhatsAppClient.tsx`');
  lines.push('> renders a full "Message History" tab backed by it. Both endpoints found directly in source.');
}
lines.push('');

const md = lines.join(NL);
writeFileSync(join(HARNESS_DIR, 'weave-parity-report.md'), md);
process.stdout.write(md + NL);

process.stdout.write('\n## Gate 6 — Zero Mutation Detail\n');
if (gate6Violations.length === 0) {
  process.stdout.write('No mutation vectors found. Read-only invariant holds.\n');
} else {
  process.stdout.write('VIOLATIONS:\n' + gate6Violations.map((v) => '- ' + v).join('\n') + '\n');
}

process.stdout.write('\n## Gate 7 — Enum-union Lint Detail\n' + gate7Detail + '\n');

const allGatesPass =
  gate1 === 'PRESENT' &&
  gate2 === 'PRESENT' &&
  gate3 === 'PRESENT' &&
  gate4 === 'PARTIAL' &&
  gate5 === 'MISSING' &&
  gate6 === 'PASS' &&
  gate7 === 'PASS' &&
  gate8 === 'PRESENT';
if (!allGatesPass) {
  process.stderr.write('\nONE OR MORE GATES FAILED\n');
  process.exitCode = 1;
}

