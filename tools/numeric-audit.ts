import {
  dispersedSeeds,
  recoveryRun,
  preparationBudget,
} from "./balance-scenarios";
// Read-only audit: bundle with esbuild --platform=node, then run the bundle.
// Progression uses only public commands. Arena matrices are synthetic controls.
import {
  createGame,
  dispatch,
  validState,
  breakthroughDetails,
  type State,
  type Intent,
  type Path,
  type Aptitude,
} from "../src/core";
import { foundationStep } from "./foundation-playthrough";
import { arenaFixture, winningRoutes } from "./growth-balance";
import { expeditionSession } from "./expedition-simulation";
import { encounters } from "../src/expedition/content";
import { exchangePreview } from "../src/expedition/combat";

function opening(seed: number, path: Path, aptitude: Aptitude) {
  let s = createGame("数值审查", path, seed, aptitude);
  let id = 0;
  const send = (c: Intent) => {
    const n = dispatch(s, { ...c, id: `audit-${id++}` });
    if (n === s) throw Error(`Rejected ${JSON.stringify(c)}`);
    if (!validState(n)) throw Error(`Invalid ${JSON.stringify(c)}`);
    s = n;
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
      return s;
    },
    send,
  };
}
function progression(
  seed: number,
  path: Path,
  aptitude: Aptitude,
  gift: boolean,
  target: number,
  investWhileWaiting = false,
) {
  const p = opening(seed, path, aptitude);
  const attempts: { month: number; chance: number; success: boolean }[] = [];
  let fullMonth: number | null = null;
  for (
    let i = 0;
    i < 180 && !p.state.realm && p.state.status === "alive";
    i++
  ) {
    const s = p.state;
    let c = foundationStep(s, gift);
    if (
      investWhileWaiting &&
      !s.pending &&
      s.story.stage === "waiting" &&
      s.qi >= 180 &&
      s.foundation < target &&
      s.month + 6 < 36 &&
      s.stones >= 8
    )
      c = { type: "prepare", kind: "retreat" };
    if (c.type === "break" && s.foundation < target)
      c = { type: "prepare", kind: "retreat" };
    if (investWhileWaiting && c.type === "advance" && s.month < 36)
      c = { ...c, months: 1 };
    const chance = c.type === "break" ? breakthroughDetails(s, true).chance : 0;
    p.send(c);
    if (fullMonth === null && p.state.qi === 360) fullMonth = p.state.month;
    if (c.type === "break")
      attempts.push({ month: s.month, chance, success: !!p.state.realm });
  }
  if (!p.state.realm) throw Error("Progression did not finish");
  return {
    seed,
    path,
    aptitude,
    gift,
    target,
    fullMonth,
    month: p.state.month,
    stones: p.state.stones,
    limit: p.state.limit,
    attempts,
  };
}
const progressionRows = [];
for (const path of ["wood", "sword"] as const)
  for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
    for (const gift of [false, true])
      for (const target of [0, 12, 24])
        for (let i = 1; i <= 128; i++)
          progressionRows.push(
            progression(
              Math.imul(i, 0x9e3779b1) >>> 0,
              path,
              aptitude,
              gift,
              target,
            ),
          );

const waitingInvestmentRows = [];
for (const path of ["wood", "sword"] as const)
  for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
    for (const gift of [false, true])
      waitingInvestmentRows.push(
        progression(0x9e3779b1, path, aptitude, gift, 12, true),
      );

const arenaRows = [];
for (const seed of [1, 42, 9087, 0x9e3779b1])
  for (const main of ["spring", "blade", "breath"] as const)
    for (const gear of ["sword", "vial"] as const)
      for (const tier of ["low", "normal", "full", "dry"] as const)
        for (const support of ["herb", "guard", "lantern"] as const) {
          const wins = winningRoutes(
            arenaFixture(main, seed, gear, support, tier, 2),
          );
          const sorted = [...wins].sort(
            (a, b) =>
              a.moves.length - b.moves.length ||
              a.herbs - b.herbs ||
              b.hp - a.hp,
          );
          arenaRows.push({
            seed,
            main,
            gear,
            tier,
            support,
            winningLeaves: wins.length,
            best: sorted[0] ?? null,
            constantWins: ["break", "endure", "discern"].filter((m) =>
              wins.some((w) => w.moves.every((x) => x === m)),
            ),
          });
        }

const expeditionRows = [];
for (const path of ["wood", "sword"] as const)
  for (const aptitude of ["sturdy", "insightful", "perceptive"] as const)
    for (const strategy of ["correct", "guard", "strike", "discern"] as const) {
      const p = expeditionSession(0x9e3779b1, path, aptitude);
      p.send({
        type: "equip",
        technique: path === "wood" ? "spring" : "blade",
      });
      p.send({ type: "expedition", action: "accept" });
      // Deliberately use the existing preparation policy; no manual stat edits.
      p.prepare();
      p.send({ type: "expedition", action: "enter" });
      p.fight();
      p.send({ type: "expedition", action: "studyArray" });
      p.send({ type: "equipRelic", relic: path === "wood" ? "vial" : "sword" });
      p.send({ type: "expedition", action: "enter" });
      const start = structuredClone(p.state);
      const exchanges = [];
      while (p.state.expedition.duel) {
        const d = p.state.expedition.duel;
        const move =
          strategy === "correct" ? encounters[2].pattern[d.turn % 4] : strategy;
        exchanges.push(exchangePreview(p.state, move));
        p.send({ type: "expedition", action: move });
      }
      expeditionRows.push({
        path,
        aptitude,
        strategy,
        month: start.month,
        foundation: start.foundation,
        sense: start.sense,
        study: start.study,
        training: start.growth.training,
        herbs: start.herbs,
        win: p.state.expedition.cleared === 3,
        turns: exchanges.length,
        exchanges,
      });
    }

const seedRolls = [1, 42, 9087].map((seed) => {
  let x = seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return {
    seed,
    firstRoll: Math.floor(((x >>> 0 || 1) / 4294967296) * 100) + 1,
  };
});
console.log(
  JSON.stringify(
    {
      methodology:
        "4608 public-command progression runs plus 12 waiting-investment counterchecks; 288 synthetic arena controls with exhaustive action branches (leaf counts are not win probabilities); 24 public-command expedition runs. 128 dispersed reproducible seeds per progression cell. Plus 512 public-command failure-recovery runs and 18 equal-deadline preparation comparisons. No player-time claims.",
      recoveryRows: ["wood", "sword"].flatMap((path) =>
        [false, true].flatMap((gift) =>
          dispersedSeeds.map((seed) => recoveryRun(seed, path as Path, gift)),
        ),
      ),
      preparationBudgetRows: (["wood", "sword"] as const).flatMap((path) =>
        (["sturdy", "insightful", "perceptive"] as const).flatMap((aptitude) =>
          (["wait", "foundation", "build"] as const).map((policy) =>
            preparationBudget(path, aptitude, policy),
          ),
        ),
      ),
      waitingInvestmentRows,
      seedRolls,
      progressionRows,
      arenaRows,
      expeditionRows,
    },
    null,
    2,
  ),
);
