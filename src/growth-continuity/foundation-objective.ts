import type { State, Intent } from '../world';
import { hasSteady } from '../foundation-journey/growth-state';
import { journeyActionError } from '../foundation-journey/progression';
import { challenges } from '../foundation-journey/content';
import { activityInterruption } from '../scene-activity';
import { preferredTravelMode, travelLocation, travelQuote } from '../wayfaring/rules';

/** A suggested next use of earned growth, never an additional cultivation cap. */
export function foundationObjective(s: State) {
  const q = s.foundationJourney;
  if (s.realm !== 1 || q.rescue !== 4 || !q.growth.refined || !hasSteady(q) || q.epilogue || activityInterruption(s)) return null;
  const won = q.won.includes('culmination');
  const target = won ? 600 : q.condensation ? q.cultivation : Math.max(q.cultivation, 500);
  const title = won ? '圆满归山，筹备凝丹' : q.condensation ? '以周天贯流走通长风归流' : '将沉井传承与稳脉法接成周天';
  const purpose = won
    ? '长风归流已通。灵元积累圆满后回行前居收束此程，再筹备凝丹主药、丹药与灵地。'
    : q.condensation
      ? '周天贯流已经可用：筑基交锋中相邻两合换招，伤害 +5、承伤 −2。到古道试运，按乱流变化决定何时守、辨、攻。'
      : '接应已完成，稳脉也已学会。将修行积累用于贯通周天，下一场长风归流便能借换招增伤、减伤。';
  const ready = won ? q.cultivation >= 600 : q.condensation || q.cultivation >= 500;
  let next: {label: string; intent: Intent; error: string} | null = null;
  if (ready) {
    const destination = won ? 'home' : 'frontier';
    if (travelLocation(s) !== destination) {
      const mode = preferredTravelMode(s);
      const quote = travelQuote(s, destination, mode);
      next = {label: `前往${won ? '行前居' : '云外古道'} · ${quote.months} 月`, intent: {type:'foundationJourney', action:{kind:'travel',destination,mode}}, error:quote.error};
    } else {
      const action = won ? {kind:'epilogue'} as const : q.condensation ? {kind:'battle',battle:'culmination'} as const : {kind:'finish'} as const;
      next = {label: won ? '圆满归山 · 收束筑基此程' : q.condensation ? `试运长风归流 · 一月 / 灵石 ${challenges.culmination.cost}` : '贯通周天 · 不耗年月与物资', intent:{type:'foundationJourney',action},error:journeyActionError(s,action)};
    }
  }
  return { title, purpose, target, ready, next, canContinue: ready && !won && q.cultivation < 599 };
}
