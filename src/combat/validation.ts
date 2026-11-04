import type { BattleState } from "./types";

/** Internal contracts: reject invalid input instead of allowing NaN to enter a save. */
export function number(
  value: number,
  name: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`Invalid combat ${name}`);
}
export function integer(
  value: number,
  name: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
) {
  number(value, name, min, max);
  if (!Number.isSafeInteger(value))
    throw new RangeError(`Invalid combat ${name}`);
}
export function finiteTree(value: unknown) {
  if (typeof value === "number")
    number(value, "number", -Number.MAX_SAFE_INTEGER);
  else if (value && typeof value === "object")
    Object.values(value).forEach(finiteTree);
}
export function battle(value: Readonly<BattleState>) {
  integer(value.hp, "hp");
  integer(value.enemy, "enemy");
  integer(value.turn, "turn");
}
export function pattern(value: readonly string[], allowed: readonly string[]) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((v) => !allowed.includes(v))
  )
    throw new RangeError("Invalid combat pattern");
}
