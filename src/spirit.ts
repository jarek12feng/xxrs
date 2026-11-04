/** Shared cultivation limits; no world, UI, random or persistence dependencies. */
export function senseLimit(realm: number) {
  return realm >= 2 ? 48 : realm === 1 ? 24 : 12;
}
/** Old accuracy/damage formulas retain their original range. Further growth powers equipment. */
export function combatSense(sense: number) {
  return Math.min(12, sense);
}
export function controlCapacity(sense: number) {
  return 4 + Math.floor(sense / 3);
}
