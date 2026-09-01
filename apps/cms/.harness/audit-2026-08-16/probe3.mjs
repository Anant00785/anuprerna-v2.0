import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const env=fs.readFileSync('/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.env.local','utf8');
const tok=env.split('\n').find(l=>l.startsWith('SANDBOX_ADMIN_TOKEN=')).split('=').slice(1).join('=').trim();
const b=await chromium.launch({args:['--no-sandbox']}); const out={};
// --- SANDBOX ---
const ctx=await b.newContext({viewport:{width:1440,height:1000}});
await ctx.addCookies([{name:'weave_token',value:tok,domain:'localhost',path:'/'}]);
const p=await ctx.newPage();
await p.goto('http://localhost:3010/artisanflow/workflow/instance/114027735',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
const t=await p.evaluate(()=>document.body.innerText);
const i=t.indexOf('ARTISAN ASSIGNMENT');
out.sbArtisanCard = i<0?'NOT FOUND':t.slice(i,i+800);
// Halted filter on jobs
await p.goto('http://localhost:3010/artisanflow/jobs',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(8000);
try{
  const h=p.locator('button:has-text("Halted")').first();
  await h.scrollIntoViewIfNeeded(); await h.click(); await p.waitForTimeout(4000);
  out.haltedResult = (await p.evaluate(()=>document.body.innerText)).match(/Showing[^\n]*/)?.[0] || 'no showing line';
  await p.screenshot({path:OUT+'/shots/probe-halted.png'});
}catch(e){out.haltedResult='ERR '+String(e).slice(0,150);}
// Template Delete -> does it confirm or lie?
await p.goto('http://localhost:3010/artisanflow/workflow/template/490267',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(7000);
try{
  const del=p.locator('button:has-text("Delete")').first();
  await del.scrollIntoViewIfNeeded(); await del.click(); await p.waitForTimeout(2500);
  out.deleteDialog=(await p.evaluate(()=>document.body.innerText)).slice(0,60);
  const bt=await p.evaluate(()=>Array.from(document.querySelectorAll('button,[role=dialog]')).map(e=>(e.innerText||'').trim().slice(0,60)).filter(Boolean).slice(-14));
  out.deleteButtons=bt;
  await p.screenshot({path:OUT+'/shots/probe-delete.png'});
}catch(e){out.deleteDialog='ERR '+String(e).slice(0,150);}
await p.close();
// --- LIVE: bottom of order page (impact dashboard?) ---
const lctx=await b.newContext({viewport:{width:1440,height:1000},storageState:OUT+'/live-state.json'});
const lp=await lctx.newPage();
await lp.goto('https://weave.bloomscorp.com/logistic/custom-order/view/132440539',{waitUntil:'domcontentloaded',timeout:60000});
await lp.waitForTimeout(11000);
await lp.evaluate(()=>{const all=[...document.querySelectorAll('*')];let best=null;for(const e of all){if(e.scrollHeight>e.clientHeight+30&&e.clientHeight>300){const a=e.clientHeight*e.clientWidth;if(!best||a>best.a)best={e,a};}}if(best){best.e.scrollTop=best.e.scrollHeight;window.__s=best.e;}});
await lp.waitForTimeout(3500);
await lp.screenshot({path:OUT+'/shots/probe-live-order-bottom.png'});
const lt=await lp.evaluate(()=>document.body.innerText);
out.liveHasImpact = /impact/i.test(lt);
const j=lt.search(/impact/i);
out.liveImpactSnippet = j<0?'none':lt.slice(j-120,j+900);
fs.writeFileSync(OUT+'/probe3.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,5500));
await b.close();
