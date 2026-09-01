#!/usr/bin/env node
/**
 * Geometric proof harness for the 2026-08-16 audit blockers.
 *  B-1: production-table scroller scrollWidth vs clientWidth at 1440 / 1600
 *  B-2: sidebar <aside> width at 390
 * Read-only: loads pages, measures, screenshots. Never clicks a write control.
 *
 *   BASE_URL=http://localhost:3071 LABEL=after node .harness/geom.mjs
 */
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || "/home/clawd/.npm-global/lib/node_modules/puppeteer");

const BASE = (process.env.BASE_URL || "http://localhost:3010").replace(/\/$/, "");
const LABEL = process.env.LABEL || "run";
const OUT = process.env.OUT_DIR || "/tmp/geom-2026-08-16";
fs.mkdirSync(OUT, { recursive: true });

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "weave_token";
function token() {
  if (process.env.SANDBOX_ADMIN_TOKEN) return process.env.SANDBOX_ADMIN_TOKEN;
  const txt = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = txt.match(/^SANDBOX_ADMIN_TOKEN=(.*)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}
const TOK = token();

const ORDER = "/artisanflow/custom-orders/132440539";
const PAGES = [
  { route: ORDER, name: "order" },
  { route: "/artisanflow/jobs", name: "jobs" },
  { route: "/artisanflow", name: "board" },
  { route: "/artisanflow/workflow/instance/136115709", name: "instance" },
];
const WIDTHS = [1440, 1600, 390];

const measure = () => {
  const out = { docScrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
  const aside = document.querySelector("aside");
  out.sidebarWidth = aside ? Math.round(aside.getBoundingClientRect().width) : null;
  // documentElement.scrollWidth misses this: <main> is overflow-y-auto, which
  // makes overflow-x compute to auto too, so anything too wide scrolls INSIDE
  // main and never widens the document. That is the same "hidden content, no
  // affordance" failure as B-1, one level down.
  const main = document.querySelector("main");
  out.mainScrollWidth = main ? main.scrollWidth : null;
  out.mainClientWidth = main ? main.clientWidth : null;
  out.mainOverflowPx = main ? main.scrollWidth - main.clientWidth : null;
  // Name the widest offenders so the fix is targeted, not guesswork.
  if (main && main.scrollWidth > main.clientWidth) {
    const lim = main.getBoundingClientRect().left + main.clientWidth;
    out.overflowers = Array.from(main.querySelectorAll("*"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.right <= lim + 1) return false;
        let p = el.parentElement;
        while (p && p !== main) {
          const ov = getComputedStyle(p).overflowX;
          if (ov === "auto" || ov === "scroll" || ov === "hidden") return false; // legitimately scrollable
          p = p.parentElement;
        }
        return true;
      })
      .slice(0, 6)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 60)} right=${Math.round(el.getBoundingClientRect().right - lim)}px over`);
  }
  const tables = Array.from(document.querySelectorAll("table"));
  out.tables = tables.map((t) => {
    let sc = t.parentElement;
    while (
      sc &&
      sc !== document.body &&
      getComputedStyle(sc).overflowX !== "auto" &&
      getComputedStyle(sc).overflowX !== "scroll"
    )
      sc = sc.parentElement;
    if (sc === document.body) sc = null;
    const heads = Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent.trim());
    const scRect = sc ? sc.getBoundingClientRect() : null;
    const ths = Array.from(t.querySelectorAll("thead th"));
    const stagesTh = ths.find((th) => /stages/i.test(th.textContent));
    const lastTh = ths[ths.length - 1];
    const inside = (el) => {
      if (!el || !scRect) return null;
      const r = el.getBoundingClientRect();
      return r.left >= scRect.left - 1 && r.right <= scRect.right + 1;
    };
    return {
      headers: heads,
      scrollWidth: sc ? sc.scrollWidth : null,
      clientWidth: sc ? sc.clientWidth : null,
      overflowPx: sc ? sc.scrollWidth - sc.clientWidth : null,
      stagesHeaderVisible: inside(stagesTh),
      lastColHeaderVisible: inside(lastTh),
    };
  });
  const openJob = Array.from(document.querySelectorAll("a,button")).filter((e) => /open job/i.test(e.textContent || ""));
  out.openJobCount = openJob.length;
  out.openJobAllInViewport = openJob.length
    ? openJob.every((e) => {
        const r = e.getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth + 1;
      })
    : null;
  const txt = document.body.innerText;
  out.noteMatches = (txt.match(/Note:/gi) || []).length;
  out.mariam = /Mariam/i.test(txt);
  out.kantha = /Kantha fabric within/i.test(txt);
  return out;
};

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
});
const report = { label: LABEL, base: BASE, at: new Date().toISOString(), results: [] };
for (const w of WIDTHS) {
  for (const p of PAGES) {
    if (w !== 390 && p.name !== "order") continue;
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900 });
    if (TOK) await page.setCookie({ name: AUTH_COOKIE, value: TOK, url: BASE });
    await page.goto(BASE + p.route, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const m = await page.evaluate(measure);
    const shot = `${OUT}/${LABEL}-${p.name}-${w}.png`;
    await page.screenshot({ path: shot, fullPage: false });
    report.results.push({ width: w, page: p.name, route: p.route, shot, ...m });
    console.log(
      `[${LABEL}] ${w}px ${p.name}: sidebar=${m.sidebarWidth} doc=${m.docScrollWidth}/${m.innerWidth} main=${m.mainScrollWidth}/${m.mainClientWidth} (over ${m.mainOverflowPx}) notes=${m.noteMatches} mariam=${m.mariam}`
    );
    for (const o of m.overflowers || []) console.log(`        OVERFLOWS: ${o}`);
    for (const t of m.tables)
      console.log(
        `        table sw=${t.scrollWidth} cw=${t.clientWidth} over=${t.overflowPx} stagesVis=${t.stagesHeaderVisible} lastColVis=${t.lastColHeaderVisible} cols=${t.headers.length}`
      );
    await page.close();
  }
}
await browser.close();
fs.writeFileSync(`${OUT}/${LABEL}.json`, JSON.stringify(report, null, 2));
console.log(`\n[${LABEL}] wrote ${OUT}/${LABEL}.json`);
