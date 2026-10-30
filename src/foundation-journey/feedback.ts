import type { Intent, State } from "../world";
import { foundationExchange, foundationPower } from "./combat";
import { challenges } from "./content";

export interface CombatFeedback {
  turn: number;
  foe: string;
  enemy: { before: number; after: number; max: number };
  player: { before: number; after: number; max: number };
  damage: number;
  incoming: number;
  healing: number;
  herbs: number;
  effects: string[];
  outcome: "win" | "loss" | "ongoing";
}
// Transient presentation only. The caller publishes this after persistence succeeds.
export function combatFeedback(
  before: State,
  after: State,
  intent: Intent,
): CombatFeedback | null {
  const d = before.foundationJourney.duel;
  if (
    before === after ||
    !d ||
    intent.type !== "foundationJourney" ||
    intent.action.kind !== "move"
  )
    return null;
  const next = after.foundationJourney.duel;
  const won =
    !before.foundationJourney.won.includes(d.id) &&
    after.foundationJourney.won.includes(d.id);
  if (next && (next.id !== d.id || next.turn !== d.turn + 1)) return null;
  if (
    !next &&
    !won &&
    after.foundationJourney.last === before.foundationJourney.last
  )
    return null;
  const p = foundationExchange(before, intent.action.move)!;
  const enemy = next?.enemy ?? (won ? 0 : Math.max(0, d.enemy - p.damage));
  const incoming = won ? 0 : Math.min(d.hp, p.incoming);
  const healing = won ? 0 : p.healing;
  const player =
    next?.hp ?? (won ? d.hp : Math.max(0, d.hp - incoming) + healing);
  const effects: string[] = [];
  if (p.note.includes("剑经循隙")) effects.push("循隙反击");
  if (p.note.includes("长春固护") && !won) effects.push("固护减伤");
  if (p.note.includes("归元息照见阵核")) effects.push("辨影破核");
  if (p.note.includes("周天贯流")) effects.push("周天贯流");
  if (p.note.includes("沉井传承")) effects.push("沉井传承");
  if (healing) effects.push(`回春 +${healing}`);
  return {
    turn: d.turn + 1,
    foe: challenges[d.id].foe,
    enemy: { before: d.enemy, after: enemy, max: challenges[d.id].hp },
    player: { before: d.hp, after: player, max: foundationPower(before).hp },
    damage: d.enemy - enemy,
    incoming,
    healing,
    herbs: before.herbs - after.herbs,
    effects,
    outcome: won ? "win" : next ? "ongoing" : "loss",
  };
}
