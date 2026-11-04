/** Test-only planning from the player's visible forecasts. Never mutates the input. */
import type { State } from '../src/core';
import { channelingMoves, channelingPreview } from '../src/nascent-soul/channeling';
export function chooseChannelingMove(s: State) {
 const phase=s.nascentSoul.attempt!.phase;
 const search=(state:State):number=>{
  const d=state.nascentSoul.attempt!;
  if(d.stability<=0)return -10000;
  if(d.phase===3)return (d.flow+d.spirit)*100+d.stability;
  return Math.max(...channelingMoves[d.phase]!.map(move=>score(state,move)));
 };
 const score=(state:State,move:string):number=>{
  const p=channelingPreview(state,move)!;
  const next=structuredClone(state),d=next.nascentSoul.attempt!;
  d.flow=Math.max(0,Math.min(12,d.flow-p.flow));d.spirit=Math.max(0,Math.min(12,d.spirit-p.spirit));d.stability-=p.loss;d.phase++;
  return search(next);
 };
 return [...channelingMoves[phase]!].sort((a,b)=>score(s,b)-score(s,a))[0]!;
}
