import {qiCultivationStep} from './qi-cultivation-policy';
import { admissionStep } from './initiation-policy';
import { qiNarrativeNext, qiNarrativeActive } from "../src/qi-journey/narrative";
import {
  preparationReady,
  type PreparationRoute,
} from "../src/qi-journey/preparation";
import type { State, Intent } from "../src/core";
import { qiEnemy, qiPreview } from "../src/qi-journey/rules";
// Visible-information reference policy, used by public-command regression journeys.
export function qiJourneyStep(
  s: State,
  preferred: PreparationRoute = "wander",
): Intent | null {
  if(!s.pending){const practice=qiCultivationStep(s);if(practice)return practice;}
  const q = s.qiJourney;
  if (s.realm || q.gates >= 2) return null;
  const send = (
    action: Extract<Intent, { type: "qiJourney" }>["action"],
  ): Intent => ({ type: "qiJourney", action });
  const narrative = qiNarrativeNext(s);
  if (narrative && qiNarrativeActive(s)) return send(narrative);
  if (q.duel) {
    const lethal = (["strike", "discern", "guard"] as const).find(
      (m) => qiPreview(s, m)!.damage >= q.duel!.enemy,
    );
    const e = qiEnemy(s)!;
    return send(lethal ?? e.pattern[q.duel.turn % e.pattern.length]!);
  }
  if (q.node === 2)
    return send(
      s.herbs >= 3 ? "herbs" : s.sense >= 8 && s.study >= 2 ? "sense" : "force",
    );
  const funds = (n: number): Intent | null =>
    s.stones < n ? { type: "advance", activity: "work", months: 6 } : null;
  if (q.essence) {
    if (s.herbs < 4) return funds(8) ?? { type: "supplies" };
    return funds(24) ?? send("refine");
  }
  if (s.qi < (q.gates ? 240 : 120))
    return { type: "advance", activity: "cultivate", months: 12 };
  if (q.gates === 1 && !["self", "gift"].includes(s.story.choice) && !s.crafted)
    return null;
  if (s.injury) return { type: "advance", activity: "rest", months: 3 };
  if (s.study < 2) return { type: "advance", activity: "study", months: 2 };
  if (s.sense < 8) return { type: "advance", activity: "meditate", months: 3 };
  const main = s.path === "sword" ? "blade" : "spring";
  if (!s.journey.known.includes(main))
    return funds(20) ?? { type: "learn", technique: main };
  if (s.journey.main !== main) return { type: "equip", technique: main };
  if (s.herbs < 14) return funds(8) ?? { type: "supplies" };
  if (!s.growth.training[main])
    return funds(12) ?? { type: "trainTechnique", technique: main };
  const relic = s.path === "sword" ? "sword" : "vial";
  if (!s.journey.relics[relic]) return funds(24) ?? { type: "forge", relic };
  if (s.journey.equipped !== relic) return { type: "equipRelic", relic };
  if (q.gates === 1 && !s.journey.known.includes("guard"))
    return funds(20) ?? { type: "learn", technique: "guard" };
  if (q.gates === 1 && !s.growth.training.guard)
    return funds(12) ?? { type: "trainTechnique", technique: "guard" };
  if (q.gates === 1 && s.journey.support !== "guard")
    return { type: "equip", technique: "guard" };
  if (s.foundation < (q.gates ? 24 : 18))
    return funds(8) ?? { type: "prepare", kind: "retreat" };
  if (s.path === "sword" && s.mastery < 4)
    return { type: "advance", activity: "train", months: 4 };
  if(preferred === 'sect' && s.journey.branch === 'none') {
    const admission=admissionStep(s); if(admission)return admission;
    // Earn the first recommendation outside the sect; membership cannot unlock itself.
    preferred='wander';
  }
  if (!preparationReady(s) || (preferred === 'sect' && q.preparations[q.gates]!.sect < 3)) {
    const progress = q.preparations[q.gates]![preferred];
    if (preferred === "medicine" && !q.people.scout)
      return send("person:scout");
    if (preferred === "sect") {

      if (progress === 0 && s.journey.contribution < 2)
        return { type: "duty", duty: "herbs" };
    }
    if (progress === 0) return funds(6) ?? send(`prep:${preferred}:prepare`);
    if (progress === 1) return send(`prep:${preferred}:careful`);
    return send(`prep:${preferred}:trial`);
  }
  if (narrative) return send(narrative);
  return (
    funds(q.gates ? 10 : 6) ??
    send(s.path === "sword" ? "enter:sword" : "enter:medicine")
  );
}
