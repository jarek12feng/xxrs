import type { State } from '../world';
import type { Move } from '../combat';
import { conclavePhase } from './phases';
import { conclaveTactics } from './tactics';

/** Only saved battle facts; shared by field signals and the final exchange record. */
export function battleSignal(s: State) {
  const phase=conclavePhase(s);
  return phase ? {title:phase.title,next:phase.next,cue:conclaveTactics(s,'guard').cue} : null;
}
export function defeatReview(s:State, move:Move, damage:number, incoming:number, note:string, exhausted:boolean) {
  const d=s.conclave.duel!;
  const names={strike:'反击',guard:'守势',discern:'辨影'};
  const phase=conclavePhase(s);
  const alternatives=d.kind==='contest' && d.index===0
    ? phase?.late ? '护印已经散去，可先接掌再反击，减少硬碰；也可直接抢攻，以承伤换取更快结束。' : '可先辨影再反击，少撞护势；也可演练守势后辨影接守势，以较慢推进换取减伤。'
    : d.kind==='contest' && d.index===1
      ? phase?.late ? '她已转为短剑连势，可在近身时接剑、回气时追击；也可在霜影试探时辨影，为下一合铺垫。' : '可在蓄势时抢攻，承担近身伤害来削弱下一剑；也可先辨影再接剑，放弃即时伤害换取下合机会。'
      : d.kind==='contest' && d.index===2
        ? '可换成反击加快推进，承担相应伤害；也可换成守势或辨影，按当前预览选择较低承伤，避开当前被封的招式；后半场封锁本场最常用招式。'
        : d.index === 1 ? '可在阵压前辨阵、阵压时稳守，放缓推进；也可在气势充足时抢攻，承担反震换取更快破阵。'
        : '可按潮纹来势换招，减少承伤；也可准备灵草后以守势恢复气势，用补给换取续航。';
  return `本场复盘：${exhausted?'交锋达到十八合，未能及时取胜。':'气势耗尽，未能撑过这一合。'}最后一合选择${names[move]}，削去气势 ${damage}、承受 ${incoming}。${note} 下次调整：${alternatives}`;
}
