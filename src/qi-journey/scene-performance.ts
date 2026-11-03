import type { State } from '../core';
import type { Pose } from '../presentation/art';

export function qiSceneSnapshot(s: State) {
  const q=s.qiJourney;
  return {realm:s.realm,gates:q.gates,node:q.node,essence:q.essence,
    duel:!!q.duel,turn:q.duel?.turn ?? -1,effect:q.duel?.effect ?? 'none',
    preparations:q.preparations.map(p=>({...p})),injury:s.injury};
}
export interface QiSceneCue { kind:'exchange'|'material'|'refine'|'prepare'|'retreat'|'victory'; label:string; pose:Pose }
/** Compare accepted snapshots only. No timer or command may resolve a game action. */
export function qiSceneTransition(before:ReturnType<typeof qiSceneSnapshot>,after:ReturnType<typeof qiSceneSnapshot>):QiSceneCue|undefined {
  if(before.realm!==after.realm || after.realm!==0) return;
  if(after.duel) {
    if(!before.duel || before.turn!==after.turn) return {kind:'exchange',label:after.effect==='strike'?'反击':after.effect==='discern'?'辨清来势':after.effect==='guard'?'守住身形':'凝神迎敌',pose:after.effect==='strike'?'attack':'guard'};
    return;
  }
  if(before.duel && !after.duel && before.node===1 && after.node===2) return {kind:'victory',label:'交锋已胜，前方灵流逆涌；整顿气息再进。',pose:'idle'};
  if(after.gates>before.gates) return {kind:'refine',label:after.gates===1?'药力归入经脉':'晶髓凝入气海',pose:'meditate'};
  if(!before.essence && after.essence) return {kind:'material',label:after.gates===0?'凝露草已收妥':'凝元晶髓已收妥',pose:'idle'};

  for(const route of ['medicine','sect','wander'] as const) {
    if((after.preparations[after.gates]?.[route] ?? 0)>(before.preparations[before.gates]?.[route] ?? 0))
      return {kind:'prepare',label:after.preparations[after.gates]?.[route]===3?'历练已成，准备入境':route==='medicine'?'收妥药囊':route==='sect'?'整好行装':'收起行路图',pose:'guard'};
  }
  if(before.node && !after.node) return {kind:'retreat',label:after.injury>before.injury?'退回山下，先养伤势':'回到山道',pose:after.injury>before.injury?'hurt':'idle'};
}

export interface QiActionBeat { label:string; pose:Pose; frame?:number; material:boolean }
/** Complete short presentation, after the one existing command has already been saved. */
export function qiActionBeats(cue:QiSceneCue):readonly QiActionBeat[] {
  if(cue.kind==='material') return [
    {label:'收拢灵材，护住药性',pose:'idle',frame:0,material:true},
    {label:'将灵材封入随身药囊',pose:'idle',frame:2,material:true},
    {label:cue.label,pose:'idle',frame:3,material:false},
  ];
  if(cue.kind==='refine') return [
    {label:'凝神引气，化开灵材',pose:'meditate',material:true},
    {label:'灵息沿经脉缓缓归流',pose:'meditate',material:false},
    {label:cue.label,pose:'meditate',material:false},
  ];
  return [{label:cue.label,pose:cue.pose,material:false}];
}
