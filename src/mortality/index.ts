import type { State } from '../world';
import { resolveTurn } from '../combat';
import type { BattleState, TurnExchange } from '../combat';

export type DeathCause = 'lifespan' | 'sea' | 'lizhao' | 'duel' | 'tribulation';
export interface DeathRecord { cause: DeathCause; month: number; age: number; realm: number }
export const deathScenes = {
  lifespan: { title: '灯尽山中', place: '寿元耗尽', image: '/scenes/moon-terrace.png', music: 'last-lamp', text: '最后一息灵气散入夜色。天关未再开启，这段人生停在了此处。' },
  sea: { title: '潮深未归', place: '外海内府', image: '/art/outer-sea/inner.webp', music: 'lost-tide', text: '内府潮压击碎护体灵光。尚未解开的机缘留在潮下，你没能走回那段石道。' },
  lizhao: { title: '药香隔岸', place: '离照内层药池', image: '/art/outer-sea/inner.webp', music: 'lost-tide', text: '药池中的最后一道护持散去。你为凝婴而来的路，终止在离照药池深处。' },
  duel: { title: '归舟不至', place: '伏潮湾夺药交锋', image: '/art/review-fixes/fuchao-bay.webp', music: 'lost-tide', text: '夺药者的最后一击击穿护体。海湾仍有归舟，这一次却没能载你回港。' },
  tribulation: { title: '雷散人未归', place: '凝婴渡劫台', image: '/art/nascent-tribulation/tribulation-platform-v1.webp', music: 'silent-thunder', text: '劫雷击散未稳的婴形，最后的生机随雷光熄灭。你曾走到天关之前，却未能跨过。' },
} as const;
/** Mutates only the command-owned draft, never grants defeat or victory rewards. */
export function endLife(s: State, cause: DeathCause) {
  if (s.status !== 'alive') return;
  s.death = { cause, month: s.month, age: s.age, realm: s.realm };
  s.status = 'dead';
  s.pending = null;
  s.ascension = null;
  s.earned = 0;
  s.result = `${deathScenes[cause].title}：${deathScenes[cause].text}`;
  s.log.unshift({ month: s.month, kind: 'major', text: s.result });
  s.log = s.log.slice(0, 180);
}
export function validDeath(s: State) {
  const d = s.death;
  if (d === null) return true; // Old endings retain their original, possibly unknown cause.
  return !!d && s.status === 'dead' && Object.hasOwn(deathScenes, d.cause)
    && d.month === s.month && d.age === s.age && d.realm === s.realm
    && (d.cause !== 'lifespan' || s.age >= s.limit);
}
export function deathView(s: State) {
  const cause = s.death?.cause ?? (s.age >= s.limit ? 'lifespan' : null);
  return cause ? deathScenes[cause] : {
    title: '此生落笔', place: '旧卷中的终点', image: '/scenes/moon-terrace.png',
    music: 'last-lamp' as const, text: s.result || '这段人生已结束，来路仍留在卷中。',
  };
}
/** Uses the settlement's simultaneous-resolution rule, including healing and retaliation. */
export function mortalWarning(b: BattleState, p: TurnExchange, turnLimit: number, toxin = false) {
  const r = resolveTurn(b, p, { turnLimit, resolution: 'simultaneous' });
  return r.battle.hp <= 0 || toxin ? '【致命】此招将导致陨落；请改招或撤离整备。' : '';
}
