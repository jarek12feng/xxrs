import type { State } from '../world';
export const channelingMoves = [['release','channel'],['anchor','observe'],['unite','circulate']] as const;
/** Read-only forecasts; all inputs are locked while an attempt is running. */
export function channelingSituation(s: State, phase = s.nascentSoul.attempt?.phase ?? 0) {
 const n=s.nascentSoul;
 return [
  n.land==='shared' ? '合作灵地灵潮宽急，丹元积在胸腹；直释可借宽阔泄流道散开，循脉须多费丹元约束潮头。' : '旧静室灵流细长，离照阵纹已被你逐一校准；循脉能省下丹元，直释可腾出心神。',
  n.thunder.method==='stillness' ? '太素守神诀使识海收拢，定神珠已有清晰落点；锚定可借静意回转丹元，照察外流则须分出更多心神。' : '抱元归一诀牵动内外灵流，定神珠随之回旋；照察能顺着回流凝形，强行锚定需多留心神。',
  n.protection==='array' ? '外护阵已接住回震，阵眼正与婴形相应；此时合一耗力较少，继续周流会承受阵眼回摆。' : '轮值道友稳住外围，灵流仍随潮息起落；周流可随息相合，直合须多用丹元平伏波动。',
 ][phase]!;
}
export function channelingPreview(s: State, move: string) {
 const d=s.nascentSoul.attempt;
 if(!d)return null;
 const n=s.nascentSoul;
 const allowed=(channelingMoves[d.phase]! as readonly string[]).includes(move);
 let flow=0,spirit=0,loss=allowed?0:7;
 if(allowed) {
  if(move==='release'){flow=4;spirit=-1;}
  if(move==='channel'){flow=n.land==='shared'?5:2;spirit=1;}
  if(move==='anchor'){flow=-1;spirit=n.thunder.method==='stillness'?3:5;}
  if(move==='observe'){flow=n.thunder.method==='stillness'?2:1;spirit=n.thunder.method==='stillness'?5:2;}
  if(move==='unite'){flow=n.protection==='array'?2:4;spirit=n.protection==='array'?2:3;}
  if(move==='circulate'){flow=n.protection==='array'?3:2;spirit=n.protection==='array'?3:2;loss=n.protection==='array'?2:1;}
 }
 const shortage=d.flow<flow || d.spirit<spirit;
 if(shortage)loss+=6;
 return {flow,spirit,loss,allowed,shortage,phase:['化丹归元','守识凝形','内外相合'][d.phase],hint:channelingSituation(s), warning:shortage?'余力不足，强行接续额外损失稳定6。':''};
}
