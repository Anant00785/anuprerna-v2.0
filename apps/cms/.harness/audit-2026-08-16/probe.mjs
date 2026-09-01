import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const env = fs.readFileSync('/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.env.local','utf8');
const tok = env.split('\n').find(l=>l.startsWith('SANDBOX_ADMIN_TOKEN=')).split('=').slice(1).join('=').trim();
const b = await chromium.launch({args:['--no-sandbox']});
const ctx = await b.newContext({viewport:{width:1440,height:1000}});
await ctx.addCookies([{name:'weave_token',value:tok,domain:'localhost',path:'/'}]);
const p = await ctx.newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
const out={};

// ---- ORDER PAGE ----
await p.goto('http://localhost:3010/artisanflow/custom-orders/132440539',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
// expand every ready/dispatch history disclosure
const discs = await p.locator('summary, [class*="cursor-pointer"]').filter({hasText:'Ready & dispatch history'}).all();
out.disclosureCount = discs.length;
for (const d of discs){ try{ await d.scrollIntoViewIfNeeded(); await d.click({timeout:3000}); await p.waitForTimeout(150);}catch(e){} }
await p.waitForTimeout(2500);
const txt = await p.evaluate(()=>document.body.innerText);
out.orderTextLen = txt.length;
// look for the two claimed items
for (const id of ['132450307','132448589']){
  const i = txt.indexOf(id);
  out['item_'+id] = i<0 ? 'NOT FOUND IN TEXT' : txt.slice(Math.max(0,i-260), i+260);
}
out.hasNoteMariam = txt.includes('Mariam');
out.noteMentions = (txt.match(/Note[:\s]/g)||[]).length;
// table header + hidden columns
out.tableHeaders = await p.evaluate(()=>{
  const t=document.querySelector('table'); if(!t) return null;
  return Array.from(t.querySelectorAll('thead th')).map(h=>h.innerText.trim());
});
// scroll the inner overflow container fully right and shoot
await p.evaluate(()=>{const d=[...document.querySelectorAll('div')].find(e=>e.scrollWidth>e.clientWidth+50&&e.clientWidth>400); if(d){window.__t=d; d.scrollLeft=d.scrollWidth;}});
await p.waitForTimeout(1200);
await p.screenshot({path:OUT+'/shots/probe-order-scrolled-right.png'});
out.scrolledRight = await p.evaluate(()=>window.__t?{sl:window.__t.scrollLeft,sw:window.__t.scrollWidth,cw:window.__t.clientWidth}:null);
// count production tables / duplicate item cards
out.tableCount = await p.evaluate(()=>document.querySelectorAll('table').length);
out.h2h3 = await p.evaluate(()=>Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.innerText.trim()));

// ---- INSTANCE PAGE: kanban columns ----
await p.goto('http://localhost:3010/artisanflow/workflow/instance/133044983',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(8000);
const itxt = await p.evaluate(()=>document.body.innerText);
out.instanceText = itxt.slice(0,4000);
out.instanceHasHalted = /HALTED/i.test(itxt);

// ---- INSTANCE2 114027735: artisan names ----
await p.goto('http://localhost:3010/artisanflow/workflow/instance/114027735',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(8000);
const i2 = await p.evaluate(()=>document.body.innerText);
const m = i2.indexOf('ARTISAN');
out.instance2Artisans = m<0?'no artisan section':i2.slice(m, m+700);

out.consoleErrors = errs.slice(0,20);
fs.writeFileSync(OUT+'/probe.json', JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,6000));
await b.close();
