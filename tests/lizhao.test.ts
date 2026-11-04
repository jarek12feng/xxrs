import { describe, it, expect } from "vitest";
import {
  lizhaoFixture,
  lizhaoTick,
  chooseLizhaoMove,
} from "../tools/lizhao-fixture";
import { runLizhao, lizhaoQuote, type LizhaoAction } from "../src/lizhao/rules";
import { validLizhao } from "../src/lizhao/state";
import { lizhaoExchange } from "../src/lizhao/combat";
import type { State } from "../src/core";
function player(initial = lizhaoFixture()) {
  let s = initial,
    serial = initial.seen.length;
  const act = (a: LizhaoAction) => {
    expect(lizhaoQuote(s, a).error, JSON.stringify(a)).toBe("");
    const before = s,
      id = `lizhao-${++serial}`;
    s = runLizhao(s, a, id, lizhaoTick);
    expect(s).not.toBe(before);
    expect(validLizhao(s), JSON.stringify(s.lizhao)).toBe(true);
    expect(runLizhao(before, a, id, lizhaoTick)).toEqual(s);
    expect(runLizhao(s, a, id, lizhaoTick)).toBe(s);
    s = JSON.parse(JSON.stringify(s));
  };
  const battle = () => {
    act({ kind: "fight" });
    let i = 0;
    while (s.lizhao.duel) {
      if (++i > 18) throw Error("stuck");
      act({ kind: "move", move: chooseLizhaoMove(s) });
    }
    return i;
  };
  return {
    get state() {
      return s;
    },
    act,
    battle,
  };
}
function clear(
  main: "spring" | "blade" | "breath" = "spring",
  route: "cooperate" | "independent" = "cooperate",
  preparation: "ward" | "purify" = "ward",
) {
  const p = player(lizhaoFixture(main));
  p.act({ kind: "visit" });
  p.act({ kind: "route", route });
  p.act({ kind: "prepare", preparation });
  p.act({ kind: "enter" });
  p.battle();
  expect(
    p.state.lizhao.outerCleared,
    JSON.stringify(p.state.log.slice(0, 12)),
  ).toBe(true);
  p.act({ kind: "deeper" });
  p.battle();
  expect(p.state.lizhao.cleared, JSON.stringify(p.state.log.slice(0, 12))).toBe(
    true,
  );
  p.act({ kind: "chamber" });
  p.act({ kind: "verify" });
  return p;
}
describe("离照实战、取药与有限追索", () => {
  for (const main of ["spring", "blade", "breath"] as const)
    for (const route of ["cooperate", "independent"] as const)
      for (const preparation of ["ward", "purify"] as const)
        it(`${main}/${route}/${preparation}两层实战及丹室验证`, () => {
          const p = clear(main, route, preparation);
          expect(p.state.lizhao.reagent).toBe(2);
          expect(p.state.lizhao.recipeVerified).toBe(true);
          expect(lizhaoQuote(p.state, { kind: "verify" }).error).toBeTruthy();
          p.act({
            kind: "allocate",
            allocation: route === "cooperate" ? "share" : "private",
          });
          p.act({ kind: "return" });
          expect(p.state.lizhao.pursuit).toBe("none");
          expect(lizhaoQuote(p.state, { kind: "rumor" }).error).toBeTruthy();
          p.act({ kind: "leave" });
          expect(p.state.lizhao.location).toBe("away");
        });
  it("首次挑战不可由购买与对白绕过，重入保留外层", () => {
    const p = player();
    p.act({ kind: "visit" });
    expect(lizhaoQuote(p.state, { kind: "resupply" }).error).toBeTruthy();
    expect(lizhaoQuote(p.state, { kind: "verify" }).error).toBeTruthy();
    p.act({ kind: "route", route: "independent" });
    p.act({ kind: "prepare", preparation: "purify" });
    p.act({ kind: "enter" });
    p.battle();
    p.act({ kind: "return" });
    p.act({ kind: "enter" });
    expect(p.state.lizhao.location).toBe("inner");
    expect(p.state.lizhao.reagent).toBe(0);
  });
  it("取药失败保留道路，治伤后重试且首通只结算一次", () => {
    const p = player();
    p.act({ kind: "visit" });
    p.act({ kind: "route", route: "independent" });
    p.act({ kind: "prepare", preparation: "ward" });
    p.act({ kind: "enter" });
    p.battle();
    p.act({ kind: "deeper" });
    p.act({ kind: "fight" });
    const weak = structuredClone(p.state);
    weak.lizhao.duel!.hp = 1;
    weak.lizhao.duel!.toxin = 90;
    const loss = runLizhao(
      weak,
      { kind: "move", move: "strike" },
      "loss",
      lizhaoTick,
    );
    expect(loss.lizhao.cleared).toBe(false);
    expect(loss.lizhao.outerCleared).toBe(true);
    expect(loss.lizhao.location).toBe("harbor");
    expect(loss.injury).toBe(2);
    expect(loss.lizhao.recovery).toBe(true);
    const q = player(loss);
    q.act({ kind: "recover" });
    q.act({ kind: "enter" });
    q.battle();
    expect(q.state.lizhao.reagent).toBe(2);
    expect(lizhaoQuote(q.state, { kind: "fight" }).error).toBeTruthy();
  });
  it("炼丹耗尽后有成本补取，低资金不能变成负数", () => {
    const p = clear();
    p.act({ kind: "return" });
    const spent = structuredClone(p.state);
    spent.lizhao.reagent = 0;
    expect(validLizhao(spent)).toBe(true);
    const q = player(spent),
      before = structuredClone(q.state);
    q.act({ kind: "resupply" });
    expect(q.state.lizhao.reagent).toBe(1);
    expect(q.state.stones).toBe(before.stones - 24);
    expect(q.state.herbs).toBe(before.herbs - 4);
    expect(q.state.month).toBe(before.month + 6);
    const poor = structuredClone(spent);
    poor.stones = 0;
    expect(runLizhao(poor, { kind: "resupply" }, "poor", lizhaoTick)).toBe(
      poor,
    );
  });
  for (const end of ["bypass", "negotiate", "expose", "spare", "kill"] as const)
    it(`争议先获知风险，再自主处理：${end}`, () => {
      const p = clear();
      p.act({ kind: "allocate", allocation: "seize" });
      expect(p.state.lizhao.reagent).toBe(3);
      p.act({ kind: "return" });
      expect(
        lizhaoQuote(p.state, { kind: "respond", response: "ambush" }).error,
      ).toBeTruthy();
      p.act({ kind: "rumor" });
      if (end === "bypass") p.act({ kind: end });
      else {
        p.act({
          kind: "respond",
          response: end === "kill" ? "ambush" : "company",
        });
        if (end !== "negotiate") {
          p.battle();
          expect(p.state.lizhao.pursuit).toBe("defeated");
        }
        p.act({ kind: end });
      }
      expect(p.state.lizhao.location).toBe("harbor");
      expect(p.state.lizhao.reagent).toBe(3);
      expect(lizhaoQuote(p.state, { kind: "rumor" }).error).toBeTruthy();
      expect(
        lizhaoQuote(p.state, { kind: "respond", response: "ambush" }).error,
      ).toBeTruthy();
      p.act({ kind: "resupply" });
      expect(p.state.lizhao.reagent).toBe(4);
    });
  it("伏潮湾败退不夺唯一物品，能够重新选择绕行", () => {
    const p = clear();
    p.act({ kind: "allocate", allocation: "seize" });
    p.act({ kind: "return" });
    p.act({ kind: "rumor" });
    p.act({ kind: "respond", response: "ambush" });
    p.act({ kind: "fight" });
    const weak = structuredClone(p.state);
    weak.lizhao.duel!.hp = 1;
    weak.lizhao.duel!.turn = 17;
    const loss = runLizhao(
      weak,
      { kind: "move", move: "guard" },
      "loss",
      lizhaoTick,
    );
    expect(loss.lizhao.pursuit).toBe("warned");
    expect(loss.lizhao.reagent).toBe(3);
    expect(validLizhao(loss)).toBe(true);
    const q = player(loss);
    q.act({ kind: "recover" });
    q.act({ kind: "bypass" });
    expect(q.state.lizhao.pursuit).toBe("bypassed");
  });
  it("来势与预览只读，不消费种子；非法状态被拒绝", () => {
    const p = player();
    p.act({ kind: "visit" });
    p.act({ kind: "route", route: "cooperate" });
    p.act({ kind: "prepare", preparation: "purify" });
    p.act({ kind: "enter" });
    p.act({ kind: "fight" });
    const before = JSON.stringify(p.state);
    lizhaoExchange(p.state, "guard");
    expect(JSON.stringify(p.state)).toBe(before);
    for (const patch of [
      { reagent: -1 },
      { cleared: true, outerCleared: false },
      { pursuit: "killed" },
      { recipeVerified: true },
      { location: "chamber" },
    ]) {
      const bad = structuredClone(p.state);
      Object.assign(bad.lizhao, patch);
      expect(validLizhao(bad)).toBe(false);
    }
  });
  it("旅行事件中断保留余程，重入仅结算剩余月份", () => {
    const s = lizhaoFixture();
    let ticks = 0;
    const interrupted = runLizhao(s, { kind: "visit" }, "out", (n) => {
      const next = lizhaoTick(n);
      if (++ticks === 2) next.pending = { id: "test" } as State["pending"];
      return next;
    });
    expect(interrupted.lizhao.location).toBe("away");
    expect(interrupted.wayfaring.passage?.remaining).toBe(4);
    interrupted.pending = null;
    const arrived = runLizhao(
      interrupted,
      { kind: "visit" },
      "resume",
      lizhaoTick,
    );
    expect(arrived.month - s.month).toBe(6);
    expect(arrived.lizhao.location).toBe("harbor");
    expect(arrived.wayfaring.passage).toBeNull();
  });
});

it("圆满试炼和凝婴期间不能通过领域入口绕过占用", () => {
  for (const phase of ["trial", "attempt"] as const) {
    const s = lizhaoFixture();
    if (phase === "trial")
      s.nascentSoul.trial = { turn: 0, body: 12, mind: 12, power: 8, seals: 0 };
    else s.nascentSoul.attempt = { phase: 0, flow: 4, spirit: 4, stability: 6 };
    expect(lizhaoQuote(s, { kind: "visit" }).error).toContain("先处理");
    expect(runLizhao(s, { kind: "visit" }, phase, lizhaoTick)).toBe(s);
  }
});
it("缺失战斗字段与过量库存不能作为有效领域存档", () => {
  const s = lizhaoFixture();
  delete (s.lizhao as Partial<typeof s.lizhao>).duel;
  expect(validLizhao(s)).toBe(false);
  s.lizhao.duel = null;
  s.lizhao.reagent = 21;
  expect(validLizhao(s)).toBe(false);
});
