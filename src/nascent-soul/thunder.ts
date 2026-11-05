import { endLife } from '../mortality';
import type { State } from "../world";
import type { Move } from "../combat";
import { executeBattleAction } from "../combat";
import { tacticalPreview } from "../combat/game";
import { foundationPower } from "../foundation-journey/combat";
import type { ThunderBattle } from "./thunder-state";
export const thunderMethodNames = {
  none: "尚未掌握元婴续篇",
  continuity: "抱元归一诀 · 元婴续篇",
  stillness: "太素守神诀 · 元婴续篇",
} as const;
export const thunderWaves = [
  { name: "青霆洗身", hp: 280, attack: 47 },
  { name: "紫电照神", hp: 330, attack: 53 },
  { name: "合劫归一", hp: 360, attack: 60 },
] as const;
export function thunderPower(s: State) {
  const p = foundationPower(s),
    t = s.nascentSoul.thunder;
  return {
    ...p,
    damage: p.damage + (t.method === "continuity" ? 8 : 0),
    armor: p.armor + (t.method === "stillness" ? 6 : 0),
  };
}
export function thunderSignal(b: ThunderBattle) {
  const stage = (b.turn + b.wave) % 3;
  return [
    {
      name: "云根蓄雷",
      tell: "云根向石台收拢，先护住身形或辨清分流。",
      responses: ["guard", "discern"] as Move[],
    },
    {
      name: "雷脉分岔",
      tell: "分枝将合拢，抢先劈开雷脉或辨明主雷。",
      responses: ["strike", "discern"] as Move[],
    },
    {
      name: "正雷压顶",
      tell: "主雷已落，可借稳守化去余势，或沿前一合辨出的空隙反击。",
      responses: ["guard", "strike"] as Move[],
    },
  ][stage]!;
}
export function thunderEncounter(b: ThunderBattle) {
  const w =
    b.kind === "practice"
      ? { name: "引雷验法", hp: 220, attack: 57 }
      : thunderWaves[b.wave]!;
  return {
    ...w,
    pattern: ["guard", "discern", "strike"] as const,
    responses: thunderSignal(b).responses,
    coreOpen: (b.turn + b.wave) % 3 === 2,
  };
}
export function thunderExchange(s: State, move: Move, useHerbs = true) {
  const b = s.nascentSoul.thunder.battle;
  if (!b) return null;
  const p = thunderPower(s);
  return tacticalPreview(s, {
    move,
    battle: b,
    encounter: thunderEncounter(b),
    effect: b.effect,
    arrayCore: true,
    retaliateOnDefeat: true,
    useHerbs,
    power: { ...p, hp: b.maxHp },
    adjustments: [
      {
        phase: "power",
        armor: s.nascentSoul.protection === "array" ? 3 : 0,
        hp: 0,
        damage: 0,
      },
      {
        phase: "exchange",
        whenCorrect: true,
        damage: move === "strike" && b.effect === "guard" ? 6 : 0,
        incoming: move === "guard" && b.effect === "discern" ? -5 : 0,
        note:
          move === "guard" && b.effect === "discern"
            ? "沿已辨雷路卸力，承伤再减5。"
            : "",
      },
    ],
  });
}
export function startThunder(
  s: State,
  kind: ThunderBattle["kind"],
  reserve = 0,
) {
  const power = thunderPower(s);
  const maxHp =
    power.hp +
    (s.nascentSoul.protection === "friends" ? 18 : 0) +
    Math.min(12, reserve) * 2;
  s.nascentSoul.thunder.battle = {
    kind,
    wave: 0,
    hp: maxHp,
    maxHp,
    enemy: kind === "practice" ? 220 : thunderWaves[0].hp,
    turn: 0,
    effect: "",
  };
}
/** Only mutates command-owned draft. A zero-vigor simultaneous finish is failure. */
export function applyThunderTurn(s: State, move: Move, useHerbs = true) {
  const t = s.nascentSoul.thunder,
    b = t.battle!;
  const r = executeBattleAction(b, s.herbs,
    { turnLimit: 12, resolution: "simultaneous" },
    () => thunderExchange(s, move, useHerbs))!;
  const p = r.exchange;
  s.herbs = r.remainingHerbs;
  Object.assign(b, r.battle);
  b.hp = Math.min(b.hp, b.maxHp);
  b.effect = move;
  const outcome = b.hp <= 0 ? "loss" : r.outcome;
  let stage: "ongoing" | "wave" | "win" | "loss" = outcome;
  if (outcome === "win" && b.kind === "tribulation" && b.wave < 2)
    stage = "wave";
  t.last = {
    serial: (t.last?.serial ?? 0) + 1,
    move,
    damage: r.damage,
    incoming: r.incoming,
    wave: b.wave,
    outcome: stage,
  };
  if (stage === "loss") {
    t.battle = null;
    s.injury = Math.min(6, s.injury + (b.kind === "practice" ? 2 : 3));
    if (b.kind === "tribulation") {
      s.nascentSoul.failures++;
      if (b.hp <= 0) endLife(s, 'tribulation');
    }
  } else if (stage === "wave") {
    b.wave++;
    b.turn = 0;
    b.enemy = thunderWaves[b.wave]!.hp;
  } else if (stage === "win") {
    t.battle = null;
    if (b.kind === "practice") t.practiced = true;
    else {
      t.cleared = true;
      s.realm = 3;
      s.limit += 6000;
      s.cultivationRemainder = 0;
    }
  }
  return {
    kind: b.kind,
    outcome: stage,
    damage: r.damage,
    incoming: r.incoming,
    healing: r.healing,
    herbs: r.herbs,
    note: p.note,
  };
}
