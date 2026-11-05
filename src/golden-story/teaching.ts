import { materialSolution, type MaterialPractice } from './material-practice';
import type { State } from '../world';
import type { TeachingTopic } from './state';
import type { SpiritPractice } from './spirit-practice';
export type TeachingMove = `method-${string}` | `ground-${string}` | `pill${string}` | 'confirm'|'herb'|'ease'|'force'|'join'|'split'|'anchor'|'chase'|'listen'|'close'|'settle'|'mix'|'separate'|'drink'|'vent'|'seal'|'screen'|'stack';
export interface TeachingPractice { topic: TeachingTopic; source:'seat'|'public'; step:0|1; errors:number; feedback:string; spirit?:SpiritPractice; material?:MaterialPractice }
export interface TeachingResult { topic:TeachingTopic; errors:number }
export const teachingSolution=(topic:TeachingTopic):TeachingMove[]=>topic==='spirit' ? ['anchor','listen','listen','confirm','anchor','listen','ease','listen','confirm'] : [...materialSolution(topic,0),...materialSolution(topic,1)];
export function teachingSpeaker(s: State, source: 'seat'|'public') {
 const present = source === 'seat' && s.month < 2400;
 return { present, name: present ? '沈观微' : '当值传讲人', hotspot: present ? '沈观微 · 问法席' : '当值传讲人 · 论法实录',
 introduction: present ? '沈观微听完你的疑处，将一缕灵光引到石案上。' : '当值传讲人展开沈观微留下的论法实录，照着旧录点亮石案。' };
}
export function teachingIntroduction(s:State,topic:TeachingTopic,source:'seat'|'public') {
 const who=teachingSpeaker(s,source).introduction;
 const method=s.outerSea.method==='none'?'你依旧法行过一个周天。':`你将澄息篇运转一遍，${s.goldenStory.oldRecord?'又取出亲手核过的退潮旧录。':'把潮息接入自身丹元。'}`;
 const past=topic==='spirit'&&s.conclave.depth===2?'归潮深处的潮压，你曾亲身受过；那一瞬的散乱，此刻又浮上心头。':topic==='pill'&&s.conclave.depth===2?'你将带出的灵髓药性记在纸上，却不贸然开封。':method;
 const main=s.journey.main==='blade'?'剑气易锐，转折处尤其不可争先。':s.journey.main==='spring'?'长春生息绵长，更要辨清滋养与壅塞的分别。':'吐纳看似平缓，换息那一瞬才最见根基。';
 return who+past+main+'“先在此处试一回，看清缘由，再谈下一步。”';
}
