export const moves = {
  guard: "守势化劲",
  strike: "破绽反击",
  discern: "凝神辨影",
} as const;
export type Move = keyof typeof moves;
export interface BattleState {
  hp: number;
  enemy: number;
  turn: number;
}
export interface CombatPower {
  hp: number;
  damage: number;
  armor: number;
}
export interface CombatEncounter {
  realm?: 0 | 1 | 2;
  stage?: number;
  hp: number;
  attack: number;
  pattern: readonly Move[];
  coreOpen?: boolean;
}
export interface CombatProfile {
  power: CombatPower;
  main: string | null;
  mainActive: boolean;
  lantern: boolean;
  herbs: number;
  equipment: { damage: number; incoming: number; note: string };
  pressure?: {
    damageFactor: number;
    incomingExtra: number;
    gap: number;
    description: string;
  };
}
export interface TurnExchange {
  damage: number;
  incoming: number;
  healing: number;
  herbs: number;
}
export type BattleOutcome = "ongoing" | "win" | "loss";

export type CombatEffect =
  | "array-discern"
  | "inheritance"
  | "blade-counter"
  | "spring-guard"
  | "circulation";

/** Ordered data contributions; chapters select conditions, the engine applies arithmetic. */
export type CombatAdjustment =
  | {
      phase: "power";
      damage?: number;
      armor?: number;
      hp?: number;
      note?: string;
    }
  | {
      phase: "exchange";
      damage: number;
      incoming: number;
      note: string;
      effects?: readonly CombatEffect[];
      whenCorrect?: boolean;
    }
  | { phase: "afterHealing"; incoming: number; note?: string };
