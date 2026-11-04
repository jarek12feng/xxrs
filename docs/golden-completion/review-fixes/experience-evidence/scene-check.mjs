import {chromium} from '/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='docs/golden-completion/review-fixes/experience-evidence/';
const browser=await chromium.launch({headless:true,channel:'chrome'});const records=[],errors=[];
for(const width of [1920,1280]) {
 const page=await browser.newPage({viewport:{width,height:width===1920?1080:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5386/'+dir+'preview.html');await page.waitForFunction(()=>window.visualReview,{timeout:60000});
 const pick=async name=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(500);};
 const click=async name=>{await page.getByRole('button',{name}).click();await page.waitForTimeout(400);};
 const snap=async name=>{await page.screenshot({path:dir+name+'-'+width+'.png'});records.push({name,width,text:await page.locator('body').innerText(),state:await page.evaluate(()=>window.visualReview.state()),images:await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth}))) });fs.writeFileSync(dir+'scene-results.json',JSON.stringify({errors,records},null,2));};
 for(const checkpoint of ['lizhao-battle','bay-fight']) {
 await pick(checkpoint);await snap(checkpoint);const vitals=page.locator('.combat-vitals');assert(await vitals.isVisible());
 const hit=await vitals.evaluate(el=>{const r=el.getBoundingClientRect();const target=document.elementFromPoint(r.right-10,r.y+r.height/2);return target===el||el.contains(target);});assert(hit,'enemy vitals obscured');
 await click(/辨影排毒/);assert.equal((await page.evaluate(()=>window.visualReview.state())).lizhao.duel.turn,1);await snap(checkpoint+'-move');
 await click('撤回港口 · 不加伤、不丢材料');assert.equal((await page.evaluate(()=>window.visualReview.state())).lizhao.duel,null);
 }
 await pick('lizhao-chamber');await page.locator('[data-hotspot="furnace"]').click();await snap('chamber-furnace');await page.keyboard.press('Escape');await page.locator('[data-hotspot="exit"]').click();await snap('chamber-exit');
 await pick('completion-trial');await snap('trial');await click(/护体回元/);await snap('trial-after');
 await pick('nascent-ready');await page.locator('[data-hotspot="chamber"]').click();assert.equal(await page.locator('.channeling-forecast li').count(),3);await snap('preparation');
 await pick('nascent-phase-0');await snap('phase-0');await click(/循脉导出/);await snap('phase-1');assert.equal(await page.locator('.practice-world').getAttribute('data-phase'),'1');
 await click(/照察灵流/);await snap('phase-2');assert.equal(await page.locator('.practice-world').getAttribute('data-phase'),'2');
 await pick('nascent');await page.locator('[data-hotspot="gate"]').click();await click(/稳固半年/);await snap('emerged');await click(/正式观礼，谢绝新职务/);await snap('formal');
 const state=await page.evaluate(()=>window.visualReview.state());assert.equal(await page.locator('.ceremony-guest').count(),state.nascentSoul.guests.length);
 await click(/赴古渡潮隙/);await snap('surveyed');assert.equal(await page.locator('.after-world').getAttribute('data-ability'),'surveyed');
 await click(/展开元婴护持/);await snap('sheltered');assert.equal(await page.locator('.crossing-ward').count(),1);
 await click(/带测绘队渡过/);await page.waitForTimeout(1300);await snap('crossed');assert.equal(await page.locator('.shore-marker').count(),1);
 await pick('nascent');await page.locator('[data-hotspot="gate"]').click();await click(/稳固半年/);await click(/行简礼，谢绝新职务/);await snap('simple');assert.equal(await page.locator('.ceremony-runner').count(),0);
 await pick('tide');await snap('tide');assert.equal(await page.locator('.tide-person').count(),2);await page.locator('[data-hotspot="duty"]').click();await snap('tide-open');
 await page.close();
}
await browser.close();assert.equal(errors.length,0);assert(records.every(r=>r.images.every(i=>i.complete&&i.width>0)));console.log(JSON.stringify({screenshots:records.length,errors}));
