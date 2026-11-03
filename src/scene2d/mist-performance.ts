import type { State } from '../world';
import type { Mist } from '../mist';

/** Only persisted facts. Taking this small copy also observes in-place prop updates. */
export function mistSnapshot(m: Mist) {
  return { stage: m.stage, garden: m.garden, station: m.station, ward: m.ward,
    passed: m.passed, lamp: m.lamp, revisited: m.revisited, attempts: m.attempts };
}
export type MistSnapshot = ReturnType<typeof mistSnapshot>;
export type MistCue = 'garden' | 'station' | 'ward' | 'passed' | 'lamp' | 'revisited' | 'retreat';
export const mistCueText: Record<MistCue, string> = {
  garden: '水流接上石渠，引灯草舒展开叶片。',
  station: '送信与归家的灵脉重新咬合。',
  ward: '归绳沿着护归阵纹稳住。',
  passed: '最后一道阵纹散开，旧信就在门后。',
  lamp: '探灵灯照亮了带回来的旧记录。',
  revisited: '墙后刻痕显现，避难室的归灯亮起。',
  retreat: '你退回阵门外，记下了阵眼的间歇。',
};
export function mistTransition(before: MistSnapshot, after: MistSnapshot): MistCue | undefined {
  for (const key of ['revisited', 'lamp', 'passed', 'garden', 'station', 'ward'] as const)
    if (!before[key] && after[key]) return key;
  if (after.attempts > before.attempts && !after.passed) return 'retreat';
}
export function mistWorld(s: State) {
  const m = s.adventure.mist;
  return {
    ...mistSnapshot(m),
    luchi: m.stage === 'letter' || (m.stage === 'home'
      ? s.journey.maps.sea !== 3 && m.partner !== 'companion'
      : m.partner === 'luchi' && !['dormant'].includes(m.stage)),
    lantern: m.stage === 'archive' || (m.lamp && ['camp', 'home', 'shrine'].includes(m.stage)),
    array: ['station', 'gate', 'archive'].includes(m.stage),
  };
}
