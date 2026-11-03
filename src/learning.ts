import type { State } from "./world";
export type LearningChoice = "spring" | "blade" | "breath" | "vial" | "sword";
export const freshLearning = () => ({ book: false, relic: false });
export function validLearning(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const r = x as ReturnType<typeof freshLearning>;
  return typeof r.book === "boolean" && typeof r.relic === "boolean";
}
export function learningBlocked(s: State) {
  return (
    s.status !== "alive" ||
    !!(
      s.pending ||
      s.social.scene ||
      s.social.arena.duel ||
      s.expedition.duel ||
      s.foundationJourney.duel ||
      s.qiJourney.node
    )
  );
}
export function runLearning(
  input: State,
  choice: LearningChoice,
  id: string,
  equip = false,
): State {
  if (!id || input.seen.includes(id) || learningBlocked(input)) return input;
  const book = ["spring", "blade", "breath"].includes(choice);
  if (!book && !["vial", "sword"].includes(choice)) return input;
  if (
    book
      ? input.adventure.step !== "done" || input.journey.learning.book
      : input.expedition.cleared < 1 || input.journey.learning.relic
  )
    return input;
  const s = structuredClone(input);
  if (book) {
    const t = choice as "spring" | "blade" | "breath";
    const owned = s.journey.known.includes(t);
    if (owned) s.stones += 20;
    else s.journey.known.push(t);
    s.journey.learning.book = true;
    if (equip) s.journey.main = t;
    s.adventure.result += owned
      ? "你已学过所选功法，药工将谢礼折为灵石 20。"
      : `你收下${{ spring: "长春诀", blade: "听松剑经", breath: "归元息" }[t]}，开始依诀修行；以后仍可学习其他功法。`;
  } else {
    const r = choice as "vial" | "sword";
    if (s.journey.relics[r]) s.stones += 12;
    else s.journey.relics[r] = 1;
    s.journey.learning.relic = true;
    s.expedition.last = `你选了${r === "sword" ? "听松灵剑" : "归元灵瓶"}作为谢礼；已有同件法器时折为灵石 12。可在储物袋装配。`;
  }
  s.seen = [...input.seen, id].slice(-512);
  return s;
}
