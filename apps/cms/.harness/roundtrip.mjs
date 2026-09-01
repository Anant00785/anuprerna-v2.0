#!/usr/bin/env node
/**
 * Round-trip proof for the template builder.
 *
 *   1. CREATE a probe template whose `steps` are a byte-copy of live-synced
 *      template 490267's (POST add/workflow-template through the app's own
 *      /api/crud, exactly the path the builder uses).
 *   2. OPEN /artisanflow/workflow/template/<probe>/edit in a real browser and
 *      click "Save template" — so the data goes through deriveStage -> React
 *      state -> toBackendSteps -> /api/crud -> backend, with nothing stubbed.
 *   3. RE-READ the probe and diff its properties against 490267's, key by key,
 *      including datatype and valuetype.
 *   4. DELETE the probe and re-verify 490267 is byte-identical to its snapshot.
 *
 * 490267 itself is NEVER saved: /api/crud's UPDATE_BAND_PATH does not cover
 * update/workflow-template, so a save there really would rewrite a live-synced
 * row. That is precisely why the probe exists.
 */
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const puppeteer = require("/home/clawd/.npm-global/lib/node_modules/puppeteer");

const APP = (process.env.BASE_URL || "http://localhost:3010").replace(/\/$/, "");
const BACKEND = process.env.BACKEND_URL || "http://localhost:8090";
const AUTH_COOKIE = "weave_token";
const TOKEN = (fs.readFileSync("/home/clawd/weave-tmpl-fix/.env.local", "utf8")
  .match(/^SANDBOX_ADMIN_TOKEN=(.*)$/m) || [, ""])[1].trim();
const SOURCE_ID = 490267;

const beHeaders = { "Content-Type": "application/json", Origin: "localhost", Authorization: `Bearer ${TOKEN}` };

async function readTemplate(id) {
  const r = await fetch(`${BACKEND}/get/workflow-template/${id}`, { headers: beHeaders, cache: "no-store" });
  const j = await r.json();
  return j.workflowTemplate ?? j;
}

async function crud(path, method, body) {
  const r = await fetch(`${APP}/api/crud`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE}=${TOKEN}` },
    body: JSON.stringify({ path, method, body }),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}

/** Flatten a template's steps into comparable "where -> property" rows. */
function propRows(tpl) {
  const rows = [];
  for (const s of tpl.steps || []) {
    for (const p of s.properties || []) {
      rows.push(`STAGE[${(s.name || "").trim()}] ${p.key} :: ${p.datatype} / ${p.valuetype}`);
    }
    for (const sp of s.subProcesses || []) {
      for (const p of sp.properties || []) {
        rows.push(`TASK[${(s.name || "").trim()} > ${(sp.name || "").trim()}] ${p.key} :: ${p.datatype} / ${p.valuetype}`);
      }
    }
  }
  return rows.sort();
}

function diff(a, b) {
  let match = 0;
  const mismatch = [];
  const all = new Set([...a, ...b]);
  for (const k of all) {
    if (a.includes(k) && b.includes(k)) match += 1;
    else mismatch.push((a.includes(k) ? "ONLY-BEFORE: " : "ONLY-AFTER:  ") + k);
  }
  return { match, mismatch };
}

const source = await readTemplate(SOURCE_ID);
const sourceSnapshot = JSON.stringify(source);
console.log(`[1] source template ${SOURCE_ID} "${source.name}" — ${propRows(source).length} properties across ${source.steps.length} stages`);
for (const r of propRows(source)) console.log("      " + r);

// ── 1. create the probe ─────────────────────────────────────────────────────
const create = await crud("add/workflow-template", "POST", {
  name: "ZZ round-trip probe (auto, delete me)",
  description: "Byte-copy of 490267 steps — created by .harness/roundtrip.mjs",
  productAssociated: true,
  steps: JSON.parse(JSON.stringify(source.steps)),
});
console.log(`[2] create -> HTTP ${create.status} ${JSON.stringify(create.json)}`);
const probeId = Number(create.json?.id);
if (!Number.isInteger(probeId) || probeId <= 0) { console.error("FAILED to create probe"); process.exit(1); }

const probeBefore = await readTemplate(probeId);
const rowsSource = propRows(source);
const rowsProbeBefore = propRows(probeBefore);
const d0 = diff(rowsSource, rowsProbeBefore);
console.log(`[3] probe ${probeId} as CREATED vs source: match=${d0.match} mismatch=${d0.mismatch.length}`);
d0.mismatch.forEach((m) => console.log("      " + m));

// ── 2. real browser save ────────────────────────────────────────────────────
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.setCookie({ name: AUTH_COOKIE, value: TOKEN, url: APP });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
await page.goto(`${APP}/artisanflow/workflow/template/${probeId}/edit`, { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));

const seen = await page.evaluate(() =>
  Array.from(document.querySelectorAll("input")).map((i) => i.value).filter(Boolean),
);
console.log(`[4] builder rendered these labels: ${JSON.stringify(seen)}`);

const clicked = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll("button")).find((x) => /save template/i.test(x.textContent || ""));
  if (!b) return false;
  b.click();
  return true;
});
console.log(`[5] clicked "Save template": ${clicked}`);
if (!clicked) { await browser.close(); process.exit(1); }
await new Promise((r) => setTimeout(r, 6000));
console.log(`[5b] url after save: ${page.url()}`);
console.log(`[5c] console errors during save: ${JSON.stringify(consoleErrors)}`);
await browser.close();

// ── 3. diff after the real save ─────────────────────────────────────────────
const probeAfter = await readTemplate(probeId);
const rowsProbeAfter = propRows(probeAfter);
const d1 = diff(rowsSource, rowsProbeAfter);
console.log(`[6] probe ${probeId} AFTER a real builder save vs source 490267:`);
console.log(`      match=${d1.match} mismatch=${d1.mismatch.length}`);
d1.mismatch.forEach((m) => console.log("      " + m));
for (const r of rowsProbeAfter) console.log("      kept: " + r);
const daysOk = JSON.stringify((source.steps || []).map((s) => [s.name.trim(), s.estimatedDays, (s.subProcesses || []).map((x) => [x.name.trim(), x.estimatedDays, x.feedbackRequired])]))
  === JSON.stringify((probeAfter.steps || []).map((s) => [s.name.trim(), s.estimatedDays, (s.subProcesses || []).map((x) => [x.name.trim(), x.estimatedDays, x.feedbackRequired])]));
console.log(`[7] names / estimatedDays / feedbackRequired identical to source: ${daysOk}`);

// ── 4. clean up + prove 490267 untouched ────────────────────────────────────
const del = await crud(`delete/workflow-template/${probeId}`, "DELETE", {});
console.log(`[8] delete probe -> HTTP ${del.status} ${JSON.stringify(del.json)}`);
const list = await fetch(`${BACKEND}/get/workflow-template-list`, { headers: beHeaders, cache: "no-store" }).then((r) => r.json());
const remaining = (list.workflowTemplateList || []).map((t) => `${t.id}:${t.name}`);
console.log(`[9] templates remaining (${remaining.length}): ${JSON.stringify(remaining)}`);

const sourceNow = await readTemplate(SOURCE_ID);
console.log(`[10] source 490267 byte-identical to its pre-test snapshot: ${JSON.stringify(sourceNow) === sourceSnapshot}`);

const pass = d1.mismatch.length === 0 && d1.match === rowsSource.length && daysOk && JSON.stringify(sourceNow) === sourceSnapshot;
console.log(pass ? "\nROUND-TRIP: PASS" : "\nROUND-TRIP: FAIL");
process.exit(pass ? 0 : 1);
