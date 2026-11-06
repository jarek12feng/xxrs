import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick } from 'vue';
import { expect, it } from 'vitest';
import NarrativeStage from '../src/scene2d/NarrativeStage.vue';
it('anchors an NPC conversation to its own hotspot without moving the camera', async () => {
 const host=document.createElement('div'); document.body.append(host);
 const app=createApp({render:()=>h(NarrativeStage,{image:'',title:'交谈',stageKey:'test',hotspots:[{id:'a',label:'甲',x:25,y:55,kind:'person'},{id:'b',label:'乙',speech:'道友，别来无恙。',x:72,y:50,kind:'person'}],active:'b'},()=>h('p','系统说明：消耗灵石 12，耗时 1 月。'))});
 app.mount(host); await nextTick();
 try { expect(host.querySelector('.speech-bubble')?.textContent).toContain('道友，别来无恙。'); expect(host.querySelector('.speech-bubble')?.textContent).not.toContain('消耗灵石'); expect(host.querySelector('.scene-observation')?.textContent).toContain('消耗灵石'); expect(host.querySelector('.speech-bubble')?.getAttribute('data-speaker')).toBe('b'); }
 finally {app.unmount();host.remove();}
});

import {speechBubbleStyle} from '../src/scene2d/speech-bubble';
import {openingScene} from '../src/scene2d/opening';
import {dispatch} from "../src/core";
import {foundationApproachPoint} from '../src/foundation-journey/scene-approach';
it('keeps edge speech inside the viewport and tail aligned after resize',()=>{
 for(const width of [390,1280,1920,2560])for(const x of [2,25,72,98]){
  const style=speechBubbleStyle({x,y:55},width,720);
  const left=parseFloat(style['--bubble-left']);
  expect(left).toBeGreaterThanOrEqual(16);
  expect(left+Math.min(420,width-32)).toBeLessThanOrEqual(width-16);
  expect(parseFloat(style['--bubble-tail'])).toBeGreaterThanOrEqual(16);
 }
});
it('keeps two apothecary speakers and added foundation objects at distinct standing targets',()=>{
 let s=createGame('落脚','wood',42);
 for(const action of ['inspect','depart'] as const)s=dispatch(s,{id:action,type:'adventure',action});
 const people=openingScene(s.adventure).objects.filter(o=>o.kind==='person');
 expect(people.map(o=>o.foot)).toEqual([{x:22,y:72},{x:67,y:72}]);
 expect(foundationApproachPoint('home','sect-handover')).not.toEqual(foundationApproachPoint('home','encounter'));
 expect(foundationApproachPoint('home','home-letter')).not.toEqual(foundationApproachPoint('home','sect-handover'));
});

it('does not present unclassified scene prose as NPC speech', async () => {
 const host=document.createElement('div'); const app=createApp({render:()=>h(NarrativeStage,{image:'',title:'现场',stageKey:'test',hotspots:[{id:'npc',label:'药工',x:50,y:60,kind:'person'}],active:'npc'},()=>h('p','药工已离开阵门，在归路旁等候。'))});
 app.mount(host); await nextTick();
 try {expect(host.querySelector('.speech-bubble')).toBeNull();expect(host.textContent).toContain('药工已离开阵门');}finally{app.unmount();}
});

it('renders explicit full-body actors separately from narration and suppresses the goal while talking', async () => {
 const host=document.createElement('div');
 const app=createApp({render:()=>h(NarrativeStage,{image:'',title:'药庄',stageKey:'actors',goal:'先备药材',hotspots:[{id:'npc',label:'药庄事务',speaker:'阙明棠',speech:'请坐。',actor:'/art/foundation-journey/qu-heir.webp',foot:{x:47,y:88},x:47,y:55,kind:'person'}],active:'npc'},()=>h('p','消耗灵草 2，耗时 1 月。'))});
 app.mount(host); await nextTick();
 try {
  expect(host.querySelector('.hotspot-actor')?.getAttribute('alt')).toBe('阙明棠');
  expect(host.querySelector('.speech-bubble')?.textContent).toContain('阙明棠');
  expect(host.querySelector('.speech-bubble')?.textContent).not.toContain('消耗');
  expect(host.querySelector('.narrative-goal')).toBeNull();
  expect(host.querySelector('.scene-observation')?.textContent).toContain('先备药材');
  expect(host.querySelector('.conversation-actions')).not.toBeNull();
 }finally{app.unmount();}
});
