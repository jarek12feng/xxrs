import { dutySituations, isDuty } from "../src/qi-cultivation/duties";
import type { State, Intent } from "../src/core";
/** Public-command policy; never grants resources or edits progress. */
export function qiCultivationStep(s: State): Intent | null {
  const p = s.qiJourney.cultivation,
    w = p.work;
  const act = (action: string): Intent => ({
    type: "qiJourney",
    action: ("cultivation:" + action) as Extract<
      Intent,
      { type: "qiJourney" }
    >["action"],
  });
  if (w) {
    if (w.kind === "alchemy") {
      const heat = [2, 1, 3][w.progress]!;
      return act(
        w.pressure < heat
          ? "heat"
          : w.pressure > heat
            ? "coolFire"
            : ["extract", "blend", "condense"][w.progress]!,
      );
    }
    if (w.kind === "circulation" || w.kind === "relic")
      return act(w.pressure >= 3 ? "ease" : "circulate");
    if (w.kind === "herb") return act(w.pressure > 1 ? "brace" : "harvest");
    if (isDuty(w.kind)) return act(dutySituations[w.kind][w.pressure]!.answer);
    return null;
  }
  if (s.pending?.kind === "relic" && !p.relic) return act("relic");
  if (s.realm || p.middle) return null;
  if (s.qi < 119) return { type: "advance", activity: "cultivate", months: 12 };
  if (s.injury) return { type: "advance", activity: "rest", months: 3 };
  if (s.study < 2) return { type: "advance", activity: "study", months: 2 };
  const main = s.path === "sword" ? "blade" : "spring";
  if (!s.journey.known.includes(main))
    return s.stones < 20
      ? { type: "advance", activity: "work", months: 6 }
      : { type: "learn", technique: main };
  if (s.journey.main !== main) return { type: "equip", technique: main };
  if (!s.growth.training[main])
    return s.stones < 12
      ? { type: "advance", activity: "work", months: 6 }
      : { type: "trainTechnique", technique: main };
  return act("begin");
}
