// @vitest-environment happy-dom
import { createApp,h,nextTick,ref } from 'vue';
import { it,expect,vi } from 'vitest';
import NarrativeStage from '../src/scene2d/NarrativeStage.vue';
import { sceneFocus } from '../src/scene2d/scene-focus';
it('camera keeps bounded composition and leaves narrow screens and cleared selections still',()=>{
 expect(sceneFocus(undefined,1920)).toEqual({x:0,y:0,scale:1});
 expect(sceneFocus({x:90,y:70},800)).toEqual({x:0,y:0,scale:1});
 for(const x of [0,25,80,100]) for(const y of [0,50,100]) {
  const f=sceneFocus({x,y},1920);expect(Math.abs(f.x)).toBeLessThanOrEqual(8);expect(Math.abs(f.y)).toBeLessThanOrEqual(5);
  expect(f.scale / 2 - Math.abs(f.x)/100).toBeGreaterThanOrEqual(.5);
  expect(f.scale / 2 - Math.abs(f.y)/100).toBeGreaterThanOrEqual(.5);
 }
});
it('arrow navigation observes without selecting; selection resets panel scroll and changing place clears details',async()=>{
 const active=ref(''),key=ref('a');const select=vi.fn();const host=document.createElement('div');document.body.append(host);
 const app=createApp({render:()=>h(NarrativeStage,{image:'/scenes/test.jpg',title:'山路',stageKey:key.value,hotspots:[{id:'person',label:'道友',x:30,y:60},{id:'exit',label:'归路',x:75,y:70}],active:active.value,onSelect:(id:string)=>{select(id);active.value=id;},onClose:()=>active.value=''},()=>h('button','交谈'))});
 app.mount(host);await nextTick();
 try {
  const buttons=host.querySelectorAll<HTMLButtonElement>('[data-hotspot]');buttons[0].focus();buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  expect(document.activeElement).toBe(buttons[1]);expect(select).not.toHaveBeenCalled();
  buttons[1].click();await nextTick();const old=host.querySelector('.narrative-inspector')!;old.scrollTop=200;
  buttons[0].click();await nextTick();expect(host.querySelector('.narrative-inspector')).not.toBe(old);expect(host.querySelector('.narrative-inspector')!.scrollTop).toBe(0);
  key.value='b';await nextTick();await nextTick();expect(host.querySelector('.narrative-inspector')).toBeNull();
 }finally{app.unmount();host.remove();}
});
