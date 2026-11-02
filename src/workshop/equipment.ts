import type { State } from "../world";
export function equipmentPower(s: State) {
  const rank = s.journey.equipped ? s.journey.relics[s.journey.equipped] : 0;
  return {
    damage: s.journey.equipped === "sword" ? (rank === 2 ? 5 : rank * 2) : 0,
    armor: s.journey.equipped === "vial" ? (rank === 2 ? 3 : rank) : 0,
  };
}
