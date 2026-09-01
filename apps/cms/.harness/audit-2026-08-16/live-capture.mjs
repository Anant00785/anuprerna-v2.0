// READ-ONLY capture of LIVE weave. Navigates + screenshots + reads DOM. Never clicks write controls.
import { chromium } from 'playwright';
import fs from 'fs';
const creds = JSON.parse(fs.readFileSync('/home/clawd/secrets/live-weave-login.json','utf8'));
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const BASE='https://weave.bloomscorp.com';

const SCREENS = [
  ['template',   '/manage-workflow/template/view/490267'],
  ['instance',   '/manage-workflow/custom-process/view/133044983'],
  ['jobs',       '/manage-workflow/custom-process'],
  ['order',      '/logistic/custom-order/view/132440539'],
  ['instance2',  '/manage-workflow/custom-process/view/114027735'],
  ['hub',        '/manage-workflow'],
];

const b = await chromium.launch({ args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width:1440,height:1000} });
const p = await ctx.newPage();
const errs=[]; p.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,160)); });

// --- login ---
await p.goto(creds.url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(3000);
await p.fill('input[type=email]', creds.email);
await p.fill('input[type=password]', creds.password);
await p.click('button:has-text("SIGN IN")');
await p.waitForTimeout(8000);
console.log('AFTER LOGIN URL:', p.url());
await p.screenshot({path:OUT+'/shots/live-01-afterlogin.png',fullPage:false});
await ctx.storageState({ path: OUT+'/live-state.json' });

const report = {};
for (const [name, path] of SCREENS) {
  try {
    await p.setViewportSize({width:1440,height:1000});
    await p.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForTimeout(9000);
    await p.screenshot({path:`${OUT}/shots/live-${name}-1440.png`,fullPage:true});
    const d = await p.evaluate(() => {
      const txt = document.body.innerText;
      return {
        url: location.href,
        textLen: txt.length,
        text: txt.slice(0, 9000),
        headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,.title,.card-title')).map(e=>e.innerText.trim()).filter(Boolean).slice(0,60),
        buttons: Array.from(document.querySelectorAll('button,a.btn,[role=button]')).map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim()).filter(Boolean).slice(0,80),
        tables: Array.from(document.querySelectorAll('table')).map(t=>({
          headers: Array.from(t.querySelectorAll('thead th,thead td')).map(h=>h.innerText.trim()),
          rows: t.querySelectorAll('tbody tr').length,
          firstRow: Array.from(t.querySelectorAll('tbody tr')[0]?.querySelectorAll('td')||[]).map(c=>c.innerText.trim().slice(0,60))
        })),
        selects: Array.from(document.querySelectorAll('select')).map(s=>({name:s.name, opts:Array.from(s.options).map(o=>o.text.trim())})),
        inputs: Array.from(document.querySelectorAll('input')).map(i=>({type:i.type,ph:i.placeholder,val:(i.value||'').slice(0,40)})),
        docScrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1
      };
    });
    report[name] = d;
    // mobile
    await p.setViewportSize({width:390,height:844});
    await p.waitForTimeout(3000);
    await p.screenshot({path:`${OUT}/shots/live-${name}-390.png`,fullPage:true});
    const m = await p.evaluate(()=>({sw:document.documentElement.scrollWidth, iw:window.innerWidth}));
    report[name].mobile = m;
    console.log(name, 'OK textLen', d.textLen, 'overflow1440', d.overflow, 'mob', m.sw>m.iw+1);
  } catch(e) { report[name] = {error: String(e).slice(0,300)}; console.log(name,'ERR',String(e).slice(0,200)); }
}
report._consoleErrors = errs.slice(0,30);
fs.writeFileSync(OUT+'/live-report.json', JSON.stringify(report,null,1));
await b.close();
console.log('DONE');
