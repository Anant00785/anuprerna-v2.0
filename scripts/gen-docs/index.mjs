#!/usr/bin/env node
/**
 * Generates the mechanical documentation under docs/generated/.
 *
 * Everything here is derived from the code by scanning, never hand-written. That is
 * the point: this repository's docs rotted once already — `src/lib/api.ts` was
 * mandated by three separate documents while having zero importers, and
 * ENGINEERING-GUIDE.md described a CMS auth middleware that never existed. A
 * document that regenerates cannot lie for long; a document that is typed by hand
 * eventually does.
 *
 *   node scripts/gen-docs/index.mjs          write the files
 *   node scripts/gen-docs/index.mjs --check  regenerate and fail if anything changed
 *
 * `--check` is what CI runs. If it fails, someone changed code without regenerating,
 * and the fix is to run this script and commit the result — never to edit
 * docs/generated/ by hand.
 *
 * Deliberately dumb: regex and directory scans, no AST library, no framework.
 * Output is sorted so diffs are stable. Keep it that way — a generator that becomes
 * a maintenance burden gets deleted, and then the docs rot again.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const OUT = join(ROOT, "docs", "generated");
const CHECK = process.argv.includes("--check");

const SKIP = new Set(["node_modules", ".next", "dist", ".turbo", ".git", "coverage"]);

function walk(dir, filter, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, filter, acc);
    else if (filter(full)) acc.push(full);
  }
  return acc;
}

const rel = (p) => relative(ROOT, p).split(sep).join("/");
const read = (p) => readFileSync(p, "utf8");
const isTest = (p) => /\.(spec|test)\.(ts|tsx)$/.test(p);

const header = (title, what) =>
  `# ${title}\n\n` +
  `> **Generated file — do not edit.** Produced by \`scripts/gen-docs/index.mjs\` from the code\n` +
  `> itself. Run \`pnpm docs:gen\` to refresh; CI runs \`pnpm docs:check\` and fails if this file is\n` +
  `> stale. ${what}\n\n`;

// ─── routes ────────────────────────────────────────────────────────────────
function genRoutes() {
  const rows = [];
  for (const app of ["storefront", "cms"]) {
    const base = join(ROOT, "apps", app, "src", "app");
    for (const f of walk(base, (p) => /\/page\.tsx$/.test(p.split(sep).join("/")))) {
      const route = "/" + relative(base, f).split(sep).slice(0, -1).join("/");
      const src = read(f);
      rows.push({
        app,
        route: route === "/" ? "/" : route,
        client: /^["']use client["']/m.test(src) ? "client" : "server",
        file: rel(f),
      });
    }
  }
  rows.sort((a, b) => a.app.localeCompare(b.app) || a.route.localeCompare(b.route));
  const counts = rows.reduce((m, r) => ({ ...m, [r.app]: (m[r.app] || 0) + 1 }), {});
  let md = header("Routes", "Every page route in both frontends.");
  md += Object.entries(counts).map(([a, n]) => `- \`apps/${a}\`: **${n}** routes`).join("\n") + "\n\n";
  md += "| App | Route | Rendering | File |\n|---|---|---|---|\n";
  for (const r of rows) md += `| ${r.app} | \`${r.route}\` | ${r.client} | \`${r.file}\` |\n`;
  return md;
}

// ─── api endpoints ─────────────────────────────────────────────────────────
function genEndpoints() {
  const controllers = walk(join(ROOT, "apps", "api", "src"), (p) => p.endsWith(".controller.ts") && !isTest(p));
  const rows = [];
  for (const f of controllers) {
    const src = read(f);
    const base = (src.match(/@Controller\(\s*["'`]([^"'`]*)["'`]/) || [, ""])[1];
    for (const m of src.matchAll(/@(Get|Post|Patch|Put|Delete)\(\s*(?:["'`]([^"'`]*)["'`])?/g)) {
      const path = "/" + [base, m[2] || ""].filter(Boolean).join("/").replace(/^\/+/, "");
      rows.push({ method: m[1].toUpperCase(), path, file: rel(f) });
    }
  }
  rows.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  // What the frontends actually call, which is a different population entirely.
  const callers = [
    ...walk(join(ROOT, "apps", "storefront", "src", "lib"), (p) => p.endsWith(".ts") && !isTest(p)),
    ...walk(join(ROOT, "apps", "cms", "src", "services"), (p) => p.endsWith(".ts") && !isTest(p)),
  ];
  const called = new Set();
  for (const f of callers) {
    for (const m of read(f).matchAll(/["'`](\/(?:get|add|update|delete|create|search|authenticate|v1|v2)\/[^"'`$\s]*)["'`]/g)) {
      called.add(m[1]);
    }
  }

  const byMethod = rows.reduce((m, r) => ({ ...m, [r.method]: (m[r.method] || 0) + 1 }), {});
  let md = header("Endpoint inventory", "What `apps/api` exposes, and what the frontends actually call.");
  md += `**apps/api exposes ${rows.length} routes** across ${controllers.length} controllers `;
  md += `(${Object.entries(byMethod).sort().map(([k, v]) => `${k} ${v}`).join(", ")}).\n\n`;
  md += `**The frontends call ${called.size} distinct legacy paths**, against the live Java backend — `;
  md += `not against \`apps/api\`. Those two populations are still almost entirely disjoint; closing that\n`;
  md += `gap is the migration. See \`docs/KNOWN-GAPS.md\`.\n\n`;
  md += "## apps/api routes\n\n| Method | Path | Controller |\n|---|---|---|\n";
  for (const r of rows) md += `| ${r.method} | \`${r.path}\` | \`${r.file}\` |\n`;
  md += "\n## Legacy paths the frontends call\n\n";
  for (const p of [...called].sort()) md += `- \`${p}\`\n`;
  return md;
}

// ─── test catalogue ────────────────────────────────────────────────────────
function genTests() {
  const files = walk(join(ROOT, "apps"), isTest).concat(walk(join(ROOT, "packages"), isTest));
  const byPkg = {};
  let total = 0;
  for (const f of files.sort()) {
    const src = read(f);
    const cases = [...src.matchAll(/^\s*(?:it|test)(?:\.\w+)?\(\s*["'`]([^"'`]+)/gm)].map((m) => m[1]);
    total += cases.length;
    const pkg = rel(f).split("/").slice(0, 2).join("/");
    (byPkg[pkg] ||= []).push({ file: rel(f), cases });
  }
  let md = header("Test catalogue", "Every test in the repository and the behaviour it protects.");
  md += `**${total} tests across ${files.length} files.**\n\n`;
  md += Object.entries(byPkg).sort()
    .map(([p, fs]) => `- \`${p}\` — ${fs.length} files, ${fs.reduce((n, f) => n + f.cases.length, 0)} tests`)
    .join("\n") + "\n";
  for (const [pkg, fs] of Object.entries(byPkg).sort()) {
    md += `\n## ${pkg}\n`;
    for (const { file, cases } of fs) {
      md += `\n### \`${file}\` — ${cases.length}\n`;
      for (const c of cases) md += `- ${c}\n`;
    }
  }
  return md;
}

// ─── database schema ───────────────────────────────────────────────────────
function genSchema() {
  const f = join(ROOT, "apps", "api", "src", "database", "schema", "schema.ts");
  if (!existsSync(f)) return header("Database schema", "Not found.") + "`schema.ts` is missing.\n";
  const src = read(f);
  const tables = [...src.matchAll(/pgTable\("([a-z_0-9]+)"/g)].map((m) => m[1]).sort();
  const enums = [...src.matchAll(/pgEnum\("([a-z_0-9]+)",\s*\[([^\]]*)\]/g)]
    .map((m) => ({ name: m[1], values: m[2].replace(/['"\s]/g, "").split(",").filter(Boolean) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  let md = header("Database schema", "Introspected from the production database — see `docs/KNOWN-GAPS.md` for the introspect defects that must be re-applied after every regenerate.");
  md += `**${tables.length} tables, ${enums.length} enum types.**\n\n## Tables\n\n`;
  md += tables.map((t) => `- \`${t}\``).join("\n");
  md += "\n\n## Enums\n\n| Type | Values |\n|---|---|\n";
  for (const e of enums) md += `| \`${e.name}\` | ${e.values.map((v) => `\`${v}\``).join(", ")} |\n`;
  return md;
}

// ─── state inventory ───────────────────────────────────────────────────────
function genState() {
  const files = [
    ...walk(join(ROOT, "apps", "storefront", "src"), (p) => /\.tsx?$/.test(p) && !isTest(p)),
    ...walk(join(ROOT, "apps", "cms", "src"), (p) => /\.tsx?$/.test(p) && !isTest(p)),
  ];
  const storage = new Map(), cookies = new Map(), stores = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/(localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*["'`]([^"'`]+)/g)) {
      (storage.get(`${m[1]}:${m[2]}`) || storage.set(`${m[1]}:${m[2]}`, new Set()).get(`${m[1]}:${m[2]}`)).add(rel(f));
    }
    for (const m of src.matchAll(/document\.cookie\s*=\s*[`"']?\$?\{?([a-zA-Z_][\w-]*)/g)) {
      (cookies.get(m[1]) || cookies.set(m[1], new Set()).get(m[1])).add(rel(f));
    }
    if (/\bcreate[<(]/.test(src) && /zustand/.test(src)) stores.push(rel(f));
  }
  let md = header("State inventory", "Where client state actually lives — every storage key, cookie and store, found by scanning.");
  md += `**${stores.length} stores, ${storage.size} storage keys, ${cookies.size} cookie writes.**\n\n`;
  md += "## Zustand stores\n\n" + (stores.sort().map((s) => `- \`${s}\``).join("\n") || "_none_") + "\n\n";
  md += "## Storage keys\n\n| Key | Written/read in |\n|---|---|\n";
  for (const [k, fs] of [...storage].sort()) md += `| \`${k}\` | ${[...fs].sort().map((f) => `\`${f}\``).join("<br>")} |\n`;
  md += "\n## Cookies\n\n| Name | Set in |\n|---|---|\n";
  for (const [k, fs] of [...cookies].sort()) md += `| \`${k}\` | ${[...fs].sort().map((f) => `\`${f}\``).join("<br>")} |\n`;
  return md;
}

// ─── run ───────────────────────────────────────────────────────────────────
const outputs = {
  "routes.md": genRoutes,
  "endpoints.md": genEndpoints,
  "test-catalogue.md": genTests,
  "schema.md": genSchema,
  "state-inventory.md": genState,
};

mkdirSync(OUT, { recursive: true });
let stale = [];
for (const [name, fn] of Object.entries(outputs)) {
  const path = join(OUT, name);
  let next;
  try {
    next = fn();
  } catch (err) {
    console.error(`generator failed for ${name}: ${err.message}`);
    process.exit(1);
  }
  const prev = existsSync(path) ? read(path) : null;
  if (prev !== next) {
    stale.push(name);
    if (!CHECK) writeFileSync(path, next);
  }
}

if (CHECK && stale.length) {
  console.error(`docs/generated is stale: ${stale.join(", ")}`);
  console.error("Run `pnpm docs:gen` and commit the result. Do not edit these files by hand.");
  process.exit(1);
}
console.log(CHECK ? "docs/generated is up to date" : `wrote ${Object.keys(outputs).length} files${stale.length ? ` (${stale.length} changed)` : " (no changes)"}`);
