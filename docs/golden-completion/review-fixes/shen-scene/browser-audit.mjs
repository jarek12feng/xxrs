import {chromium} from '/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const dir='docs/golden-completion/review-fixes/shen-scene/';
const browser=await chromium.launch({headless:true,channel:'chrome'});const records=[],errors=[];
try{for(const width of [1920,1280]){
 const context=await browser.newContext({viewport:{width,height:width===1920?1080:720},deviceScaleFactor:1});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5388/'+dir+'preview.html');await page.waitForFunction(()=>window.shenReview,{timeout:60000});
 for(const name of ['present','record']){
  await page.evaluate(name=>window.shenReview.pick(name),name);await page.waitForTimeout(250);
  await page.locator('[data-hotspot="teaching"]').click();await page.getByRole('button',{name:'演示旧法滞涩，问接续之法',exact:true}).click();
  await page.waitForTimeout(250);
  const elder=page.locator('.teaching-elder');if(await elder.count()!==(name==='present'?1:0))throw Error('Wrong elder presence');
  if(name==='present')await elder.evaluate(i=>{if(!i.complete||!i.naturalWidth)throw Error('Image not loaded');});
  await page.screenshot({path:dir+`${name}-${width}.png`});
  records.push({name,width,state:await page.evaluate(()=>({month:window.shenReview.state().month,realm:window.shenReview.state().realm,location:window.shenReview.state().conclave.location,introduced:window.shenReview.state().conclave.introduced,practice:window.shenReview.state().goldenStory.practice})),elderCount:await elder.count(),text:await page.locator('body').innerText()});
  await page.getByRole('button',{name:'缓下旧脉，留出接续余地',exact:true}).click();await page.getByRole('button',{name:'候新流回转，再接旧脉',exact:true}).click();
  if(!(await page.evaluate(()=>window.shenReview.state().goldenStory.teachings.includes('method'))))throw Error('Two-step teaching not completed');
 }
 await context.close();
}}finally{await browser.close();fs.writeFileSync(dir+'observations.json',JSON.stringify({errors,records},null,2));}
if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({scenes:records.length,errors}));
