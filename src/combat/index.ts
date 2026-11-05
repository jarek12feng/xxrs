/** Public, framework-independent battle interface. No story, storage, clock or global state. */
export { moves } from "./types";
export type {
  Move,
  BattleState,
  CombatPower,
  CombatEncounter,
  CombatProfile,
  TurnExchange,
  BattleOutcome,
  CombatEffect,
  CombatAdjustment,
} from "./types";
export { previewAction, type ActionContext } from "./engine";
export { startBattle, resolveTurn, type TurnPolicy } from "./turn";

export {
  previewArenaAction,
  resolveArenaAction,
  type ArenaContext,
  type ArenaBattle,
  type ArenaProfile,
  type ArenaStance,
} from "./arena";

export {
  previewEncounter,
  resolveEncounter,
  type EncounterProfile,
  type EncounterPreview,
} from "./encounter";

export { executeBattleAction } from "./action";
