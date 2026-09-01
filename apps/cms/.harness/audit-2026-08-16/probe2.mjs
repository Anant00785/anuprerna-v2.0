import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const env=fs.readFileSync('/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.env.local','utf8');
const tok=env.split('\n').find(l=>l.startsWith('SANDBOX_ADMIN_TOKEN=')).split('=').slice(1).join('=').trim();
const b=await chromium.launch({args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1440,height:1000}});
await ctx.addCookies([{name:'weave_token',value:tok,domain:'localhost',path:'/'}]);
const p=await ctx.newPage(); const out={};

// 1) INSTANCE pipeline: geometric column placement of each card
await p.goto('http://localhost:3010/artisanflow/workflow/instance/133044983',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
out.cols = await p.evaluate(()=>{
  const heads=[...document.querySelectorAll('*')].filter(e=>['TO DO','IN PROGRESS','DONE'].includes((e.innerText||'').trim()) && e.children.length===0);
  const hb=heads.map(h=>({t:h.innerText.trim(),x:h.getBoundingClientRect().x,w:h.getBoundingClientRect().width}));
  // find task cards by their known labels
  const labels=['Yarn Processing','Processed Yarn QC','Fabric Initial Sample','Complete Production','Washing','Base Fabric QC','Sampling Completion','QC Fabric'];
  const cards=[];
  document.querySelectorAll('*').forEach(e=>{
    const t=(e.innerText||'').trim();
    if(e.children.length<=3 && labels.includes(t)){
      const r=e.getBoundingClientRect();
      if(r.width>40&&r.width<420) cards.push({t,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width)});
    }
  });
  return {heads:hb, cards:cards.slice(0,40)};
});
await p.evaluate(()=>{const el=[...document.querySelectorAll('*')].find(e=>(e.innerText||'').includes('PRODUCTION PIPELINE')); if(el) el.scrollIntoView({block:'start'});});
await p.waitForTimeout(1500);
await p.screenshot({path:OUT+'/shots/probe-pipeline.png'});

// 2) 114027735 artisan card
await p.goto('http://localhost:3010/artisanflow/workflow/instance/114027735',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
out.i2 = await p.evaluate(()=>{
  const el=[...document.querySelectorAll('*')].find(e=>/ARTISAN ASSIGNMENT/.test(e.innerText||'') && e.children.length<12);
  return el? el.innerText.slice(0,900) : 'not found';
});
out.i2url = p.url();
await p.evaluate(()=>{const el=[...document.querySelectorAll('*')].find(e=>/ARTISAN ASSIGNMENT/.test(e.innerText||'')); if(el) el.scrollIntoView({block:'center'});});
await p.waitForTimeout(1200);
await p.screenshot({path:OUT+'/shots/probe-i2-artisans.png'});

// 3) order page: expanded history detail
await p.goto('http://localhost:3010/artisanflow/custom-orders/132440539',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(9000);
const d=await p.locator('text=Ready & dispatch history').all();
for(const x of d.slice(0,4)){try{await x.scrollIntoViewIfNeeded();await x.click({timeout:2500});await p.waitForTimeout(200);}catch(e){}}
await p.waitForTimeout(2000);
out.expanded = await p.evaluate(()=>{
  const res=[];
  document.querySelectorAll('details[open], [data-state="open"]').forEach(e=>res.push(e.innerText.slice(0,400)));
  if(!res.length){ const t=document.body.innerText; const i=t.indexOf('Ready & dispatch history'); res.push(t.slice(i,i+900)); }
  return res.slice(0,6);
});
await p.screenshot({path:OUT+'/shots/probe-order-history.png',fullPage:false});
fs.writeFileSync(OUT+'/probe2.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,6000));
await b.close();
