// Capture a page by scrolling its INNER scroll container, plus overflow diagnostics.
import { chromium } from 'playwright';
import fs from 'fs';
const OUT='/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.harness/audit-2026-08-16';
const side = process.argv[2];            // 'sb' | 'live'
const widths = (process.argv[3]||'1440').split(',').map(Number);

const env = fs.readFileSync('/home/clawd/.openclaw/workspace/anuprerna-rebuild/weave/.env.local','utf8');
const tok = env.split('\n').find(l=>l.startsWith('SANDBOX_ADMIN_TOKEN=')).split('=').slice(1).join('=').trim();

const SB = { base:'http://localhost:3010', screens:[
  ['template','/artisanflow/workflow/template/490267'],
  ['instance','/artisanflow/workflow/instance/133044983'],
  ['jobs','/artisanflow/jobs'],
  ['order','/artisanflow/custom-orders/132440539'],
  ['instance2','/artisanflow/workflow/instance/114027735'],
]};
const LIVE = { base:'https://weave.bloomscorp.com', screens:[
  ['template','/manage-workflow/template/view/490267'],
  ['instance','/manage-workflow/custom-process/view/133044983'],
  ['jobs','/manage-workflow/custom-process'],
  ['order','/logistic/custom-order/view/132440539'],
  ['instance2','/manage-workflow/custom-process/view/114027735'],
]};
const cfg = side==='sb'?SB:LIVE;

const b = await chromium.launch({args:['--no-sandbox']});
const ctx = side==='sb'
  ? await b.newContext({viewport:{width:widths[0],height:1000}})
  : await b.newContext({viewport:{width:widths[0],height:1000}, storageState: OUT+'/live-state.json'});
if (side==='sb') await ctx.addCookies([{name:'weave_token',value:tok,domain:'localhost',path:'/'}]);
const p = await ctx.newPage();
const diag={};
for (const [name,path] of cfg.screens){
  for (const w of widths){
    await p.setViewportSize({width:w,height:1000});
    await p.goto(cfg.base+path,{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForTimeout(w===widths[0]?9000:5000);
    // find the deepest/biggest vertical scroll container
    const info = await p.evaluate(()=>{
      const all=[document.scrollingElement,...document.querySelectorAll('*')];
      let best=null;
      for(const e of all){ if(!e) continue;
        const sh=e.scrollHeight, ch=e.clientHeight;
        if(sh>ch+30 && ch>300){ const area=ch*e.clientWidth; if(!best||area>best.area) best={el:e,area,sh,ch}; }
      }
      window.__sc = best? best.el : document.scrollingElement;
      const sc=window.__sc;
      // horizontal overflow offenders anywhere
      const hoff=[];
      document.querySelectorAll('*').forEach(e=>{
        if(e.scrollWidth>e.clientWidth+2 && e.clientWidth>150){
          hoff.push({tag:e.tagName, cls:(e.className||'').toString().slice(0,70), sw:e.scrollWidth, cw:e.clientWidth});
        }
      });
      return { scrollH: sc.scrollHeight, clientH: sc.clientHeight,
        tag: sc.tagName, cls:(sc.className||'').toString().slice(0,70),
        docOverflowX: document.documentElement.scrollWidth>window.innerWidth+1,
        docSW: document.documentElement.scrollWidth, innerW: window.innerWidth,
        hoff: hoff.slice(0,12) };
    });
    diag[`${name}@${w}`]=info;
    const steps=Math.min(6,Math.ceil(info.scrollH/info.clientH));
    for(let i=0;i<steps;i++){
      await p.evaluate(i=>{ window.__sc.scrollTop = i*(window.__sc.clientHeight-70); }, i);
      await p.waitForTimeout(1200);
      await p.screenshot({path:`${OUT}/shots/${side}-${name}-${w}-s${i}.png`});
    }
    console.log(side,name,w,'scrollH',info.scrollH,'steps',steps,'docOvfX',info.docOverflowX,'hoff',info.hoff.length);
  }
}
fs.writeFileSync(`${OUT}/${side}-diag.json`,JSON.stringify(diag,null,1));
await b.close(); console.log('DONE');
