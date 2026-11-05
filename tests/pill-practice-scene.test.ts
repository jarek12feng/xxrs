// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createApp, h, nextTick, shallowRef, type App } from 'vue';
import type { State } from '../src/world';
import PracticeScene from '../src/golden-story/practices/pill/PracticeScene.vue';
import { fresh, quote } from '../src/golden-story/practices/pill';
let app:App;
afterEach(()=>{app?.unmount();document.body.innerHTML='';});
it('器物选择发出动作，只有宿主写回后画面变化；读档保留旁盏，忙碌禁用',async()=>{
 const game=shallowRef({goldenStory:{practice:{topic:'pill',step:1,material:fresh(1)}},spirit:{manual:'learned'},herbs:2} as unknown as State);
 const busy=shallowRef(false);const moves:string[]=[];
 app=createApp({render:()=>h(PracticeScene,{game:game.value,busy:busy.value,onMove:(m:string)=>moves.push(m)})});
 app.mount(document.body.appendChild(document.createElement('div')));
 const object=(name:string)=>Array.from(document.querySelectorAll<HTMLButtonElement>('button.object')).find(b=>b.textContent?.includes(name))!;
 const action=(move:string)=>document.querySelector<HTMLButtonElement>(`[data-move="${move}"]`)!;
 object('旁盏').click();await nextTick();action('pillHold').click();await nextTick();
 expect(moves).toEqual(['pillHold']);expect(document.querySelector('section')?.getAttribute('data-breath')).toBe('joined');
 const q=quote(game.value,moves[0]!);const saved=JSON.parse(JSON.stringify(game.value));saved.goldenStory.practice.material=q.next;game.value=saved;await nextTick();
 expect(document.querySelector('section')?.getAttribute('data-breath')).toBe('sidecup');expect(document.body.textContent).toContain('青息在旁盏');
 object('主盏').click();await nextTick();busy.value=true;await nextTick();expect(action('pillWarm').disabled).toBe(true);action('pillWarm').click();expect(moves).toHaveLength(1);
 busy.value=false;await nextTick();expect(action('pillWarm').disabled).toBe(false);
 object('灵草').click();await nextTick();expect(action('pillHerb').disabled).toBe(true);expect(document.body.textContent).toContain('无须耗灵草');
});
it('混流和分念双护分别投影，灵草补救显示价格并可发命令',async()=>{
 const game={goldenStory:{practice:{topic:'pill',step:1,material:{...fresh(1),breath:'dual',muddled:true}}},spirit:{manual:'learned'},herbs:2} as unknown as State;
 const moves:string[]=[];app=createApp({render:()=>h(PracticeScene,{game,busy:false,onMove:(m:string)=>moves.push(m)})});app.mount(document.body.appendChild(document.createElement('div')));
 expect(document.body.textContent).toContain('分念各护双息');expect(document.body.textContent).toContain('免费合盏重调');
 Array.from(document.querySelectorAll<HTMLButtonElement>('button.object')).find(b=>b.textContent?.includes('灵草'))!.click();await nextTick();
 const button=document.querySelector<HTMLButtonElement>('[data-move="pillHerb"]')!;expect(button.textContent).toContain('灵草2');expect(button.disabled).toBe(false);button.click();expect(moves).toEqual(['pillHerb']);
});
