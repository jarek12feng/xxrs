import type { State } from "../world";
import type { Move } from "../combat";
export interface ThunderBattle {
  kind: "practice" | "tribulation";
  wave: number;
  hp: number;
  maxHp: number;
  enemy: number;
  turn: number;
  effect: "" | Move;
}
export interface ThunderPath {
  discovered: boolean;
  method: "none" | "continuity" | "stillness";
  practiced: boolean;
  battle: ThunderBattle | null;
  cleared: boolean;
  legacyCompleted: boolean;
  last: {
    serial: number;
    move: Move;
    damage: number;
    incoming: number;
    wave: number;
    outcome: "ongoing" | "wave" | "win" | "loss";
  } | null;
}
export const freshThunderPath = (): ThunderPath => ({
  discovered: false,
  method: "none",
  practiced: false,
  battle: null,
  cleared: false,
  legacyCompleted: false,
  last: null,
});
export function validThunderPath(s: State, n: ThunderPath) {
  const int = (v: unknown, max = 1e9) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
  if (
    !n ||
    ["discovered", "practiced", "cleared", "legacyCompleted"].some(
      (k) => typeof n[k as keyof ThunderPath] !== "boolean",
    ) ||
    !["none", "continuity", "stillness"].includes(n.method)
  )
    return false;
  if (
    (n.method !== "none" && !n.discovered) ||
    (n.practiced && n.method === "none") ||
    (n.cleared && !n.practiced)
  )
    return false;
  if (s.realm < 2)
    return JSON.stringify(n) === JSON.stringify(freshThunderPath());
  if (n.legacyCompleted && s.realm !== 3) return false;
  if (n.cleared && s.realm !== 3) return false;
  if (s.realm === 3 && !n.cleared && !n.legacyCompleted) return false;
  if (
    n.last !== null &&
    (!n.last ||
      !int(n.last.serial) ||
      n.last.serial < 1 ||
      !["guard", "strike", "discern"].includes(n.last.move) ||
      !int(n.last.damage) ||
      !int(n.last.incoming) ||
      !int(n.last.wave, 2) ||
      !["ongoing", "wave", "win", "loss"].includes(n.last.outcome))
  )
    return false;
  if (!n.battle) return true;
  const b = n.battle;
  return (
    s.realm === 2 &&
    s.status === "alive" &&
    s.nascentSoul.trial === null &&
    s.nascentSoul.attempt === null &&
    n.method !== "none" &&
    !n.cleared &&
    !n.legacyCompleted &&
    ["practice", "tribulation"].includes(b.kind) &&
    int(b.wave, b.kind === "practice" ? 0 : 2) &&
    int(b.hp, 10000) &&
    b.hp > 0 &&
    int(b.maxHp, 10000) &&
    b.maxHp >= b.hp &&
    int(b.enemy, 1000) &&
    b.enemy > 0 &&
    int(b.turn, 11) &&
    ["", "guard", "strike", "discern"].includes(b.effect) &&
    (b.kind !== "tribulation" || n.practiced)
  );
}
