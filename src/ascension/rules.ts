import type { State, Command } from '../world';
import { breakthroughError } from '../foundation';
import { goldenQuote } from '../golden-core/rules';
export type AscensionAction = 'start' | 'method' | 'medicine' | 'press' | 'withdraw' | 'commit';
export const phaseNames = ['引气归流', '稳住经脉', '凝聚道基'] as const;
export const phaseName = (realm:number, step:number) => realm === 1 && step === 2 ? '凝聚金丹' : phaseNames[step];
export function ascensionOptions(s: State) {
  const step = s.ascension?.step ?? 0, golden = s.realm === 1;
  const training = s.journey.main ? s.growth.training[s.journey.main] : 0;
  const ready = step === 0 ? s.sense >= (golden ? 12 : 6)
    : step === 1 ? ((golden ? s.goldenCore.guard : s.ward) || s.foundation >= (golden ? 24 : 18))
    : training >= (golden ? 2 : 1) || s.foundation >= (golden ? 24 : 20);
  const need = step === 0 ? `神识 ${golden ? 12 : 6}` : step === 1 ? `根基 ${golden ? 24 : 18}，或已备护脉${golden ? '阵' : '丹纹'}` : `主修研修 ${golden ? 2 : 1} 层，或根基 ${golden ? 24 : 20}`;
  const herbs = golden ? 4 : 2;
  const strain = s.ascension?.strain ?? 0;
  return [
    {id:'method' as const,label:step===0?'以神识引导灵流':step===1?'以根基与护持稳脉':'循熟练功法凝聚',detail:`${need}；不耗材料，不新增紊乱。`,error:ready?'':`尚需${need}`,herbs:0,strain:0},
    {id:'medicine' as const,label:'以灵草药气调和',detail:`灵草 ${herbs}；不新增紊乱，已有紊乱减少 1。`,error:s.herbs>=herbs?'':`缺少灵草，需要 ${herbs}`,herbs,strain:-1},
    {id:'press' as const,label:'强行推动灵流',detail:`不耗材料；紊乱 +2。若未调和，最终把握最多降至 ${Math.max(10,100-(strain+2)*15)}%。`,error:'',herbs:0,strain:2},
  ];
}
export function ascensionError(s: State) {
  if (s.ascension) return '正在行功';
  if (s.wayfaring.trip || s.wayfaring.passage || s.social.scene || s.social.arena.duel || s.expedition.duel || s.qiJourney.node || s.foundationJourney.duel || s.sectContest.duel || s.goldenCore.expedition !== 'idle' || s.outerSea.location !== 'home' || s.conclave.location !== 'away' || (s.treasures.auction?.entered && !s.treasures.auction.closed)) return '先结束眼前行程，再安排行功';
  return s.realm === 0 ? breakthroughError(s) : s.realm === 1 ? goldenQuote(s,{kind:'break'}).error : '此境无需筑基或凝丹';
}
export function runAscension(input: State, action: AscensionAction, id: string,
  finish: (s: State, command: Command) => State, month: (s: State) => State): State {
  if (input.status !== 'alive' || input.pending) return input;
  if (action === 'start') {
    if (ascensionError(input)) return input;
    const s = structuredClone(input);
    s.ascension = {realm:s.realm as 0|1,step:0,strain:0,history:[]};
    s.seen = [...s.seen,id].slice(-512); return s;
  }
  const a = input.ascension;
  if (!a) return input;
  if (action === 'commit') {
    if (a.step !== 3) return input;
    const next = finish(input, a.realm === 0 ? {type:'break',pill:true,id} : {type:'goldenCore',action:{kind:'break'},id});
    if (next !== input && (next.realm !== input.realm || next.pills < input.pills || next.goldenCore.pills < input.goldenCore.pills || next.status !== 'alive')) next.ascension = null;
    return next;
  }
  if (action === 'withdraw') {
    const s = month(input);
    s.ascension = null;
    s.seen = [...s.seen,id].slice(-512);
    s.log.unshift({month:s.month,kind:'story',text:'你及时收势，调息一月。筑基／凝丹药尚未服下，已用灵草不返还；已有历练、灵地与护持保留。'});
    s.log = s.log.slice(0,180); return s;
  }
  if (a.step >= 3) return input;
  const option = ascensionOptions(input).find(x => x.id === action);
  if (!option || option.error) return input;
  const s = structuredClone(input), next = s.ascension!;
  s.herbs -= option.herbs;
  next.strain = Math.max(0,next.strain + option.strain);
  next.history.push(`${phaseName(s.realm,next.step)}：${option.label}，${option.herbs ? `耗灵草 ${option.herbs}，` : ''}紊乱 ${next.strain}。`);
  next.step++;
  s.seen = [...s.seen,id].slice(-512); return s;
}
