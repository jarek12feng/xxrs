import type { State } from '../../../world';

export interface PracticeState {
  topic: 'pill'; schema: 2;
  warm: boolean;
  haze: 'mixed' | 'floating' | 'clear';
  breath: 'joined' | 'sidecup' | 'dual';
  muddled: boolean;
  collected: boolean;
}
export const fresh = (_step: 0 | 1): PracticeState => ({ topic: 'pill', schema: 2, warm: false, haze: 'mixed', breath: 'joined', muddled: false, collected: false });
export function valid(x: unknown): x is PracticeState {
  if (!x || typeof x !== 'object') return false;
  const v = x as PracticeState;
  return v.topic === 'pill' && v.schema === 2 && typeof v.warm === 'boolean' && ['mixed', 'floating', 'clear'].includes(v.haze)
    && ['joined', 'sidecup', 'dual'].includes(v.breath) && typeof v.muddled === 'boolean' && typeof v.collected === 'boolean'
    && (!v.collected || (v.haze === 'clear' && !v.muddled));
}
/** Old cleared batches remain cleared. Never turn a saved trial into a collected result. */
export function upgrade(old: unknown, step: 0 | 1): PracticeState {
  if (valid(old)) return { ...old };
  if (old && typeof old === 'object' && 'schema' in old) throw new Error('无法识别的分药试具存档');
  const v = old as {topic?: unknown; layers?: unknown; clear?: unknown} | null;
  const next = fresh(step);
  if (!v || v.topic !== 'pill') return next;
  if (v.layers === 1 || v.layers === 2) { next.warm = true; next.haze = 'floating'; }
  if (typeof v.clear === 'number' && [1, 2].includes(v.clear)) {
    next.breath = 'sidecup';
    if (v.clear >= step + 1) next.haze = 'clear';
  }
  return next;
}
export const choices: readonly {move: string; label: string}[] = [
  {move: 'pillWarm', label: '温盏'},
  {move: 'pillHold', label: '引入旁盏'},
  {move: 'pillSplit', label: '分念照看'},
  {move: 'pillVent', label: '打开侧孔'},
  {move: 'pillHerb', label: '灵草吸浊 · 耗灵草2'},
  {move: 'pillReset', label: '合盏凉置 · 免费重新分药'},
  {move: 'pillCollect', label: '收取清液'},
];
export function quote(s: State, move: string) {
  const p = s.goldenStory.practice as unknown as {topic: string; step: 0 | 1; material: unknown} | null;
  const next = valid(p?.material) ? { ...p.material } : fresh(p?.step ?? 0);
  const result = {error: '', herbs: 0, next, failed: false, passed: false, note: ''};
  const reject = (error: string) => ({ ...result, error });
  if (!p || p.topic !== 'pill' || ![0, 1].includes(p.step) || !valid(p.material) || !choices.some(c => c.move === move)) return reject('当前没有这项分药操作');
  if (next.collected) return reject('清液已经收取');
  if (move === 'pillHerb') {
    if (!next.muddled) return reject('没有混流需要补救，无须耗灵草');
    if (s.herbs < 2) return reject('需灵草2；也可合盏凉置，免费重新分药');
    result.herbs = 2; next.muddled = false;
    result.note = '灵草吸去混回的浊丝，先前隔开的药息与已排出的浮浊都得以保全。';
  } else if (move === 'pillReset') {
    Object.assign(next, fresh(p.step)); result.note = '试药收回主盏凉置，旁盏空出。可重新温盏，不耗物资。';
  } else if (move === 'pillCollect') {
    result.passed = next.haze === 'clear' && !next.muddled && (p.step === 0 || next.breath !== 'joined');
    result.failed = !result.passed;
    next.collected = result.passed;
    result.note = result.passed ? (p.step === 0 ? '清液入瓶，浮浊留在废盏。下一盏的两股药息会互相牵引。' : '清液入瓶，两股药息各自完整，浮浊没有随行。') : '瓶口显出浊影，药息未能完整入瓶；试药已退回原盏，没有损失。';
  } else if (next.muddled) return reject('混流尚在；可合盏凉置重来，或用灵草保全已有分离成果');
  else if (move === 'pillWarm') {
    if (next.haze !== 'mixed') return reject('浮浊已经升起，无须反复温盏');
    next.warm = true; next.haze = 'floating'; result.note = '一缕温意透过盏底，灰色浮浊升到侧孔边，清液留在下方。';
  } else if (move === 'pillHold') {
    if (p.step === 0) return reject('示范盏只有一股药息，无须另存旁盏');
    if (next.breath !== 'joined') return reject('两股药息已各有去处');
    next.breath = 'sidecup'; result.note = '你把青色药息引入旁盏，合上细管；主盏只余金色药息，不再相牵。';
  } else if (move === 'pillSplit') {
    if (p.step === 0) return reject('示范盏只有一股药息，无须分念');
    if (s.spirit.manual !== 'learned') return reject('尚未研修分念诀，无法同时照看双息');
    if (next.breath !== 'joined') return reject('两股药息已各有去处');
    next.breath = 'dual'; result.note = '两缕神念分别护住青、金药息，两股都留在主盏，不再互相牵引。';
  } else if (move === 'pillVent') {
    if (next.haze === 'clear') return reject('浮浊已排出，无须再开侧孔');
    if (next.haze !== 'floating' || (p.step === 1 && next.breath === 'joined')) {
      next.muddled = true; result.failed = true;
      result.note = '侧孔卷起混流，药息裹住浊丝；孔口已合上，先前引入旁盏的药息仍在。';
    } else { next.haze = 'clear'; result.note = '灰雾沿侧孔落入废盏，清液仍在主盏。'; }
  }
  return result;
}
export function view(p: {step: 0 | 1; material: unknown}) {
  const v = valid(p.material) ? p.material : fresh(p.step);
  return {
    title: p.step === 0 ? '浮浊示范' : '双息相牵', visual: '主盏、旁盏与排浊侧孔',
    clue: p.step === 0 ? '留住清亮药息，分去浮浊。' : '分去浮浊，让青、金两股药息完整入瓶。',
    status: [v.muddled ? '盏内混流 · 可免费合盏重调' : ({mixed: '浮浊沉在药液中', floating: '灰雾浮到侧孔边', clear: '浮浊已入废盏'})[v.haze],
      p.step === 0 ? '单股药息留在主盏' : ({joined: '青金双息在主盏相牵', sidecup: '青息在旁盏 · 金息在主盏', dual: '分念各护双息 · 旁盏空置'})[v.breath], v.collected ? '清液已入瓶' : '清液尚未收取'],
  };
}
export const solution = (step: 0 | 1): string[] => step === 0 ? ['pillWarm', 'pillVent', 'pillCollect'] : ['pillHold', 'pillWarm', 'pillVent', 'pillCollect'];
