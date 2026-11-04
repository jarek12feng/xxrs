/** Public-command contrast. Never reads player storage; old review evidence is immutable. */
import { writeFileSync } from "node:fs";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import {
  goldenLateCheckpoint,
  goldenCompletionPlayer,
} from "./golden-completion-checkpoint";
import { lizhaoQuote, type LizhaoAction } from "../src/lizhao/rules";
import { lizhaoExchange, lizhaoWindow } from "../src/lizhao/combat";
import { chooseLizhaoMove } from "./lizhao-fixture";
import type { Move } from "../src/combat";
export type LizhaoPolicy = "observed" | "probe" | "counter" | Move;
export function tacticalMove(s: State, style: LizhaoPolicy): Move {
  if (style === "observed") return chooseLizhaoMove(s);
  if (style === "guard" || style === "strike" || style === "discern")
    return style;
  const w = lizhaoWindow(s)!;
  if (
    lizhaoExchange(s, "strike")!.toxin >= 90 ||
    (style === "counter" && s.lizhao.duel!.toxin >= 45)
  )
    return "discern";
  if (w.opening) return "strike";
  return style === "probe" ? "discern" : "guard";
}
export function auditLizhaoTactics() {
  let serial = 0;
  const act = (s: State, action: LizhaoAction) => {
    const q = lizhaoQuote(s, action);
    if (q.error) throw Error(q.error);
    const c = { type: "lizhao" as const, action, id: `lz-tactics-${++serial}` };
    const n = dispatch(s, c);
    if (n === s || !validState(n))
      throw Error(`Rejected/invalid ${JSON.stringify(c)}`);
    if (
      JSON.stringify(migrateSave(JSON.parse(JSON.stringify(n)))) !==
      JSON.stringify(n)
    )
      throw Error("Save mismatch");
    return n;
  };
  const rows = [];
  for (const main of ["spring", "blade", "breath"] as const) {
    const p = goldenCompletionPlayer(goldenLateCheckpoint(main));
    p.rest();
    p.work(180);
    p.herbs(32);
    for (const route of ["cooperate", "independent"] as const)
      for (const preparation of ["ward", "purify"] as const)
        for (const policy of [
          "observed",
          "probe",
          "counter",
          "strike",
          "guard",
          "discern",
        ] as const) {
          let s = p.state;
          s = act(s, { kind: "visit" });
          s = act(s, { kind: "route", route });
          s = act(s, { kind: "prepare", preparation });
          s = act(s, { kind: "enter" });
          const layers = [];
          for (const layer of ["outer", "inner"] as const) {
            if (layer === "inner") {
              if (!s.lizhao.outerCleared) break;
              s = act(s, { kind: "deeper" });
            }
            s = act(s, { kind: "fight" });
            const initial = {
                hp: s.lizhao.duel!.hp,
                enemy: s.lizhao.duel!.enemy,
              },
              turns = [];
            while (s.lizhao.duel) {
              const move = tacticalMove(s, policy),
                q = lizhaoExchange(s, move)!,
                before = s.lizhao.duel;
              s = act(s, { kind: "move", move });
              turns.push({
                move,
                window: lizhaoWindow({
                  ...s,
                  lizhao: { ...s.lizhao, duel: before },
                })?.source,
                hp: before.hp,
                enemy: before.enemy,
                damage: q.damage,
                incoming: q.incoming,
                healing: q.healing,
                herbs: q.herbs,
                toxin: q.toxin,
              });
            }
            layers.push({
              layer,
              initial,
              won: layer === "outer" ? s.lizhao.outerCleared : s.lizhao.cleared,
              remainingHp: Math.max(
                0,
                turns.at(-1)!.hp -
                  turns.at(-1)!.incoming +
                  turns.at(-1)!.healing,
              ),
              turns,
            });
          }
          rows.push({
            main,
            route,
            preparation,
            policy,
            won: s.lizhao.cleared,
            injury: s.injury,
            reagent: s.lizhao.reagent,
            layers,
          });
        }
  }
  return {
    method:
      "Public dispatch from goldenLateCheckpoint; fixed seeds, not player win rates. No user saves.",
    rows,
  };
}
if (process.argv.includes("--write")) {
  const report = auditLizhaoTactics();
  writeFileSync(
    "docs/golden-completion/lizhao/tactics-after.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      Object.fromEntries(
        ["observed", "probe", "counter", "strike", "guard", "discern"].map(
          (policy) => [
            policy,
            {
              wins: report.rows.filter((r) => r.policy === policy && r.won)
                .length,
              total: 12,
            },
          ],
        ),
      ),
    ),
  );
  console.log(
    JSON.stringify(
      report.rows
        .filter(
          (r) => ["observed", "probe", "counter"].includes(r.policy) && !r.won,
        )
        .map((r) => ({
          main: r.main,
          route: r.route,
          prep: r.preparation,
          policy: r.policy,
          last: r.layers.at(-1),
        })),
    ),
  );
}
