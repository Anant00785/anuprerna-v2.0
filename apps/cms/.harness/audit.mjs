import { chromium } from "playwright";
import fs from "fs";

const TOK = "bb588b7a0c18762d285670b2065ecc4aec1b9fa8b72c4c059bbcfdd40cd3089c";
const BASE = "http://localhost:3010";
const SHOTS = "/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/shots";

const routes = [
  ["dashboard","/dashboard"],
  ["listings","/listings"],
  ["catalog-categories","/catalog/categories"],
  ["catalog-segments","/catalog/segments"],
  ["catalog-subcategories","/catalog/sub-categories"],
  ["catalog-skugroups","/catalog/sku-groups"],
  ["catalog-specialstatus","/catalog/special-status"],
  ["catalog-filters","/catalog/filters"],
  ["catalog-profiles","/catalog/profiles"],
  ["catalog-tags","/catalog/tags"],
  ["users","/users"],
  ["reviews","/reviews"],
  ["order-feedback","/order-feedback"],
  ["orders","/orders"],
  ["inventory","/inventory"],
  ["logistics","/logistics"],
  ["wholesale","/wholesale"],
  ["loyalty","/loyalty"],
  ["artisanflow-production","/artisanflow"],
  ["artisanflow-customorders","/artisanflow/custom-orders"],
  ["listings-custom","/listings/custom"],
  ["artisanflow-workflow","/artisanflow/workflow"],
  // /workflow was deleted upstream; the job-instance list it showed now lives
  // at /artisanflow/jobs (see .harness/check.mjs).
  ["artisanflow-jobs","/artisanflow/jobs"],
  ["artisanflow-workflow-feedback","/artisanflow/workflow/feedback"],
  ["artisanflow-traceability","/artisanflow/traceability"],
  ["artisans","/artisans"],
  ["artisans-skills","/artisans/skills"],
  ["artisans-catalog","/artisans/catalog"],
  ["content","/content"],
  ["content-blogs","/content/blogs"],
  ["content-faqs","/content/faqs"],
  ["content-stories","/content/stories"],
  ["story-review","/story-review"],
  ["reports","/reports"],
  ["cron-jobs","/cron-jobs"],
  ["ai-embeddings","/ai-embeddings"],
  ["whatsapp","/whatsapp"],
  ["table-explorer","/table-explorer"],
  ["feedback","/feedback"],
  ["settings","/settings"],
  ["rebuild-map","/rebuild-map"],
  ["impact","/impact"],
  ["data-sync","/data-sync"],
  ["journey-tests","/journey-tests"],
];

const results = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
await ctx.addCookies([
  { name: "weave_token", value: TOK, domain: "localhost", path: "/" },
  { name: "weave_user", value: Buffer.from(JSON.stringify({email:"admin@anuprerna.com",name:"Admin"})).toString("base64"), domain:"localhost", path:"/" },
]);

for (const [name, path] of routes) {
  const page = await ctx.newPage();
  const consoleErrs = [];
  const netFails = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text().slice(0,200)); });
  page.on("requestfailed", (r) => netFails.push(r.url().replace(BASE,"") + " " + (r.failure()?.errorText||"")));
  let status = 0;
  let err = "";
  try {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    status = resp ? resp.status() : 0;
  } catch (e) {
    err = "NAV_TIMEOUT/ERR: " + e.message.slice(0,120);
  }
  await page.waitForTimeout(1800);
  // settle any client redirect
  const finalUrl = page.url().replace(BASE,"");

  // Extract signals
  let info = { len:0, snippet:"", banners:[], rows:0, cards:0, imgTotal:0, imgBroken:0, h1:"", loadingEls:0, hasSpinner:false, bannerMatch:false };
  try { info = await page.evaluate(() => {
    const bodyText = document.body ? document.body.innerText : "";
    // error banner heuristics
    const banners = [];
    const bannerRe = /(unauthorized|session required|failed to load|network error|something went wrong|error loading|could not load|stale|no data|not found|401|500|502|503|internal server error|empty)/i;
    document.querySelectorAll('[class*="error"],[role="alert"],[class*="banner"],[class*="Error"]').forEach(el=>{
      const t=(el.innerText||"").trim();
      if(t && t.length<300) banners.push(t.slice(0,200));
    });
    // count table rows / list items / cards
    const rows = document.querySelectorAll('table tbody tr').length;
    const cards = document.querySelectorAll('[class*="card"],[class*="Card"],li').length;
    const imgs = Array.from(document.querySelectorAll('img'));
    const imgTotal = imgs.length;
    const imgBroken = imgs.filter(i=>i.complete && i.naturalWidth===0).length;
    const h1 = document.querySelector('h1,h2')?.innerText?.slice(0,80) || "";
    // stuck loading?
    const loadingEls = Array.from(document.querySelectorAll('*')).filter(e=>{
      const t=(e.childNodes.length===1 && e.textContent||"").trim().toLowerCase();
      return t==="loading..."||t==="loading";
    }).length;
    const hasSpinner = !!document.querySelector('[class*="spinner"],[class*="Spinner"],[class*="animate-spin"]');
    return { len: bodyText.length, snippet: bodyText.replace(/\s+/g," ").slice(0,400), banners: [...new Set(banners)].slice(0,4), rows, cards, imgTotal, imgBroken, h1, loadingEls, hasSpinner, bannerMatch: bannerRe.test(bodyText) };
  }); } catch(e){ info.err2 = "EVAL_FAIL:"+e.message.slice(0,80); await page.waitForTimeout(1000); try{ info.snippet = (await page.evaluate(()=>document.body.innerText.replace(/\s+/g," ").slice(0,400))); info.h1 = await page.evaluate(()=>document.querySelector('h1,h2')?.innerText?.slice(0,80)||""); }catch(_){} }

  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }).catch(()=>{});
  results.push({ name, path, finalUrl, status, err, ...info, consoleErrs: consoleErrs.slice(0,5), netFails: netFails.slice(0,5) });
  console.log(`${status} ${path} ${finalUrl!==path?"->"+finalUrl:""} | rows=${info.rows} cards=${info.cards} img=${info.imgTotal}/${info.imgBroken}broken loading=${info.loadingEls} h1="${info.h1}" cerr=${consoleErrs.length} | ${info.banners.join(" || ")} ${info.err2||""}`);
  await page.close();
}

fs.writeFileSync(`${SHOTS}/../audit-results.json`, JSON.stringify(results, null, 2));
await browser.close();
console.log("DONE");
