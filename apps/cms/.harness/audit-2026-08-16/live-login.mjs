import { chromium } from 'playwright';
import fs from 'fs';
const creds = JSON.parse(fs.readFileSync('/home/clawd/secrets/live-weave-login.json','utf8'));
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const b = await chromium.launch({ args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width:1440,height:1000} });
const p = await ctx.newPage();
const errs=[]; p.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,200)); });
console.log('login host:', new URL(creds.url).host);
await p.goto(creds.url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(5000);
await p.screenshot({path:OUT+'/shots/live-00-loginpage.png',fullPage:true});
const info = await p.evaluate(() => ({
  inputs: Array.from(document.querySelectorAll('input')).map(e=>({type:e.type,name:e.name,id:e.id,ph:e.placeholder,fc:e.getAttribute('formcontrolname')})),
  buttons: Array.from(document.querySelectorAll('button')).map(e=>(e.innerText||'').trim()).filter(Boolean),
  title: document.title
}));
console.log('INFO:', JSON.stringify(info,null,1));
console.log('URL NOW:', p.url());
console.log('ERRORS:', errs.length, errs.slice(0,5));
await b.close();
