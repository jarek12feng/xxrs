import type { State } from '../../../world';

export interface PracticeState {
  topic: 'method'; schema: 2;
  left: boolean; right: boolean;
  buffer: 'empty' | 'charged';
  calm: boolean; backwash: boolean; released: boolean;
}
export const fresh = (step: 0 | 1): PracticeState => ({
  topic: 'method', schema: 2, left: false, right: false,
  buffer: step === 0 ? 'charged' : 'empty', calm: false, backwash: false, released: false,
});
export function valid(x: unknown): x is PracticeState {
  if (!x || typeof x !== 'object') return false;
  const v = x as PracticeState;
  return v.topic === 'method' && v.schema === 2 && ['empty', 'charged'].includes(v.buffer)
    && [v.left, v.right, v.calm, v.backwash, v.released].every(b => typeof b === 'boolean')
    && (!v.released || (v.right && !v.backwash && (v.buffer === 'charged' || (v.calm && v.left))));
}
export function upgrade(old: unknown, step: 0 | 1): PracticeState {
  if (valid(old)) return { ...old };
  const v = old as { topic?: unknown; schema?: unknown; flow?: unknown; joined?: unknown } | null;
  if (v?.schema !== undefined) throw new Error('无法识别的接流试具版本');
  const next = fresh(step);
  if (v?.topic === 'method' && [0, 1, 2].includes(v.flow as number) && typeof v.joined === 'boolean') {
    next.left = (v.flow as number) > 0;
    if (v.joined && v.flow === (step === 0 ? 1 : 2)) {
      next.left = false; next.buffer = 'charged'; next.right = true;
    }
  }
  return next;
}
export const choices = [
  { move: 'method-left', label: '开合旧流接点' },
  { move: 'method-buffer', label: '引旧流入缓冲盏' },
  { move: 'method-right', label: '接上新流' },
  { move: 'method-unhook', label: '收回新流接点' },
  { move: 'method-calm', label: '运澄息篇' },
  { move: 'method-drain', label: '打开回流槽 · 排去回涌' },
  { move: 'method-release', label: '放流入玉环' },
] as const;

export function quote(s: State, move: string) {
  const p = s.goldenStory.practice as unknown as { topic: string; step: 0 | 1; material: unknown } | null;
  const next = valid(p?.material) ? { ...p.material } : fresh(0);
  let error = '', failed = false, passed = false, note = '';
  const result = () => ({ error, herbs: 0, next, failed, passed, note });
  if (!p || p.topic !== 'method' || ![0, 1].includes(p.step) || !valid(p.material)) error = '当前没有可操作的接流试具';
  else if (!choices.some(c => c.move === move)) error = '没有这项接流操作';
  else if (next.released) error = '玉环已承接灵流';
  else if (move === 'method-calm' && s.outerSea.method === 'none') error = '尚未取得澄息篇';
  else if (move === 'method-calm' && next.calm) error = '澄息篇已在维持接点';
  else if (move === 'method-unhook' && !next.right) error = '新流尚未接入';
  else if (move === 'method-right' && next.right) error = '新流已经接上';
  else if (move === 'method-buffer' && (next.buffer === 'charged' || !next.left)) error = next.buffer === 'charged' ? '缓冲盏已有灵流，无须再引入' : '先将旧流接入玉盘';
  else if (move === 'method-drain' && !next.backwash) error = '回流槽平静，无须排流';
  else if (next.backwash && move !== 'method-drain' && move !== 'method-calm') error = '回涌挡住接点，暂不能接续';
  if (error) return result();
  if (move === 'method-left' && next.left) {
    next.left = false; note = '旧流接点收起，缓冲盏与新流接点仍保持原状。';
  } else if (move === 'method-unhook') {
    next.right = false; note = '新流接点收回，旧流与缓冲盏仍保留，两条来路已分开。';
  } else if (move === 'method-calm') {
    next.calm = true; next.backwash = false;
    note = '澄息篇将两股潮息错开相承；旧接点可以一直保留，不必截流存盏。';
  } else if (move === 'method-drain') {
    next.backwash = false;
    note = '回涌沿侧槽退去，旧流与盏中灵流仍保留，接点重新露出。';
  } else if (move === 'method-buffer') {
    next.buffer = 'charged'; next.left = false;
    note = '旧流存入缓冲盏，左侧接点收起；盏口浮着一圈平缓的波纹。';
  } else if (move === 'method-left' || move === 'method-right') {
    if (!next.calm && ((move === 'method-left' && next.right) || (move === 'method-right' && next.left))) {
      next.backwash = true; failed = true;
      note = '两股灵流在接点迎面相撞，回涌退入侧槽；原有连接未断。侧槽中可见逆行的波纹。';
    } else {
      if (move === 'method-left') next.left = true;
      else next.right = true;
      note = move === 'method-left' ? '旧流沿左槽进入接点，左侧槽纹亮起。' : '新流接入右槽，等候缓冲盏出流或旧流贯通。';
    }
  } else {
    passed = next.right && (next.buffer === 'charged' || (next.calm && next.left));
    failed = !passed; next.released = passed;
    note = passed ? (next.calm && next.left ? '两股灵流始终相承，玉环亮起；旧脉没有中断。' : '盏中灵流徐徐接入新脉，玉环亮起；逐段接续已成。') : '玉环尚未得到完整来流；已有接点仍保留。';
  }
  return result();
}
export function view(p: { step: 0 | 1; material: unknown }) {
  const v = valid(p.material) ? p.material : fresh(p.step);
  return {
    title: p.step === 0 ? '缓冲盏示范' : '双流相遇', visual: '双流玉盘',
    clue: '让旧流与新流接续，点亮玉环。',
    status: [v.left ? '旧流接点相连' : '旧流接点收起', v.buffer === 'charged' ? '缓冲盏存有旧流' : '缓冲盏空置', v.right ? '新流接点相连' : '新流尚未接入', v.backwash ? '侧槽回涌 · 可排流恢复' : v.calm ? '澄息相承 · 可同时保留双流' : '侧槽平静', ...(v.released ? ['玉环已亮'] : [])],
  };
}
export function solution(step: 0 | 1): string[] {
  return [...(step === 1 ? ['method-left', 'method-buffer'] : []), 'method-right', 'method-release'];
}
