import type { Adventure } from "./adventure";
// Frozen pre-choice validation: never infer a decision from old prose.
const adventureScenes = Object.fromEntries(
  ["invitation", "ferry", "apothecary", "forest", "shrine", "home", "done"].map(
    (k) => [k, true],
  ),
);
export function validAdventureV10(a: Omit<Adventure, "rescueChoice">) {
  return (
    !!a &&
    Object.hasOwn(adventureScenes, a.step) &&
    typeof a.clue === "boolean" &&
    ["none", "medicine", "guide", "ward"].includes(a.method) &&
    typeof a.ready === "boolean" &&
    Number.isSafeInteger(a.attempts) &&
    a.attempts >= 0 &&
    typeof a.result === "string" &&
    a.result.length < 1000 &&
    (!a.ready || a.method !== "none") &&
    (!["apothecary", "forest", "shrine", "home", "done"].includes(a.step) ||
      a.clue) &&
    (!["home", "done"].includes(a.step) || (a.ready && a.attempts > 0))
  );
}
