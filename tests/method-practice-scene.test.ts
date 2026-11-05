// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { createApp, h, nextTick, shallowRef, type App } from 'vue';
import type { State } from '../src/world';
import PracticeScene from '../src/golden-story/practices/method/PracticeScene.vue';
import { fresh, quote } from '../src/golden-story/practices/method';
let app: App;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
it('对象发出动作而不改游戏，保存状态更新后才显示；读档保留回涌并可换法', async () => {
  const game = shallowRef({ goldenStory: { practice: { topic: 'method', step: 1, material: fresh(1), feedback: '' } }, outerSea: { method: 'clear' }, herbs: 0 } as unknown as State);
  const moves: string[] = [];
  app = createApp({ render: () => h(PracticeScene, { game: game.value, busy: false, onMove: (m: string) => moves.push(m) }) });
  app.mount(document.body.appendChild(document.createElement('div')));
  const button = (m: string) => document.querySelector<HTMLButtonElement>(`[data-move="${m}"]`)!;
  const commit = async (m: string) => {
    const q = quote(game.value, m); expect(q.error).toBe('');
    const saved = JSON.parse(JSON.stringify(game.value)); saved.goldenStory.practice.material = q.next; saved.goldenStory.practice.feedback = q.note;
    game.value = saved; await nextTick();
  };
  const before = JSON.stringify(game.value); button('method-left').click();
  expect(moves).toEqual(['method-left']); expect(JSON.stringify(game.value)).toBe(before);
  await commit('method-left'); await commit('method-right');
  expect(document.querySelector('[data-backwash="true"]')).not.toBeNull();
  game.value = JSON.parse(JSON.stringify(game.value)); await nextTick();
  expect(button('method-right').disabled).toBe(true);
  expect(button('method-calm').disabled).toBe(false);
  await commit('method-calm'); await commit('method-right'); await commit('method-release');
  expect(document.body.textContent).toContain('玉环已亮');
  expect(button('method-release').disabled).toBe(true);
});
it('忙碌与未学功法禁用入口，零物资缓冲示范可直接接流', async () => {
  const busy = shallowRef(false);
  const game = { goldenStory: { practice: { topic: 'method', step: 0, material: fresh(0), feedback: '' } }, outerSea: { method: 'none' }, herbs: 0 } as unknown as State;
  app = createApp({ render: () => h(PracticeScene, { game, busy: busy.value }) });
  app.mount(document.body.appendChild(document.createElement('div')));
  expect(document.querySelector<HTMLButtonElement>('[data-move="method-calm"]')!.disabled).toBe(true);
  expect(document.querySelector<HTMLButtonElement>('[data-move="method-right"]')!.disabled).toBe(false);
  busy.value = true; await nextTick();
  expect([...document.querySelectorAll('button')].every(b => b.disabled)).toBe(true);
});
