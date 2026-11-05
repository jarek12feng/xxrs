import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { describe, expect, it } from 'vitest';

import { freshMist } from '../src/mist';
import { mistSnapshot, mistTransition, mistWorld } from '../src/scene2d/mist-performance';
describe('雾海只读现场投影', () => {
  it('只在持久化事实增加时反馈，读档快照和重访不会重播', () => {
    const initial = mistSnapshot(freshMist());
    for (const key of ['garden','station','ward','passed','lamp','revisited'] as const) {
      const next = { ...initial, [key]: true };
      expect(mistTransition(initial,next)).toBe(key);
      expect(mistTransition(next,{ ...next, stage:'camp' })).toBeUndefined();
      expect(mistTransition(next,next)).toBeUndefined();
      expect(mistTransition(next,initial)).toBeUndefined();
    }
  });
  it('入阵失败只显示撤回，不开启阵门或照亮归灯', () => {
    const initial = mistSnapshot(freshMist());
    expect(mistTransition(initial,{ ...initial, attempts:1 })).toBe('retreat');
    expect(mistTransition(initial,{ ...initial, attempts:1, passed:true, stage:'archive' })).toBe('passed');
  });
  it('陆迟不会跟着独行角色，也不会在已回家时出现在茶摊', () => {
    const s = createGame('归途','wood',42);
    s.adventure.mist.stage = 'garden'; s.adventure.mist.partner = 'solo';
    expect(mistWorld(s).luchi).toBe(false);
    s.adventure.mist.partner = 'luchi'; expect(mistWorld(s).luchi).toBe(true);
    s.adventure.mist.stage = 'home'; s.journey.maps.sea = 3;
    expect(mistWorld(s).luchi).toBe(false);
  });
  it('现场投影不修改年月、种子、资源和存档', () => {
    const s = createGame('归途','wood',42); const before = JSON.stringify(s);
    mistWorld(s); mistSnapshot(s.adventure.mist);
    expect(JSON.stringify(s)).toBe(before);
  });
});
