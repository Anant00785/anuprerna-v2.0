import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const env = fs.readFileSync('/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.env.local','utf8');
const tok = env.split('\n').find(l=>l.startsWith('SANDBOX_ADMIN_TOKEN=')).split('=').slice(1).join('=').trim();
const BASE='http://localhost:3010';
const SCREENS = [
  ['template',  '/artisanflow/workflow/template/490267'],
  ['instance',  '/artisanflow/workflow/instance/133044983'],
  ['jobs',      '/artisanflow/jobs'],
  ['order',     '/artisanflow/custom-orders/132440539'],
  ['instance2', '/artisanflow/workflow/instance/114027735'],
];
const b = await chromium.launch({ args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width:1440,height:1000} });
await ctx.addCookies([{name:'weave_token', value:tok, domain:'localhost', path:'/'}]);
const p = await ctx.newPage();
const errs=[]; p.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,160)); });
const failed=[]; p.on('requestfailed', r=>failed.push(r.url().slice(0,120)));
const report={};
for (const [name,path] of SCREENS){
  try{
    await p.setViewportSize({width:1440,height:1000});
    await p.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForTimeout(8000);
    await p.screenshot({path:`${OUT}/shots/sb-${name}-1440.png`,fullPage:true});
    const d = await p.evaluate(()=>{
      const txt=document.body.innerText;
      return {
        url: location.href, textLen: txt.length, text: txt.slice(0,9000),
        headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5')).map(e=>e.innerText.trim()).filter(Boolean).slice(0,60),
        buttons: Array.from(document.querySelectorAll('button,a[href],[role=button]')).map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()).filter(Boolean).slice(0,100),
        tables: Array.from(document.querySelectorAll('table')).map(t=>({
          headers: Array.from(t.querySelectorAll('thead th,thead td')).map(h=>h.innerText.trim()),
          rows: t.querySelectorAll('tbody tr').length,
          firstRow: Array.from(t.querySelectorAll('tbody tr')[0]?.querySelectorAll('td')||[]).map(c=>c.innerText.trim().slice(0,60))
        })),
        selects: Array.from(document.querySelectorAll('select')).map(s=>({name:s.name,opts:Array.from(s.options).map(o=>o.text.trim())})),
        inputs: Array.from(document.querySelectorAll('input')).map(i=>({type:i.type,ph:i.placeholder})),
        docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth+1,
        // any element wider than viewport
        wideEls: Array.from(document.querySelectorAll('*')).filter(e=>e.scrollWidth>e.clientWidth+2 && e.clientWidth>200).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,60),sw:e.scrollWidth,cw:e.clientWidth})).slice(0,10)
      };
    });
    report[name]=d;
    await p.setViewportSize({width:390,height:844});
    await p.waitForTimeout(3000);
    await p.screenshot({path:`${OUT}/shots/sb-${name}-390.png`,fullPage:true});
    report[name].mobile = await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth}));
    console.log(name,'OK len',d.textLen,'ovf1440',d.overflow,'mobOvf',report[name].mobile.sw>report[name].mobile.iw+1);
  }catch(e){report[name]={error:String(e).slice(0,300)};console.log(name,'ERR',String(e).slice(0,200));}
}
report._consoleErrors=errs.slice(0,40); report._failedReqs=failed.slice(0,20);
fs.writeFileSync(OUT+'/sb-report.json',JSON.stringify(report,null,1));
await b.close(); console.log('DONE');
