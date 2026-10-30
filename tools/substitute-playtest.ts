import { cultivationProjection } from "../src/cultivation";
import {
  createGame,
  dispatch,
  validState,
  type Intent,
  type State,
  type Aptitude,
} from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import { foundationExchange } from "../src/foundation-journey/combat";
import { foundationGoal } from "../src/foundation-journey/progression";
import { challenges } from "../src/foundation-journey/content";
import type { BattleId, JourneyAction } from "../src/foundation-journey/state";
import type { Move } from "../src/expedition/content";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { writeFileSync, realpathSync } from "node:fs";

type Profile = "mainline" | "explorer" | "mistakes";
export function runRoute(
  seed: number,
  technique: "spring" | "blade" | "breath",
  profile: Profile,
  aptitude: Aptitude = "insightful",
  policy: "preview" | "cue" | "combo" = "preview",
) {
  let s = createGame(
      "替代验证",
      technique === "blade" ? "sword" : "wood",
      seed,
      aptitude,
    ),
    serial = 0;
  let phase = "opening";
  const trace: {
    phase: string;
    command: Intent;
    month: number;
    realm: number;
    age: number;
    remainingLife: number;
    cultivation: number;
    months: number;
    stones: number;
    herbs: number;
    goal: string;
  }[] = [];
  const battles: {
    id: BattleId;
    attempt: number;
    won: boolean;
    moves: Move[];
    starting: unknown;
    ending: unknown;
  }[] = [];
  const send = (command: Intent) => {
    if (++serial > 700) throw Error("700-command bound");
    const before = s;
    s = dispatch(s, { ...command, id: `substitute-${serial}` });
    if (s === before || !validState(s))
      throw Error(
        `Rejected/invalid ${JSON.stringify(command)}; ${s.foundationJourney.last}`,
      );
    if (s.stones < 0 || s.herbs < 0 || s.status !== "alive")
      throw Error("Resource/life invariant");
    trace.push({
      phase,
      command,
      month: s.month,
      realm: s.realm,
      age: s.age,
      remainingLife: s.limit - s.age,
      cultivation: s.foundationJourney.cultivation,
      months: s.month - before.month,
      stones: s.stones - before.stones,
      herbs: s.herbs - before.herbs,
      goal: s.realm ? foundationGoal(s) : "",
    });
    // Reconstruct through plain JSON after each command to exercise resumability, not an old-save migration.
    s = JSON.parse(JSON.stringify(s));
    if (!validState(s)) throw Error("Round-trip invalid");
  };
  const act = (action: JourneyAction) =>
    send({ type: "foundationJourney", action });
  const funds = (n: number) => {
    while (s.stones < n) send({ type: "advance", activity: "work", months: 3 });
  };
  const herbs = (n: number) => {
    while (s.herbs < n) {
      funds(8);
      send({ type: "supplies" });
    }
  };
  const rest = () => {
    while (s.injury)
      send({ type: "advance", activity: "rest", months: s.injury });
  };
  const cultivate = (n: number) => {
    while (s.foundationJourney.cultivation < n)
      send({
        type: "advance",
        activity: "cultivate",
        months: cultivationProjection(s, n).batchMonths,
      });
  };
  const preparation = (level: number) => {
    rest();
    while (s.study < 2) send({ type: "advance", activity: "study", months: 1 });
    for (const t of [technique, "guard"] as const) {
      if (!s.journey.known.includes(t)) {
        funds(20);
        send({ type: "learn", technique: t });
      }
      send({ type: "equip", technique: t });
    }
    while (s.growth.training[technique] < level) {
      herbs(2);
      funds(12);
      send({ type: "trainTechnique", technique });
    }
    const relic = technique === "blade" ? "sword" : "vial";
    if (!s.journey.relics[relic]) {
      herbs(4);
      funds(24);
      send({ type: "forge", relic });
    }
    send({ type: "equipRelic", relic });
  };
  const fight = (id: BattleId) => {
    cultivate(challenges[id].cultivation);
    for (let attempt = 0; attempt < 4; attempt++) {
      rest();
      funds(4);
      if (profile !== "mistakes" || attempt > 0) herbs(6);
      if (attempt === 1) preparation(2);
      if (attempt === 2) {
        while (s.foundation < 24) {
          funds(8);
          send({ type: "prepare", kind: "retreat" });
        }
        herbs(8);
      }
      if (attempt === 3) {
        const relic = technique === "blade" ? "sword" : "vial";
        while (s.journey.relics[relic] < 2) {
          herbs(4);
          funds(24);
          send({ type: "forge", relic });
        }
        while (s.growth.training.guard < 2) {
          herbs(2);
          funds(12);
          send({ type: "trainTechnique", technique: "guard" });
        }
        while (s.sense < 12)
          send({ type: "advance", activity: "meditate", months: 1 });
        cultivate(Math.min(600, challenges[id].cultivation + 120));
      }
      funds(4);
      act({ kind: "battle", battle: id });
      const d = s.foundationJourney.duel;
      if (!d) throw Error(`Battle did not start ${id}`);
      const starting = {
        hp: d.hp,
        herbs: s.herbs,
        foundation: s.foundation,
        cultivation: s.foundationJourney.cultivation,
        training: s.growth.training[technique],
      };
      const moves: Move[] = [];
      while (s.foundationJourney.duel) {
        const options = (["guard", "strike", "discern"] as const).map(
          (move) => ({ move, p: foundationExchange(s, move)! }),
        );
        // Only current visible damage/incoming/healing; never simulate future turns or read enemy patterns.
        const best = options.sort(
          (a, b) =>
            b.p.damage -
            b.p.incoming +
            b.p.healing -
            (a.p.damage - a.p.incoming + a.p.healing),
        )[0]!;
        let chosen =
          policy === "cue" ? options.find((o) => o.p.correct)! : best;
        if (policy === "combo") {
          const d = s.foundationJourney.duel!;
          const m: Move =
            id === "rescue"
              ? d.effect === "guard"
                ? "discern"
                : "guard"
              : id === "exit" || id === "frontier"
                ? d.effect === "discern"
                  ? "strike"
                  : "discern"
                : challenges[id].array
                  ? d.effect === "guard"
                    ? "strike"
                    : "guard"
                  : best.move;
          chosen = options.find((o) => o.move === m)!;
          const lethal = options.find((o) => o.p.damage >= d.enemy);
          if (lethal) chosen = lethal;
        }
        const move =
          profile === "mistakes" && attempt === 0 && moves.length === 1
            ? options[options.length - 1]!.move
            : chosen.move;
        moves.push(move);
        act({ kind: "move", move });
      }
      const won = s.foundationJourney.won.includes(id);
      battles.push({
        id,
        attempt,
        won,
        moves,
        starting,
        ending: {
          herbs: s.herbs,
          injury: s.injury,
          cultivation: s.foundationJourney.cultivation,
        },
      });
      if (won) return;
    }
    throw Error(`Four attempts exhausted ${id}`);
  };
  try {
    for (const action of [
      "inspect",
      "depart",
      "medicine",
      "prepare",
      "depart",
      "trail",
      "challenge",
      "takeHerbs",
    ] as const)
      send({ type: "adventure", action });
    send({
      type: "equip",
      technique: technique === "blade" ? "blade" : "spring",
    });
    for (const action of ["thanks", "market", "talk", "accept"] as const)
      send({ type: "road", action });
    herbs(4);
    send({ type: "road", action: "deliver" });
    for (const action of [
      "invite",
      "pass",
      "inspect",
      "camp",
      "friend",
    ] as const)
      send({ type: "road", action });
    phase = "foundation-breakthrough";
    while (!s.journey.settled) send(foundationStep(s, profile === "explorer"));
    phase = "old-pass";
    rest();
    while (s.study < 2) send({ type: "advance", activity: "study", months: 1 });
    while (s.sense < 8)
      send({ type: "advance", activity: "meditate", months: 1 });
    funds(8);
    send({ type: "road", action: "market" });
    send({ type: "road", action: "examineLedger" });
    send({ type: "road", action: "pass" });
    send({ type: "road", action: "examineMarks" });
    send({ type: "road", action: "traceArray" });
    send({ type: "road", action: "restorePass" });
    send({ type: "road", action: "lookout" });
    send({ type: "road", action: "survey" });
    phase = "initial-build";
    preparation(1);
    phase = "ferry";
    act({ kind: "travel", destination: "ferry" });
    fight("well");
    act({ kind: "inherit", technique });
    fight("exit");
    act({ kind: "ferryOutcome", outcome: "escort" });
    if (profile === "explorer") {
      phase = "optional";
      for (const side of ["estate", "snow", "inn"] as const) {
        act({ kind: "travel", destination: side });
        act({ kind: "sideInvestigate", side });
        if (side !== "inn") fight(side);
        act({
          kind: "sideResolve",
          side,
          outcome:
            side === "estate" ? "shared" : side === "snow" ? "repair" : "roof",
        });
        act({ kind: "revisit", side });
      }
    }
    phase = "frontier";
    cultivate(240);
    act({ kind: "travel", destination: "frontier" });
    act({ kind: "report" });
    act({ kind: "signal" });
    fight("frontier");
    act({ kind: "mentor" });
    fight("rescue");
    phase = "finale";
    cultivate(600);
    act({ kind: "finish" });
    fight("culmination");
    act({ kind: "travel", destination: "home" });
    act({ kind: "epilogue" });
  } catch (error) {
    return {
      seed,
      technique,
      profile,
      aptitude,
      policy,
      completed: false,
      error: String(error),
      phase,
      month: s.month,
      remainingLife: s.limit - s.age,
      commands: trace.length,
      battles,
      trace,
    };
  }
  let replay = createGame(
    "替代验证",
    technique === "blade" ? "sword" : "wood",
    seed,
    aptitude,
  );
  for (const [i, t] of trace.entries())
    replay = dispatch(replay, { ...t.command, id: `substitute-${i + 1}` });
  if (JSON.stringify(replay) !== JSON.stringify(s))
    throw Error("Deterministic replay mismatch");
  return {
    checksum: createHash("sha256").update(JSON.stringify(s)).digest("hex"),
    replayVerified: true,
    seed,
    technique,
    profile,
    aptitude,
    policy,
    completed: s.foundationJourney.epilogue,
    phase,
    month: s.month,
    remainingLife: s.limit - s.age,
    commands: trace.length,
    battles,
    trace,
  };
}
if (
  process.argv[1] &&
  process.argv.includes("--run-matrix") &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  const rows = [];
  for (const aptitude of ["insightful", "sturdy", "perceptive"] as const)
    for (const policy of ["preview", "cue", "combo"] as const)
      for (const seed of [42, 2654435761, 1013904226, 3668339987])
        for (const technique of ["spring", "blade", "breath"] as const)
          for (const profile of ["mainline", "explorer", "mistakes"] as const)
            rows.push(runRoute(seed, technique, profile, aptitude, policy));
  const output = {
    method:
      "Public commands from createGame; no checkpoints or state grants. Policies: preview maximizes current damage-incoming+healing; cue assumes perfect interpretation of the current correct response; combo repeats the advertised setup/follow-up with a visible lethal override. No future search. Mistakes chooses the worst immediate trade on turn two of first attempts and skips initial herb top-up. Recovery: rest/top-up, main training 2, foundation 24, then relic 2/support 2/sense 12 and up to 120 extra cultivation. Maximum four attempts per battle. Mainline and mistakes skip optional branches; explorer gifts the first pill and visits estate/snow/inn. All use the array pass route; no romance, rankings, escort expedition or mist branch coverage. Command counts and game months are not human time.",
    rows,
  };
  const destination =
    process.argv.slice(2).find((arg) => arg !== "--run-matrix") ??
    "/tmp/substitute-playtest.json.gz";
  writeFileSync(destination, gzipSync(JSON.stringify(output)));
  console.log(
    JSON.stringify(
      rows.map(({ trace, battles, ...r }) => ({
        ...r,
        losses: battles.filter((b) => !b.won).map((b) => b.id),
        phases: Object.fromEntries(
          [...new Set(trace.map((t) => t.phase))].map((p) => [
            p,
            trace.filter((t) => t.phase === p).length,
          ]),
        ),
      })),
      null,
      2,
    ),
  );
}
