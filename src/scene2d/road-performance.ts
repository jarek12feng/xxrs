import type { State } from '../core';
import type { Pose } from '../presentation/art';
export function roadSceneSnapshot(s:State){const r=s.adventure.road;return {stage:r.stage,passed:r.passed,solution:r.solution,map:r.map,surveyed:r.surveyed,pills:s.pills,realm:s.realm,battle:!!s.expedition.duel};}
export type RoadSnapshot=ReturnType<typeof roadSceneSnapshot>;
export function roadSceneTransition(a:RoadSnapshot,b:RoadSnapshot):{label:string;pose:Pose}|undefined {
  if(b.battle)return;
  if(!a.passed && b.passed)return {label:b.solution==='medicine'?'镇风草攀回石阶':b.solution==='sword'?'风口已开，旧刻痕落入云海':b.solution==='array'?'旧阵接通，按约定开关':'越过山口',pose:b.solution==='sword'?'attack':'guard'};
  if(a.stage!==b.stage)return;
  if(!a.map && b.map)return {label:'图角拼合，青嶂关的路清楚了',pose:'idle'};
  if(!a.surveyed && b.surveyed)return {label:'把归路记入路簿',pose:'idle'};
  if(a.pills<b.pills && b.stage==='camp')return {label:'丹药已收妥',pose:'meditate'};
}
export function roadWorldState(s:State){const r=s.adventure.road;return {
  person:r.stage==='market'?'yuqing' as const:r.stage==='pass'?'qingzhang' as const:undefined,
  route:r.passed && ['pass','beyond','lookout'].includes(r.stage)?r.solution:'none',
  wind:r.stage==='pass' && !r.passed,
  map:r.map && ['market','lookout'].includes(r.stage),
};}
