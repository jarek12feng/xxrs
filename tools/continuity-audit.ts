/** Snapshot forecasts on command-earned routes; these are world months, never human play time. */
import { journeyCheckpoint } from "./foundation-journey-checkpoint";
import { estateRevisitCheckpoint } from "./world-revisits-checkpoint";
import { sealPreparationCheckpoint } from "./continuity-checkpoint";
import { conclaveCheckpoint } from "./conclave-checkpoint";
import { goldenLateCheckpoint } from "./golden-completion-checkpoint";
import { cultivationProjection, realmStageLabel } from "../src/progression";
import { retreatPlan } from "../src/retreat";
import { preparationOpportunities } from "../src/growth-continuity/preparation";
import { foundationGoal } from "../src/foundation-journey/progression";
import { conclaveGoal } from "../src/conclave/rules";
export function continuityAudit() {
  return [
    ["筑基初成", journeyCheckpoint()],
    ["药庄取材后", estateRevisitCheckpoint()],
    ["外府得印后", sealPreparationCheckpoint()],
    ["金丹中期", conclaveCheckpoint()],
    ["金丹后期", goldenLateCheckpoint()],
  ].map(([name, state]) => {
    const s = state as ReturnType<typeof journeyCheckpoint>;
    const f = cultivationProjection(s),
      r = retreatPlan(s);
    return {
      name,
      realm: realmStageLabel(s),
      month: s.month,
      current: f.current,
      target: f.target,
      monthsToTarget: f.monthsToTarget,
      regularBatch: r.batchMonths,
      gain: r.batchGain,
      stopsForMeeting: r.stopsForMeeting,
      knownPreparation: preparationOpportunities(s).map((r) => ({
        title: r.title,
        error: r.error,
      })),
      next: s.realm === 1 ? foundationGoal(s) : conclaveGoal(s),
    };
  });
}
