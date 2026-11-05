import { expect, it } from 'vitest';
import { dispatch, migrateSave, validState, type State } from '../src/core';
import { conclaveCheckpoint } from '../tools/conclave-checkpoint';
import { freshMaterialPractice, materialPracticeQuote, materialSolution, upgradeMaterialPractice, type MaterialTopic } from '../src/golden-story/material-practice';
import { freshLegacyMaterialPractice } from '../src/golden-story/legacy-material-practice';
import { teachingSolution, type TeachingMove } from '../src/golden-story/teaching';
const checkpoint = conclaveCheckpoint();
let id = 0;
const start = (topic: MaterialTopic) => dispatch(checkpoint, { id: `scene-start-${++id}`, type: 'goldenStory', action: { kind: 'ask', topic, source: 'public' } });
const move = (s: State, m: TeachingMove) => {
  const command = { id: `scene-move-${++id}`, type: 'goldenStory', action: { kind: 'practice', move: m } } as const;
  const before = structuredClone(s), next = dispatch(s, command);
  expect(s).toEqual(before);
  expect(dispatch(s, command)).toEqual(next);
  expect(dispatch(next, command)).toBe(next);
  expect(validState(next)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(next)))).toEqual(next);
  return next;
};
for (const topic of ['method', 'pill', 'ground'] as const) {
  it(`${topic}从真实问法入口通过普通现场操作完成，阶段不提前授奖`, () => {
    let s = start(topic); s.herbs = 0;
    const before = structuredClone(s);
    for (const step of [0, 1] as const) {
      for (const action of materialSolution(topic, step)) {
        const quoteBefore = structuredClone(s), quote = materialPracticeQuote(s, action);
        expect(s).toEqual(quoteBefore); expect(quote.error).toBe('');
        s = move(s, action);
      }
      if (step === 0) { expect(s.goldenStory.teachings).not.toContain(topic); expect(s.goldenStory.practice?.step).toBe(1); }
    }
    expect(s.goldenStory.teachings).toContain(topic);
    expect(s.goldenStory.practice).toBeNull();
    expect([s.month, s.herbs, s.stones, s.seed]).toEqual([before.month, before.herbs, before.stones, before.seed]);
    expect(move(s, materialSolution(topic, 1).at(-1)!)).toBe(s);
  });
  it(`${topic}v55至v57迁移保留来源、阶段、错误与旧试具成果`, () => {
    for (const version of [55, 56, 57]) for (const step of [0, 1] as const) {
      const old: any = start(topic); old.version = version;
      old.goldenStory.practice.step = step; old.goldenStory.practice.errors = 3;
      const legacy = freshLegacyMaterialPractice(topic, step);
      if (version === 55) delete old.goldenStory.practice.material;
      else old.goldenStory.practice.material = legacy;
      const before = JSON.stringify(old), up = migrateSave(old);
      expect(up.goldenStory.practice).toMatchObject({ source: 'public', step, errors: 3, material: upgradeMaterialPractice(topic, legacy, step) });
      expect(up.goldenStory.teachings).toEqual(old.goldenStory.teachings);
      expect(JSON.stringify(old)).toBe(before); expect(validState(up)).toBe(true);
    }
  });
  it(`${topic}当前档拒绝旧形状、缺失、串题与未知版本，已完成不重发`, () => {
    const bad: any = start(topic);
    bad.goldenStory.practice.material = freshLegacyMaterialPractice(topic, 0);
    expect(validState(bad)).toBe(false); expect(() => migrateSave(bad)).toThrow();
    const terminal = freshMaterialPractice(topic, 0);
    if (terminal.topic === 'method') { terminal.right = true; terminal.released = true; }
    else if (terminal.topic === 'pill') { terminal.haze = 'clear'; terminal.collected = true; }
    else { terminal.guard = 'inner'; terminal.outcome = 'sheltered'; }
    bad.goldenStory.practice.material = terminal;
    expect(validState(bad)).toBe(false); expect(() => migrateSave(bad)).toThrow();
    delete bad.goldenStory.practice.material;
    expect(validState(bad)).toBe(false); expect(() => migrateSave(bad)).toThrow();
    bad.goldenStory.practice.material = freshMaterialPractice(topic === 'method' ? 'pill' : 'method', 0);
    expect(validState(bad)).toBe(false);
    let done = start(topic); for (const action of teachingSolution(topic)) done = move(done, action);
    const up = migrateSave({ ...done, version: 57 });
    expect(up.goldenStory.teachings).toEqual(done.goldenStory.teachings);
    expect(up.goldenStory.teachingPracticeResults).toEqual(done.goldenStory.teachingPracticeResults);
    expect(up.goldenStory.practice).toBeNull();
    expect(() => migrateSave({ ...done, version: done.version + 1 })).toThrow();
  });
}
it('v55进行中的神识状态穿过场景升级仍原样保留', () => {
  let s = dispatch(checkpoint, {id:'agency-spirit',type:'goldenStory',action:{kind:'ask',topic:'spirit',source:'public'}});
  s = move(s, 'anchor'); s = move(s, 'listen');
  const up = migrateSave({...s,version:55});
  expect(up.goldenStory.practice).toEqual(s.goldenStory.practice);
});
