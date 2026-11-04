import {chromium} from '/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const records=[];
for(const width of [1920,1280]) {
 const context=await browser.newContext({viewport:{width,height:width===1920?1080:720}});const page=await context.newPage();
 await page.goto('http://127.0.0.1:5386/docs/golden-completion/review-fixes/experience-evidence/preview.html');await page.waitForFunction(()=>window.visualReview,{timeout:60000});
 for(const checkpoint of ['lizhao-battle','bay-fight']) {
 await page.evaluate(n=>window.visualReview.pick(n),checkpoint);
 const button=page.getByRole('button',{name:'撤回港口 · 不加伤、不丢材料',exact:true});await button.waitFor();
 const hit=await button.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {target:hit?.className,reachable:hit===el||el.contains(hit)};});
 let error='';try {await button.click({timeout:1800});}catch(e){error=e.message.split('\n')[0];}
 const state=await page.evaluate(()=>window.visualReview.state());records.push({width,checkpoint,hit,error,location:state.lizhao.location,duel:!!state.lizhao.duel});
 }
 await context.close();
}
await browser.close();fs.writeFileSync(new URL(process.argv[2]||'retreat-results.json',import.meta.url),JSON.stringify(records,null,2));console.log(JSON.stringify(records,null,2));if(records.some(r=>!r.hit.reachable||r.duel||r.location!=='harbor'))process.exitCode=1;
