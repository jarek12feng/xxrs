import type { State } from "../src/core";
/** Build the actual v27-v34 layout, rather than relabeling a current save. */
export function legacyEquipment(s: Pick<State, "treasures">) {
  const { artifacts: _, ...treasures } = s.treasures;
  return { ...treasures, equipped: treasures.equipped[0] ?? null };
}
