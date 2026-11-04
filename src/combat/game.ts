import { correctResponse } from "./types";
import { combatSense } from "../spirit";
import { techniqueCombatProfile, techniquePower } from "../techniques";
/** Game-state adapter. The combat engine itself never imports world or story modules. */
import {
  equipmentPower,
  evaluateEquipment,
  equipmentTurnEffect,
} from "../equipment";
import { realmPressure } from "../realm-pressure";
import { mainTraining, supportTraining } from "../growth";
import type { State } from "../world";
import { previewAction, type ActionContext, type CombatPower } from "./index";

export function readiness(s: State) {
  const technique = techniquePower(s);
  const equipment = evaluateEquipment(s, {
    kind: "base",
    includeAttuned: true,
  });
  const base = {
    hp: Math.max(
      16,
      36 + s.foundation + (s.conclave?.stage ?? 0) * 12 - s.injury * 5,
    ),
    damage:
      5 +
      (s.realm >= 2 ? 12 : s.realm === 1 ? 2 : 0) +
      technique.damage +
      Math.floor(
        (combatSense(s.sense) + s.study * 2 + s.mastery + s.foundation) / 4,
      ) +
      equipment.damage +
      (s.conclave?.stage ?? 0) * 5,
    armor:
      (s.realm >= 2 ? 12 : s.realm === 1 ? 2 : 0) +
      technique.armor +
      equipment.armor +
      (s.conclave?.stage ?? 0) * 3,
  };
  return s.realm >= 3
    ? {
        hp: Math.floor(base.hp * 1.25),
        damage: Math.floor(base.damage * 1.2),
        armor: Math.floor(base.armor * 1.25),
      }
    : base;
}

export type TacticalContext = Omit<ActionContext, "profile"> & {
  power?: CombatPower;
  useHerbs?: boolean;
  pressure?: ActionContext["profile"]["pressure"];
};
export function tacticalPreview(s: State, context: TacticalContext) {
  const { encounter: e, battle: d, move } = context;
  const correct = correctResponse(e, d.turn, move);
  return previewAction({
    ...context,
    profile: {
      power: context.power ?? readiness(s),
      ...techniqueCombatProfile(s),
      herbs: context.useHerbs === false ? 0 : s.herbs,
      equipment: equipmentTurnEffect(s, move, correct),
      pressure:
        context.pressure ??
        (e.realm !== undefined && e.stage !== undefined
          ? realmPressure(s, { realm: e.realm, stage: e.stage })
          : undefined),
    },
  });
}

export function arenaContext(
  s: State,
  stance: import("./arena").ArenaStance,
  opponent: import("./arena").ArenaContext["opponent"] & {
    realm: 0 | 1 | 2 | 3;
    stage: number;
  },
): import("./arena").ArenaContext | null {
  const d = s.social.arena.duel;
  if (!d) return null;
  const correct = opponent.pattern[d.turn % opponent.pattern.length] === stance;
  const equipment = equipmentPower(s);
  return {
    battle: { hp: d.hp, enemy: d.enemyHp, turn: d.turn, maxHp: d.maxHp },
    stance,
    opponent,
    profile: {
      main: s.journey.main,
      support: s.journey.support,
      herbs: s.herbs,
      attackBase:
        mainTraining(s) * 2 +
        Math.floor((s.root + combatSense(s.sense) + s.study + s.mastery) / 8) +
        equipment.damage,
      armorBase: supportTraining(s) + equipment.armor,
      equipment: equipmentTurnEffect(
        s,
        stance === "break"
          ? "strike"
          : stance === "endure"
            ? "guard"
            : "discern",
        correct,
      ),
      pressure: realmPressure(s, opponent),
    },
  };
}

export { combatStyle } from "./style";
