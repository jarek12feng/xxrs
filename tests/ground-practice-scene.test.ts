// @vitest-environment happy-dom
import {afterEach,expect,it} from 'vitest';
import {createApp,h,nextTick,shallowRef,type App} from 'vue';
import type {State} from '../src/world';
import Scene from '../src/golden-story/practices/ground/PracticeScene.vue';
import {fresh,quote,type PracticeState} from '../src/golden-story/practices/ground';
let app:App;afterEach(()=>{app?.unmount();document.body.innerHTML='';});
const game=(material:PracticeState)=>({goldenStory:{practice:{topic:'ground',step:1,material}},spirit:{manual:'none'},herbs:0}) as unknown as State;
const button=(text:string)=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes(text))!;
it('点击具体对象显示局部动作，发命令后读存档呈现药架位置',async()=>{
 const state=shallowRef(game(fresh(1)));const emitted:string[]=[];
 app=createApp({render:()=>h(Scene,{game:state.value,busy:false,onMove:(move:string)=>{emitted.push(move);state.value=game(quote(state.value,move).next);}})});app.mount(document.body.appendChild(document.createElement('div')));
 expect(button('运分念诀').disabled).toBe(true);
 button('收阵护住内圈').click();await nextTick();button('▥ 药架').click();await nextTick();button('把药架收入').click();await nextTick();
 expect(document.querySelector('.tableau')?.getAttribute('data-rack')).toBe('inner');
 state.value=JSON.parse(JSON.stringify(state.value));await nextTick();
 button('试潮闸').click();await nextTick();button('放行试潮').click();await nextTick();
 expect(document.body.textContent).toContain('药架就地保全');expect(emitted).toEqual(['ground-inner','ground-gather','ground-test']);
 expect(button('放行试潮').disabled).toBe(true);
});
it('忙碌禁用领域操作，观察不修改状态或发命令',async()=>{
 const state=game(fresh(1));const before=JSON.stringify(state);const moves:string[]=[];
 app=createApp({render:()=>h(Scene,{game:state,busy:true,onMove:(move:string)=>moves.push(move)})});app.mount(document.body.appendChild(document.createElement('div')));
 button('回流口').click();await nextTick();expect(button('打开回流口').disabled).toBe(true);
 button('通道 ·').click();await nextTick();expect(button('移开通道浮木').disabled).toBe(true);
 expect(JSON.stringify(state)).toBe(before);expect(moves).toEqual([]);
});
