import type { State, Intent } from '../world';
import { activityInterruption } from '../scene-activity';
import { conclaveQuote } from '../conclave/rules';
import { seaQuote } from '../outer-sea/rules';

/** Known invitation only: does not invent preparation requirements or schedule attendance. */
export function meetingObjective(s: State) {
  if (s.realm !== 2 || s.conclave.stage !== 1 || s.conclave.location !== 'away' || s.outerSea.notice === null || !['home','ferry','guild'].includes(s.outerSea.location) || activityInterruption(s)) return null;
  const remaining = Math.max(0,s.outerSea.notice + 600 - s.month);
  let intent: Intent;
  let title: string;
  let quote: {months:number;stones:number;herbs:number;error:string};
  if (remaining) {
    intent = {type:'conclave',action:{kind:'wait',until:'meeting'}};
    title = '留居候会 · 到会期来信为止';
    quote = conclaveQuote(s,intent.action);
  } else if (s.outerSea.location === 'home' || s.outerSea.location === 'guild') {
    intent = {type:'outerSea',action:{kind:s.outerSea.location === 'home' ? 'sail' : 'guildReturn'}};
    title = '返回古渡 · 接续赴会';
    quote = seaQuote(s,intent.action);
  } else {
    intent = {type:'conclave',action:{kind:'visit'}};
    title = '循道友来信，赴诸宗会谷';
    quote = conclaveQuote(s,intent.action);
  }
  return {
    remaining, intent, title, quote,
    ageAfter: s.age + quote.months,
    lifeAfter: Math.max(0,s.limit - s.age - quote.months),
  };
}
