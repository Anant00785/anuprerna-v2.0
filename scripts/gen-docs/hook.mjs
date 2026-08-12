#!/usr/bin/env node
/**
 * PostToolUse hook: keeps docs/generated in step with the code, automatically.
 *
 * Reads the hook payload on stdin. If the edited file is source under apps/ or
 * packages/, it regenerates docs/generated and reports back which files changed —
 * so the docs are already correct by the time anyone looks, rather than drifting
 * until CI complains.
 *
 * It also nudges when a change likely invalidates a HAND-WRITTEN doc. A generator
 * cannot write prose, so the honest split is: mechanical facts regenerate silently,
 * and the narrative docs get a reminder pointing at the specific file to check.
 *
 * Never blocks and never fails the turn. A docs hook that interrupts work gets
 * disabled within a week, and then the docs rot again — which is the exact failure
 * this repository already had once.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

const done = (obj) => {
  if (obj) process.stdout.write(JSON.stringify(obj));
  process.exit(0);
};

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  done(); // malformed payload is not our problem — stay quiet
}

const file =
  payload?.tool_response?.filePath ?? payload?.tool_input?.file_path ?? "";
if (!file) done();

const norm = file.split("\\").join("/");
if (!/\/anuprerna-platform\/(apps|packages)\//.test(norm)) done();
if (!/\.(ts|tsx|mjs|js)$/.test(norm)) done();
if (/\/(node_modules|\.next|dist|\.turbo)\//.test(norm)) done();

// Regenerate. Failure here must never surface as a broken turn.
let changed = "";
try {
  changed = execFileSync("node", [join(ROOT, "scripts", "gen-docs", "index.mjs")], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60_000,
  }).trim();
} catch {
  done();
}

const regenerated = /\(\d+ changed\)/.test(changed);

// Hand-written docs a generator cannot maintain. Map the touched area to the doc
// most likely now stale, and say so — once, specifically, not as blanket nagging.
const NARRATIVE = [
  [/\/apps\/api\/src\/database\/schema\//, "docs/DATA-INVENTORY.md and docs/KNOWN-GAPS.md (schema changed)"],
  [/\/apps\/api\/src\/auth\//, "docs/KNOWN-GAPS.md and docs/DATA-FLOW.md (auth changed)"],
  [/\/apps\/api\/src\/commerce\/payment\//, "docs/KNOWN-GAPS.md (payments are a tracked gap)"],
  [/\/api\/backend\/\[\.\.\.path\]\//, "docs/KNOWN-GAPS.md and docs/SECURITY notes (the proxy is load-bearing)"],
  [/\/src\/(stores|lib\/api)\//, "docs/DATA-FLOW.md and docs/STATE-INVENTORY.md"],
  [/\.module\.ts$/, "docs/MODULE-MAP.md"],
];
const hint = NARRATIVE.find(([re]) => re.test(norm))?.[1];

if (!regenerated && !hint) done();

const parts = [];
if (regenerated) parts.push("docs/generated refreshed automatically");
if (hint) parts.push(`hand-written docs may now be stale — check ${hint}`);

done({
  systemMessage: `Docs: ${parts.join("; ")}.`,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext:
      `Docs reconciliation: ${parts.join("; ")}. ` +
      (regenerated
        ? "The regenerated files under docs/generated/ are already updated and should be committed with this change. "
        : "") +
      (hint
        ? "Generated docs cannot cover narrative content — update the named document if this change altered behaviour it describes, and keep docs/KNOWN-GAPS.md truthful."
        : ""),
  },
});
