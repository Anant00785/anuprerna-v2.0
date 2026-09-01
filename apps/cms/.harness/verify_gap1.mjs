import { chromium } from "playwright";
const TOK = process.env.SANDBOX_ADMIN_TOKEN;
const BASE = "http://localhost:3010";
const API = "http://localhost:8090";
const WF = 114027735;
const SHOTS = "/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/shots";

async function detail() {
  const r = await fetch(`${API}/get/custom-workflow/${WF}`, { headers: { Authorization: "Bearer " + TOK, Origin: "localhost" } });
  const w = (await r.json()).workflow;
  const map = {}; map["_wf"] = w.status;
  for (const s of w.steps) { map[s.id] = s.status; for (const sp of (s.subProcesses||[])) map[sp.id] = sp.status; }
  return map;
}

const before = await detail();
console.log("BEFORE:", JSON.stringify(before));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
await ctx.addCookies([
  { name: "weave_token", value: TOK, domain: "localhost", path: "/" },
  { name: "weave_user", value: Buffer.from(JSON.stringify({email:"admin@anuprerna.com",name:"Admin"})).toString("base64"), domain:"localhost", path:"/" },
]);
const page = await ctx.newPage();
const crudPosts = [];
page.on("response", (r) => { if (r.url().includes("/api/crud") && r.request().method()==="POST") crudPosts.push(r.status()); });
await page.goto(`${BASE}/workflow/${WF}`, { waitUntil: "networkidle" });

const sel = 'select[title^="Advance this element"]';
await page.waitForSelector(sel, { timeout: 15000 });
const controls = await page.$$(sel);
console.log("ADVANCE CONTROLS ON PAGE:", controls.length);
await page.screenshot({ path: `${SHOTS}/gap1-before.png`, fullPage: true });

// The first PENDING-valued control is the "Fabric Finishing" STEP header select.
let targetIdx = -1;
for (let i=0;i<controls.length;i++){ const v = await controls[i].inputValue(); if (v==="PENDING"){ targetIdx=i; break; } }
if (targetIdx < 0) throw new Error("no PENDING control found to advance");
console.log("Advancing control #"+targetIdx+" (Fabric Finishing step) PENDING -> COMPLETED via UI");

// select COMPLETED; the onChange fires the /api/crud PATCH
await controls[targetIdx].selectOption("COMPLETED");
// wait for the crud POST to land
await page.waitForResponse((r)=> r.url().includes("/api/crud") && r.request().method()==="POST", { timeout: 15000 });
await page.waitForTimeout(1500); // allow router.refresh + re-render

await page.screenshot({ path: `${SHOTS}/gap1-after.png`, fullPage: true });

const after = await detail();
console.log("AFTER :", JSON.stringify(after));
console.log("CRUD POST statuses:", JSON.stringify(crudPosts));

// diff
const changed = Object.keys(after).filter(k => after[k] !== before[k]).map(k => `${k}: ${before[k]}->${after[k]}`);
console.log("PERSISTED CHANGES:", JSON.stringify(changed));

await browser.close();

// assertions
const fabricFinishing = 114027748;
if (after[fabricFinishing] !== "COMPLETED") { console.log("FAIL: Fabric Finishing did not persist as COMPLETED"); process.exit(1); }
if (controls.length < 3) { console.log("FAIL: too few advance controls"); process.exit(1); }
console.log("PASS: advance controls render ("+controls.length+") AND Fabric Finishing advance persisted to COMPLETED");
