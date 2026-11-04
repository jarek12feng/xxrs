import { battle, finiteTree, number, pattern } from "./validation";
import { draw } from "./random";
import type { BattleState, CombatProfile } from "./types";
export type ArenaStance = "break" | "endure" | "discern";
export interface ArenaBattle extends BattleState {
  maxHp: number;
}
export interface ArenaProfile {
  main: string | null;
  support: string | null;
  attackBase: number;
  armorBase: number;
  herbs: number;
  equipment: CombatProfile["equipment"];
  pressure: NonNullable<CombatProfile["pressure"]>;
}
export interface ArenaContext {
  battle: Readonly<ArenaBattle>;
  opponent: { attack: number; pattern: readonly ArenaStance[] };
  stance: ArenaStance;
  profile: ArenaProfile;
}
/** Historic arena formula; previews report a range and do not advance the seed. */
export function previewArenaAction({
  battle: d,
  opponent: e,
  stance,
  profile,
}: ArenaContext) {
  battle(d);
  finiteTree({ battle: d, opponent: e, profile });
  number(d.maxHp, "maxHp", 1);
  if (d.hp > d.maxHp) throw new RangeError("Invalid combat hp above maxHp");
  pattern(e.pattern, ["break", "endure", "discern"]);
  if (!["break", "endure", "discern"].includes(stance))
    throw new RangeError("Invalid combat stance");
  for (const key of ["attackBase", "armorBase", "herbs"] as const)
    number(profile[key], key);
  number(e.attack, "attack");
  number(profile.pressure.damageFactor, "damageFactor");
  number(profile.pressure.incomingExtra, "incomingExtra");
  const correct = e.pattern[d.turn % e.pattern.length] === stance;
  const skill = profile.main,
    support = profile.support;
  let damage =
    profile.attackBase +
    (stance === "endure" ? -2 : 0) +
    (correct ? 8 : 3) +
    (stance === "break" && skill === "blade" ? 4 : 0) +
    (stance === "discern" && skill === "breath" ? 3 : 0) +
    (stance === "discern" && support === "lantern" ? 3 : 0);
  let incoming = Math.max(
    1,
    e.attack +
      Math.floor(d.turn / 3) * 2 +
      (stance === "break" && skill === "blade" ? 2 : 0) -
      (stance === "discern" && skill === "breath" ? 2 : 0) -
      profile.armorBase -
      (stance === "endure" ? 6 : 0) +
      (correct ? 0 : 5) -
      (support === "guard" ? 2 : 0),
  );
  const temper = profile.equipment;
  damage += temper.damage;
  incoming = Math.max(1, incoming + temper.incoming);
  const pressure = profile.pressure;
  damage = Math.max(1, Math.floor(damage * pressure.damageFactor));
  incoming += pressure.incomingExtra;
  const heal =
    (stance === "endure" && skill === "spring" && profile.herbs > 0 ? 6 : 0) +
    (support === "herb" ? 1 : 0);
  const firstStrike = stance === "break" && skill === "blade";
  const incomingRange = [0, 1, 2].map((variation) =>
    firstStrike && Math.max(1, damage) + variation >= d.enemy
      ? 0
      : incoming + 2 - variation,
  );
  return {
    correct,
    incomingMin: Math.min(...incomingRange),
    incomingMax: Math.max(...incomingRange),
    damage: Math.max(1, damage),
    incoming,
    heal,
    herbs:
      stance === "endure" && skill === "spring" && profile.herbs > 0 ? 1 : 0,
    firstStrike,
  };
}

/** One arena action consumes exactly one xorshift draw, as before extraction. */
export function resolveArenaAction(context: ArenaContext, seed: number) {
  const d = context.battle;
  if (d.hp <= 0 || d.enemy <= 0 || d.turn >= 6)
    throw new RangeError("Battle already ended");
  const p = previewArenaAction(context);
  const next = draw(seed);
  const nextSeed = next.seed;
  const variation = Math.floor(next.value * 3);
  const damage = p.damage + variation;
  const incoming =
    p.firstStrike && damage >= d.enemy ? 0 : p.incoming + 2 - variation;
  const enemy = Math.max(0, d.enemy - damage);
  const remaining = Math.max(0, d.hp - incoming);
  const healing = remaining > 0 ? Math.min(d.maxHp - remaining, p.heal) : 0;
  const hp = remaining + healing;
  const turn = d.turn + 1;
  const outcome =
    hp === 0 || enemy === 0 || turn === 6
      ? enemy === 0 && hp > 0
        ? "win"
        : "loss"
      : "ongoing";
  return {
    battle: { ...d, hp, enemy, turn },
    seed: nextSeed,
    outcome,
    damage,
    incoming,
    healing,
    herbs: healing > 0 ? p.herbs : 0,
    correct: p.correct,
    firstStrike: p.firstStrike,
  };
}
