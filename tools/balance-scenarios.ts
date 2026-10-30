import {
  createGame,
  dispatch,
  validState,
  breakthroughDetails,
  refineCost,
  type Intent,
  type Path,
  type Aptitude,
} from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import { readiness } from "../src/expedition/combat";
export const dispersedSeeds = Array.from(
  { length: 128 },
  (_, i) => Math.imul(i + 1, 0x9e3779b1) >>> 0,
);
export function balanceOpening(
  seed: number,
  path: Path,
  aptitude: Aptitude = "insightful",
) {
  let state = createGame("数值复核", path, seed, aptitude),
    id = 0;
  const send = (intent: Intent) => {
    const next = dispatch(state, { ...intent, id: `balance-${id++}` });
    if (next === state || !validState(next))
      throw Error(`Invalid/rejected ${JSON.stringify(intent)}`);
    state = next;
  };
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
    "challenge",
    "return",
  ] as const)
    send({ type: "adventure", action });
  send({ type: "equip", technique: path === "wood" ? "spring" : "blade" });
  return {
    get state() {
      return state;
    },
    send,
  };
}
export function recoveryRun(seed: number, path: Path, gift = false) {
  const p = balanceOpening(seed, path);
  const attempts = [];
  const commands: Intent[] = [];
  let shortages = 0;
  for (let i = 0; i < 240 && !p.state.realm; i++) {
    const s = p.state;
    const c = foundationStep(s, gift);
    if (
      !s.pills &&
      s.story.stage === "resolved" &&
      s.herbs < refineCost(s).herbs
    )
      shortages++;
    const before = {
      month: s.month,
      qi: s.qi,
      limit: s.limit,
      ward: s.ward,
      pills: s.pills,
      chance: breakthroughDetails(s, true).chance,
    };
    commands.push(c);
    p.send(c);
    if (c.type === "break")
      attempts.push({
        before,
        after: {
          month: p.state.month,
          qi: p.state.qi,
          limit: p.state.limit,
          ward: p.state.ward,
          pills: p.state.pills,
          injury: p.state.injury,
        },
        success: !!p.state.realm,
      });
  }
  if (!p.state.realm) throw Error("Recovery did not finish");
  return {
    seed,
    path,
    gift,
    shortages,
    attempts,
    commands,
    month: p.state.month,
  };
}
// Equal starting inventory, equal month-35 deadline, no grants or edited state.
// Each policy may spend at most 16 stones on retreats and 12 stones + 2 herbs on main training.
export function preparationBudget(
  path: Path,
  aptitude: Aptitude,
  policy: "wait" | "foundation" | "build",
) {
  const p = balanceOpening(0x9e3779b1, path, aptitude);
  let retreatStones = 0,
    trainingStones = 0,
    trainingHerbs = 0;
  const commands: Intent[] = [];
  for (let i = 0; p.state.month < 35 && i < 100; i++) {
    const s = p.state;
    let c: Intent;
    if (s.pending) c = foundationStep(s, false);
    else if (s.injury) c = { type: "advance", activity: "rest", months: 1 };
    else if (
      policy !== "wait" &&
      s.qi >= 180 &&
      s.foundation < 12 &&
      s.month + 6 <= 35
    ) {
      c = { type: "prepare", kind: "retreat" };
      retreatStones += 8;
    } else if (policy === "build" && s.qi >= 180 && s.study < 2)
      c = { type: "advance", activity: "study", months: 1 };
    else if (
      policy === "build" &&
      s.study >= 2 &&
      s.growth.training[s.journey.main!] === 0 &&
      s.herbs >= 2 &&
      s.stones >= 12
    ) {
      c = { type: "trainTechnique", technique: s.journey.main! };
      trainingStones += 12;
      trainingHerbs += 2;
    } else if (
      policy === "build" &&
      path === "sword" &&
      s.qi >= 180 &&
      s.mastery < 12 &&
      s.month < 34
    )
      c = { type: "advance", activity: "train", months: 1 };
    else
      c = {
        type: "advance",
        activity: s.qi < 360 ? "cultivate" : "work",
        months: 1,
      };
    commands.push(c);
    p.send(c);
  }
  const s = p.state;
  return {
    path,
    aptitude,
    policy,
    month: s.month,
    qi: s.qi,
    foundation: s.foundation,
    mastery: s.mastery,
    injury: s.injury,
    stones: s.stones,
    herbs: s.herbs,
    training: s.growth.training,
    retreatStones,
    trainingStones,
    trainingHerbs,
    readiness: readiness(s),
    projectedPillChance: breakthroughDetails(s, true).chance,
    commands,
  };
}
