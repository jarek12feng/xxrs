import { expect, it } from 'vitest';
import type { State } from '../src/world';
import { fresh, quote, solution, upgrade, valid, type PracticeState } from '../src/golden-story/practices/method';
function state(step: 0 | 1, material = fresh(step), method = 'none') {
  return { goldenStory: { practice: { topic: 'method', step, material } }, outerSea: { method }, herbs: 0 } as unknown as State;
}
function run(step: 0 | 1, moves: string[], method = 'none', initial = fresh(step)) {
  let material = initial;
  for (const move of moves) { const q = quote(state(step, material, method), move); expect(q.error).toBe(''); expect(q.herbs).toBe(0); material = q.next; }
  return material;
}
it('初试是短示范，续试零物资分段存盏；报价纯净且不重复通过', () => {
  for (const step of [0, 1] as const) {
    const s = state(step), before = JSON.stringify(s);
    quote(s, solution(step)[0]!); expect(JSON.stringify(s)).toBe(before);
    const done = run(step, solution(step)); expect(done.released).toBe(true); expect(valid(done)).toBe(true);
    expect(quote(state(step, done), 'method-release').error).not.toBe('');
  }
  expect(solution(0)).toHaveLength(2); expect(solution(1)).toHaveLength(4);
});
it('澄息篇保持双连接，缓冲路线收起旧连接；两法实际状态不同', () => {
  const continuous = run(1, ['method-calm', 'method-left', 'method-right', 'method-release'], 'clear');
  const buffered = run(1, solution(1));
  expect(continuous).toMatchObject({ left: true, right: true, buffer: 'empty', released: true });
  expect(buffered).toMatchObject({ left: false, right: true, buffer: 'charged', released: true });
  expect(quote(state(1), 'method-calm').error).toContain('澄息篇');
});
it('两流碰撞保留旧接点，零物资排回涌或中途换澄息均能恢复', () => {
  const initial = run(1, ['method-left']);
  const fail = quote(state(1, initial), 'method-right');
  expect(fail.failed).toBe(true); expect(fail.next).toMatchObject({ left: true, right: false, backwash: true });
  expect(run(1, ['method-drain', 'method-buffer', 'method-right', 'method-release'], 'none', fail.next).released).toBe(true);
  expect(run(1, ['method-calm', 'method-right', 'method-release'], 'clear', fail.next).released).toBe(true);
});
it('所有合法未完成状态均有零物资恢复路线', () => {
  for (const left of [false, true]) for (const right of [false, true]) for (const calm of [false, true]) for (const backwash of [false, true]) for (const buffer of ['empty', 'charged'] as const) {
    let v: PracticeState = { topic: 'method', schema: 2, left, right, calm, backwash, buffer, released: false };
    const apply = (m: string) => { const q = quote(state(1, v), m); expect(q.error).toBe(''); v = q.next; };
    if (v.backwash) apply('method-drain');
    // Existing right connection can accept stored old flow, but needs an old source first.
    if (!v.left && v.buffer === 'empty') {
      if (v.right && !v.calm) {
        apply('method-unhook');
      }
      apply('method-left');
    }
    if (v.buffer === 'empty') apply('method-buffer');
    if (!v.right && v.left && !v.calm) apply('method-left');
    if (!v.right) apply('method-right');
    apply('method-release'); expect(v.released).toBe(true);
  }
});
it('保守升级保留旧已接成果但不自动通过，拒绝未知schema与损坏布尔值', () => {
  for (const step of [0, 1] as const) {
    const old = { topic: 'method', flow: step + 1, joined: true };
    const next = upgrade(old, step); expect(next).toMatchObject({ right: true, buffer: 'charged', released: false });
    expect(run(step, ['method-release'], 'none', next).released).toBe(true);
    expect(upgrade(JSON.parse(JSON.stringify(next)), step)).toEqual(next);
  }
  expect(() => upgrade({ topic: 'method', schema: 3 }, 1)).toThrow();
  expect(valid({ ...fresh(1), left: 1 })).toBe(false);
  expect(quote(state(1), 'herb')).toMatchObject({ herbs: 0, passed: false });
  expect(quote(state(0), 'method-buffer').error).not.toBe('');
});
