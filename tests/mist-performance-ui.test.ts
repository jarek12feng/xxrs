import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import MistWorld from '../src/scene2d/MistWorld.vue';
import MistPanel from '../src/MistPanel.vue';

const apps: ReturnType<typeof createApp>[] = [];
afterEach(() => { apps.splice(0).forEach(app => app.unmount()); vi.useRealTimers(); vi.restoreAllMocks(); });
function mount(completed = false) {
  const s = createGame('归途','wood',42);
  s.adventure.mist.stage = 'garden'; s.adventure.mist.garden = completed;
  const game = shallowRef(s); const host = document.createElement('div'); const performing = vi.fn();
  const app = createApp({ render: () => h(MistWorld,{ game:game.value, onPerforming:performing }) });
  app.mount(host); apps.push(app);
  const save = (patch: Partial<typeof s.adventure.mist>) => {
    const next = structuredClone(game.value); Object.assign(next.adventure.mist,patch); game.value = next;
  };
  return { host, game, save, performing, app };
}
it('初始完成只有最终现场；保存前无成功反馈；新保存后可跳过且不修改结果', async () => {
  vi.useFakeTimers(); const loaded = mount(true);
  expect(loaded.host.querySelector('[role=status]')).toBeNull();
  expect(loaded.host.querySelector('.restored')).not.toBeNull();
  loaded.app.unmount(); apps.splice(apps.indexOf(loaded.app),1);
  const {host,game,save,performing} = mount();
  expect(host.querySelector('.restored')).toBeNull();
  expect(host.querySelector('[role=status]')).toBeNull();
  const timersBefore = vi.getTimerCount();
  save({ garden:true }); await nextTick();
  expect(vi.getTimerCount()).toBe(timersBefore + 1);
  expect(performing).toHaveBeenCalledOnce();
  expect(host.textContent).toContain('水流接上石渠');
  const persisted = JSON.stringify(game.value);
  host.querySelector<HTMLButtonElement>('.mist-performance button')!.dispatchEvent(new MouseEvent('click')); await nextTick();
  expect(host.querySelector('[role=status]')).toBeNull();
  expect(host.querySelector('.restored')).not.toBeNull();
  expect(JSON.stringify(game.value)).toBe(persisted);
  expect(vi.getTimerCount()).toBe(timersBefore);
});
it('阶段切换成功反馈，失败不显示开门，切场景与卸载取消计时器', async () => {
  vi.useFakeTimers(); const {host,save,app} = mount();
  save({stage:'archive', passed:true, attempts:1}); await nextTick();
  expect(host.querySelector('.opened')).not.toBeNull();
  expect(host.textContent).toContain('最后一道阵纹散开');
  save({stage:'camp'}); await nextTick(); expect(vi.getTimerCount()).toBe(0);
  save({stage:'gate',passed:false, attempts:2}); await nextTick();
  expect(host.textContent).toContain('退回阵门外');
  expect(host.querySelector('.opened')).toBeNull();
  app.unmount(); apps.splice(apps.indexOf(app),1); expect(vi.getTimerCount()).toBe(0);
});
it('后台中止演出，恢复前台不重播；Escape 可跳过', async () => {
  vi.useFakeTimers(); const {host,save} = mount();
  save({garden:true}); await nextTick();
  vi.spyOn(document,'hidden','get').mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange')); await nextTick();
  expect(host.querySelector('[role=status]')).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  vi.restoreAllMocks(); document.dispatchEvent(new Event('visibilitychange'));
  save({stage:'station',station:true}); await nextTick();
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); await nextTick();
  expect(host.querySelector('[role=status]')).toBeNull();
});
it('减少动态效果保留完成现场、不创建演出计时器', async () => {
  vi.useFakeTimers(); vi.spyOn(window,'matchMedia').mockReturnValue({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList);
  const {host,save} = mount(); save({garden:true}); await nextTick();
  expect(host.querySelector('.restored')).not.toBeNull(); expect(host.querySelector('[role=status]')).toBeNull(); expect(vi.getTimerCount()).toBe(0);
});

it('继续选择现场热点时停止短反馈并保留已完成的场景', async () => {
  vi.useFakeTimers();
  const s = createGame('归途','wood',42); s.adventure.mist.stage = 'garden';
  const game = shallowRef(s), host = document.createElement('div');
  const app = createApp({ render: () => h(MistPanel, {game:game.value,busy:false}) });
  app.mount(host); apps.push(app); await nextTick();
  const next = structuredClone(s); next.adventure.mist.garden = true; game.value = next;
  await nextTick(); await nextTick();
  expect(host.querySelector('.mist-performance')).not.toBeNull();
  host.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.dispatchEvent(new MouseEvent('click'));
  await nextTick();
  expect(host.querySelector('.mist-performance')).toBeNull();
  expect(host.querySelector('.mist-garden.restored')).not.toBeNull();
  expect(host.querySelector('.narrative-inspector')).not.toBeNull();
});
