import { expect, it } from "vitest";
import { lizhaoCheckpoint } from "../tools/lizhao-checkpoint";
import { dispatch, type State } from "../src/core";
let serial = 0;
function act(s: State, action: import("../src/lizhao/rules").LizhaoAction) {
  return dispatch(s, { type: "lizhao", action, id: `tactics-${++serial}` });
}
it("连续辨影不能同时排尽潮毒并打通两层", () => {
  let s = lizhaoCheckpoint("spring");
  for (const action of [
    { kind: "visit" },
    { kind: "route", route: "cooperate" },
    { kind: "prepare", preparation: "purify" },
    { kind: "enter" },
    { kind: "fight" },
  ] as const)
    s = act(s, action);
  while (s.lizhao.duel) s = act(s, { kind: "move", move: "discern" });
  expect(s.lizhao.outerCleared).toBe(false);
}, 60000);

import { auditLizhaoTactics } from "../tools/lizhao-tactics-audit";
import { lizhaoExchange, lizhaoWindow, lizhaoTell } from "../src/lizhao/combat";
import { validState, migrateSave } from "../src/core";
it("公共命令72组对照：观察与两条不同策略可达，固定招式均不能包办两层", () => {
  const report = auditLizhaoTactics();
  expect(report.rows).toHaveLength(72);
  for (const row of report.rows) {
    expect(
      row.won,
      `${row.main}/${row.route}/${row.preparation}/${row.policy}`,
    ).toBe(["observed", "probe", "counter"].includes(row.policy));
    if (!row.won) {
      expect(row.reagent).toBe(0);
      expect(row.injury).toBe(2);
    }
  }
  for (const a of report.rows.filter((r) => r.policy === "probe")) {
    const b = report.rows.find(
      (r) =>
        r.main === a.main &&
        r.route === a.route &&
        r.preparation === a.preparation &&
        r.policy === "counter",
    )!;
    expect(a.layers[0]!.turns.map((t) => t.move)).not.toEqual(
      b.layers[0]!.turns.map((t) => t.move),
    );
    expect(
      a.layers.flatMap((l) => l.turns).some((t) => t.move === "discern"),
    ).toBe(true);
    expect(
      b.layers.flatMap((l) => l.turns).some((t) => t.move === "guard"),
    ).toBe(true);
  }
}, 60000);
it("开口提示、报价与结算一致；撤退、积毒败退、回港治伤不锁材料", () => {
  let s = lizhaoCheckpoint("blade");
  for (const action of [
    { kind: "visit" },
    { kind: "route", route: "independent" },
    { kind: "prepare", preparation: "ward" },
    { kind: "enter" },
    { kind: "fight" },
  ] as const)
    s = act(s, action);
  const before = JSON.stringify(s),
    p = lizhaoExchange(s, "discern")!;
  expect(JSON.stringify(s)).toBe(before);
  const hp = s.lizhao.duel!.hp,
    enemy = s.lizhao.duel!.enemy;
  s = act(s, { kind: "move", move: "discern" });
  expect(s.lizhao.duel!.hp).toBe(hp - p.incoming + p.healing);
  expect(s.lizhao.duel!.enemy).toBe(enemy - p.damage);
  expect(s.lizhao.duel!.toxin).toBe(p.toxin);
  expect(lizhaoWindow(s)?.source).toBe("probe");
  expect(lizhaoTell(s)).toContain("上一合辨出");
  const restored = migrateSave(JSON.parse(JSON.stringify(s)));
  expect(restored).toEqual(s);
  const strike = lizhaoExchange(s, "strike")!,
    repeat = lizhaoExchange(s, "discern")!;
  expect(strike.damage).toBeGreaterThan(repeat.damage * 3);
  s = act(s, { kind: "withdraw" });
  expect(s.injury).toBe(0);
  expect(s.lizhao.location).toBe("harbor");
  s = act(s, { kind: "enter" });
  s = act(s, { kind: "fight" });
  while (s.lizhao.duel) s = act(s, { kind: "move", move: "strike" });
  expect(s.injury).toBe(2);
  expect(s.lizhao.reagent).toBe(0);
  expect(s.lizhao.recovery).toBe(true);
  s = act(s, { kind: "recover" });
  expect(s.injury).toBe(0);
  expect(s.lizhao.recovery).toBe(false);
  s = act(s, { kind: "enter" });
  s = act(s, { kind: "fight" });
  expect(s.lizhao.duel).toBeTruthy();
  expect(validState(s)).toBe(true);
}, 60000);
