// @vitest-environment happy-dom
import {selectPracticeObject} from './helpers/practice-scene';
import { afterEach, expect, it } from 'vitest';
import { createApp, h, nextTick, shallowRef, type App } from 'vue';
import { dispatch, migrateSave, validState, type State, type Intent } from '../src/core';
import { conclaveCheckpoint } from '../tools/conclave-checkpoint';
import { goldenStoryQuote } from '../src/golden-story/rules';
import type { TeachingMove } from '../src/golden-story/teaching';
import GoldenStoryScene from '../src/golden-story/GoldenStoryScene.vue';

const base = conclaveCheckpoint();
let serial = 0;
const move = (s: State, action: TeachingMove) => dispatch(s, {
  id: `herb-guard-${++serial}`, type: 'goldenStory', action: { kind: 'practice', move: action },
});
const start = (topic: 'pill' | 'spirit') => dispatch(base, {
  id: `herb-guard-${++serial}`, type: 'goldenStory', action: { kind: 'ask', topic, source: 'public' },
});
let app: App | undefined;
afterEach(() => { app?.unmount(); app = undefined; document.body.innerHTML = ''; });

async function expectBlocked(s: State, label: string, reason: string, action: TeachingMove = 'herb') {
  const saved = migrateSave(JSON.parse(JSON.stringify(s)));
  expect(validState(saved)).toBe(true);
  const before = structuredClone(saved);
  const quote = goldenStoryQuote(saved, { kind: 'practice', move: action });
  expect(quote.error).toContain(reason);
  expect(quote.herbs).toBe(0);
  expect(move(saved, action)).toBe(saved);
  expect(saved).toEqual(before);
  const game = shallowRef(saved);
  let emitted = 0;
  app = createApp({ render: () => h(GoldenStoryScene, {
    game: game.value, busy: false, place: 'sea',
    onAct: (_intent: Intent) => { emitted++; },
  }) });
  app.mount(document.body.appendChild(document.createElement('div')));
  await nextTick();
  await selectPracticeObject(action);
  const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(label))!;
  expect(button.disabled).toBe(true);
  expect(button.parentElement?.textContent).toContain(reason);
  button.click();
  expect(emitted).toBe(0);
}

it('分药没有混流时禁用灵草，混流时付费保留分离成果', async () => {
  let s = start('pill');
  await expectBlocked(s, '灵草吸浊', '没有混流', 'pillHerb');
  s = move(s, 'pillWarm');
  s = move(s, 'pillVent');
  s = move(s, 'pillCollect');
  s = move(s, 'pillHold');
  s = move(s, 'pillVent');
  const before = s;
  expect(goldenStoryQuote(s, {kind:'practice',move:'pillHerb'}).error).toBe('');
  s = move(s, 'pillHerb');
  expect(s.herbs).toBe(before.herbs - 2);
  expect(s.goldenStory.practice?.material).toMatchObject({breath:'sidecup',muddled:false});
  expect(validState(s)).toBe(true);
});

it('稳念无识压时拒绝护神，识压升高后仍可付费恢复且保留回声', async () => {
  let s = move(start('spirit'), 'anchor');
  await expectBlocked(s, '灵草护神', '本念已稳，识压已散');
  s = move(s, 'split');
  const before = s;
  expect(goldenStoryQuote(s, { kind: 'practice', move: 'herb' }).error).toBe('');
  s = move(s, 'herb');
  expect(s.herbs).toBe(before.herbs - 2);
  expect(s.goldenStory.practice?.spirit).toEqual({ anchored: true, echoes: 2, pressure: 0 });
  expect(validState(s)).toBe(true);
});
