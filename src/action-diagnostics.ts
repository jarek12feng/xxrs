import { quoteSettlement } from "./economy";
import { arenaError, arenaPrize } from "./social";
import { actionError, preparationError, type State, type Intent } from "./core";
import { activityInterruption } from "./scene-activity";
import { breakthroughError } from "./foundation";
import { qiError } from "./qi-journey/rules";
import { journeyActionError } from "./foundation-journey/progression";
import { goldenQuote } from "./golden-core/rules";
import { seaQuote } from "./outer-sea/rules";
import { conclaveQuote } from "./conclave/rules";
import { contestError } from "./sect-contest/rules";
import { treasureQuote } from "./treasures/rules";
import { pactQuote } from "./secret-pact/rules";
import { recognitionQuote } from "./recognition/rules";
import { expeditionError } from "./expedition/rules";
import { workshopQuote } from "./workshop/rules";
import { trainingError, medicineError } from "./growth";
import { studyError } from "./wayfaring/rules";
/** Explain a rejected command using existing domain quotes. Never execute or consume RNG. */
export function rejectedActionReason(s: State, intent: Intent): string {
  let error = "";
  switch (intent.type) {
    case "supplies":
      error = quoteSettlement(s, { stones: 8 }, { herbs: 4 }).error;
      break;
    case "arenaStart":
      error = arenaError(s);
      break;
    case "arenaTurn":
      error = s.social.arena.duel
        ? quoteSettlement(s, {}, arenaPrize(s, s.social.arena.duel.opponent))
            .error
        : "当前没有擂台交锋";
      break;
    case "advance":
      error = activityInterruption(s) || actionError(s, intent.activity);
      break;
    case "prepare":
      error =
        activityInterruption(s) ||
        (intent.kind === "refine"
          ? workshopQuote(s, { product: "foundation", method: "craft" }).error
          : preparationError(s, intent.kind));
      break;
    case "break":
      error =
        activityInterruption(s) ||
        (s.qiJourney.gates < 2
          ? "先完成淬脉与凝元历练，再准备筑基"
          : breakthroughError(s));
      break;
    case "qiJourney":
      error = qiError(s, intent.action);
      break;
    case "foundationJourney":
      error = journeyActionError(s, intent.action);
      break;
    case "goldenCore":
      error = goldenQuote(s, intent.action).error;
      break;
    case "outerSea":
      error = seaQuote(s, intent.action).error;
      break;
    case "conclave":
      error = conclaveQuote(s, intent.action).error;
      break;
    case "sectContest":
      error = contestError(s, intent.action);
      break;
    case "equipRelic":
      error = treasureQuote(s, {kind: "deploy", item: intent.relic}).error;
      break;
    case "treasure":
      error = treasureQuote(s, intent.action).error;
      break;
    case "secretPact":
      error = pactQuote(s, intent.action).error;
      break;
    case "recognition":
      error = recognitionQuote(s, intent.action).error;
      break;
    case "expedition":
      error = expeditionError(s, intent.action);
      break;
    case "workshop":
      error = workshopQuote(s, intent.order).error;
      break;
    case "forge":
      error = workshopQuote(s, {
        product: intent.relic,
        method: "craft",
      }).error;
      break;
    case "brew":
      error = workshopQuote(s, {
        product: intent.medicine,
        method: "craft",
      }).error;
      break;
    case "consume":
      error = medicineError(s, intent.medicine, true);
      break;
    case "trainTechnique":
      error = trainingError(s, intent.technique);
      break;
    case "wayfaring":
      error =
        intent.action.kind === "study"
          ? studyError(s)
          : "当前没有可以取消的行程";
      break;
    case "queueTick": {
      const task = s.journey.queue[0];
      error =
        activityInterruption(s) ||
        (!task
          ? "修行安排已完成"
          : task.action === "refine"
            ? workshopQuote(s, { product: "foundation", method: "craft" }).error
            : actionError(s, task.action));
      break;
    }
  }
  return (
    error ||
    activityInterruption(s) ||
    "此行动的条件或现场选项已变化，请重新查看当前目标与选项"
  );
}
