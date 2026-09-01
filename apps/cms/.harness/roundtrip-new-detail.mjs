#!/usr/bin/env node
/**
 * Second round-trip: prove the NEW task-level editor actually WRITES.
 *
 * Types a brand-new detail into the "Processed Yarn QC" TASK and another into
 * the "Fabric Finishing" STAGE through the real builder, saves, and checks each
 * one landed on the right node (sub-process vs step) with the builder's default
 * spec (string / required) — while the five Loom-synced properties keep their
 * own datatype/valuetype, including `deferred`.
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
const beHeaders = { "Content-Type": "application/json", Origin: "localhost", Authorization: `Bearer ${TOKEN}` };

const readTemplate = async (id) =>
  (await (await fetch(`${BACKEND}/get/workflow-template/${id}`, { headers: beHeaders, cache: "no-store" })).json()).workflowTemplate;

const crud = async (path, method, body) => {
  const r = await fetch(`${APP}/api/crud`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `${AUTH_COOKIE}=${TOKEN}` },
    body: JSON.stringify({ path, method, body }),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

const source = await readTemplate(490267);
const sourceSnapshot = JSON.stringify(source);
const create = await crud("add/workflow-template", "POST", {
  name: "ZZ new-detail probe (auto, delete me)",
  description: "typed-detail round-trip",
  productAssociated: true,
  steps: JSON.parse(JSON.stringify(source.steps)),
});
const probeId = Number(create.json?.id);
console.log(`[1] probe created: ${probeId}`);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2400 });
await page.setCookie({ name: AUTH_COOKIE, value: TOKEN, url: APP });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`${APP}/artisanflow/workflow/template/${probeId}/edit`, { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));

/** Map every "add a detail" button to the row that owns it, so the click target
 *  is chosen by MEANING (which task / which stage) and not by a bare index. */
const layout = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("button"))
    .filter((b) => /add a detail/i.test(b.textContent || ""))
    .map((b, i) => {
      const row = b.parentElement;
      const isTaskRow = /and records:/i.test(row?.textContent || "");
      const li = b.closest("li");
      const taskName = li ? (li.querySelector("input")?.value || "") : "";
      const card = b.closest(".rounded-xl");
      const stageName = card ? (card.querySelector("input")?.value || "") : "";
      return { i, level: isTaskRow ? "task" : "stage", taskName, stageName };
    });
});
console.log("[2] add-a-detail buttons:", JSON.stringify(layout, null, 0));

const taskBtn = layout.find((x) => x.level === "task" && x.taskName.trim() === "Processed Yarn QC");
const stageBtn = layout.find((x) => x.level === "stage" && x.stageName.trim() === "Fabric Finishing");
console.log(`[3] target task button #${taskBtn?.i}, target stage button #${stageBtn?.i}`);
if (!taskBtn || !stageBtn) { await browser.close(); console.error("target buttons not found"); process.exit(1); }

async function addDetail(buttonIndex, label) {
  await page.evaluate((idx) => {
    const b = Array.from(document.querySelectorAll("button")).filter((x) => /add a detail/i.test(x.textContent || ""))[idx];
    b.click();
  }, buttonIndex);
  await new Promise((r) => setTimeout(r, 400));
  // The newly minted chip is the only EMPTY detail input on the page.
  await page.evaluate((text) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    const input = Array.from(document.querySelectorAll("input")).find(
      (i) => !i.value && /^e\.g\. (Warp Yarn|Target GSM)/.test(i.placeholder || ""),
    );
    if (!input) throw new Error("no empty detail input appeared");
    setter.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, label);
  await new Promise((r) => setTimeout(r, 300));
}

await addDetail(taskBtn.i, "Probe Task Detail");
await addDetail(stageBtn.i, "Probe Stage Detail");
console.log("[4] typed both new details");

await page.evaluate(() => {
  Array.from(document.querySelectorAll("button")).find((x) => /save template/i.test(x.textContent || "")).click();
});
await new Promise((r) => setTimeout(r, 6000));
console.log(`[5] url after save: ${page.url()}  console errors: ${JSON.stringify(errs)}`);
await browser.close();

const after = await readTemplate(probeId);
const rows = [];
for (const s of after.steps || []) {
  for (const p of s.properties || []) rows.push(`STAGE[${s.name.trim()}] ${p.key} :: ${p.datatype} / ${p.valuetype}`);
  for (const sp of s.subProcesses || []) for (const p of sp.properties || [])
    rows.push(`TASK[${s.name.trim()} > ${sp.name.trim()}] ${p.key} :: ${p.datatype} / ${p.valuetype}`);
}
rows.sort();
console.log("[6] properties on the saved probe:");
rows.forEach((r) => console.log("      " + r));

const expected = [
  "STAGE[Fabric Finishing] Probe Stage Detail :: string / required",
  "STAGE[Yarn Processing] Target GSM :: number / required",
  "STAGE[Yarn Weaving] Original Sample EPI * PPI :: string / required",
  "TASK[Fabric Finishing > QC Fabric] Comments on the Quality :: string / deferred",
  "TASK[Yarn Processing > Processed Yarn QC] Probe Task Detail :: string / required",
  "TASK[Yarn Processing > Yarn Processing] Warp Yarn Color & Shade :: string / required",
  "TASK[Yarn Processing > Yarn Processing] Weft Yarn Color & Shade :: string / required",
].sort();
let match = 0; const mismatch = [];
for (const k of new Set([...rows, ...expected])) {
  if (rows.includes(k) && expected.includes(k)) match += 1;
  else mismatch.push((expected.includes(k) ? "MISSING:   " : "UNEXPECTED:") + " " + k);
}
console.log(`[7] vs expected: match=${match} mismatch=${mismatch.length}`);
mismatch.forEach((m) => console.log("      " + m));

const del = await crud(`delete/workflow-template/${probeId}`, "DELETE", {});
console.log(`[8] probe deleted -> ${del.status} ${JSON.stringify(del.json)}`);
const srcNow = await readTemplate(490267);
console.log(`[9] 490267 byte-identical to snapshot: ${JSON.stringify(srcNow) === sourceSnapshot}`);

const pass = mismatch.length === 0 && JSON.stringify(srcNow) === sourceSnapshot && errs.length === 0;
console.log(pass ? "\nTYPED-DETAIL ROUND-TRIP: PASS" : "\nTYPED-DETAIL ROUND-TRIP: FAIL");
process.exit(pass ? 0 : 1);
