import { legacyEquipment } from "./legacy-equipment";
import { describe, it, expect } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  createGame,
  type State,
} from "../src/core";
import {
  condensationCheckpoint,
  goldenPlayer,
} from "../tools/golden-core-checkpoint";
import {
  goldenQuote,
  goldenChance,
  goldenExchange,
  type GoldenAction,
} from "../src/golden-core/rules";
import { contestCheckpoint } from "../tools/sect-contest-checkpoint";
import type { ContestAction } from "../src/sect-contest/rules";
import { contestFoes } from "../src/sect-contest/content";
const act = (
  s: State,
  action: GoldenAction,
  id = `gold-${s.month}-${s.seen.length}`,
) => dispatch(s, { id, type: "goldenCore", action });
function funded(s: State) {
  // Only resource-boundary tests use synthetic funds; route audit records real earnings separately.
  s.stones += 200;
  s.herbs += 40;
  s.workshop.ward += 4;
  return s;
}
function gather(s: State, route: "share" | "alone" = "share") {
  const p = goldenPlayer(s);
  p.act({ kind: "prepare" });
  p.act({ kind: "route", route });
  p.act({ kind: "fight" });
  for (let i = 0; i < 16 && p.state.goldenCore.duel; i++) {
    const moves = ["guard", "discern", "strike"] as const;
    // Choose from actual public previews; prioritize surviving before damage.
    const d = p.state.goldenCore.duel!;
    const sorted = moves
      .map((move) => ({ move, p: goldenExchange(p.state, move)! }))
      .sort(
        (a, b) =>
          (b.p.damage >= d.enemy ? 10000 : 0) +
          (b.p.damage - b.p.incoming + b.p.healing) -
          (a.p.damage >= d.enemy ? 10000 : 0) -
          (a.p.damage - a.p.incoming + a.p.healing),
      );
    p.act({ kind: "move", move: sorted[0]!.move });
  }
  expect(p.state.goldenCore.expedition).toBe("won");
  p.act({ kind: "take" });
  return p.state;
}
describe("凝丹双路与突破", () => {
  it.each(["spring", "blade", "breath"] as const)(
    "%s 散修取药、炼丹、凝丹、能力兑现与存读档",
    (main) => {
      let s = funded(condensationCheckpoint(main));
      expect(s.journey.branch).toBe("none");
      s = gather(s);
      expect(s.goldenCore.medicine).toBe(1);
      s = act(s, { kind: "brew", method: "self" });
      s = act(s, { kind: "site", site: "rented" });
      s = act(s, { kind: "guard" });
      const c = {
        id: "golden-break",
        type: "goldenCore",
        action: { kind: "break" },
      } as const;
      const old = structuredClone(s);
      expect(goldenChance(s)).toBe(100);
      s = dispatch(s, c);
      expect(s).toEqual(dispatch(old, c));
      expect(s.realm).toBe(2);
      expect(s.limit - old.limit).toBe(3600);
      expect(s.age - old.age).toBe(6);
      expect(validState(s)).toBe(true);
      s = migrateSave(JSON.parse(JSON.stringify(s)));
      expect(dispatch(s, c)).toBe(s);
      const before = s;
      s = act(s, { kind: "farShore" });
      expect(s.goldenCore.farShore).toBe(true);
      expect(s.stones - before.stones).toBe(24);
      expect(act(s, { kind: "farShore" }, "repeat")).toBe(s);
      expect(validState(s)).toBe(true);
      expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
      const rested = dispatch(s, {
        id: "golden-work",
        type: "advance",
        activity: "work",
        months: 1,
      });
      expect(validState(rested)).toBe(true);
      expect(rested.realm).toBe(2);
      expect(rested.goldenCore).toEqual(s.goldenCore);
    },
  );
  it("两胜固定主药，三胜另选培养，不以领奖选择漏发或重复发药", () => {
    let s = contestCheckpoint(true);
    let serial = 0;
    const contest = (action: ContestAction) => {
      s = dispatch(s, {
        id: `contest-golden-${++serial}`,
        type: "sectContest",
        action,
      });
      expect(validState(s)).toBe(true);
    };
    contest({ kind: "enter" });
    for (let i = 0; i < 3; i++) {
      contest({ kind: "fight" });
      while (s.sectContest.duel)
        contest({
          kind: "move",
          move: contestFoes[i]!.pattern[s.sectContest.duel.turn % 3]!,
        });
    }
    const before = s.stones;
    contest({ kind: "reward", reward: "medicine" });
    expect(s.goldenCore.medicine).toBe(1);
    expect(s.stones - before).toBe(24);
    expect(s.goldenCore.champion).toBe("pending");
    contest({ kind: "leave" });
    s = act(s, { kind: "champion", reward: "haven" });
    s = act(s, { kind: "site", site: "sect" });
    expect(s.goldenCore.site).toBe("sect");
    expect(s.goldenCore.havenCredit).toBe(false);
    expect(validState(s)).toBe(true);
    expect(act(s, { kind: "champion", reward: "guard" })).toBe(s);
  });
  it("独行额外收益只发首通，失败保留灵地且可再次取药", () => {
    let s = gather(funded(condensationCheckpoint()), "alone");
    s = act(s, { kind: "brew", method: "commission" });
    s = act(s, { kind: "site", site: "repaired" });
    // Search seeds for a reproducible failure rather than hard-code a probabilistic assertion.
    let failed: State | undefined;
    for (let seed = 1; seed < 50000; seed += 137) {
      const candidate = { ...s, seed };
      const n = act(candidate, { kind: "break" }, "fail-case");
      if (n.realm === 1) {
        failed = n;
        break;
      }
    }
    expect(failed).toBeDefined();
    s = failed!;
    expect(s.goldenCore.attempts).toBe(1);
    expect(s.goldenCore.site).toBe("repaired");
    expect(s.injury).toBe(2);
    expect(s.goldenCore.pills).toBe(0);
    expect(validState(s)).toBe(true);
    s = dispatch(s, {
      id: "heal",
      type: "advance",
      activity: "rest",
      months: 2,
    });
    const clarity = s.growth.medicines.clarity;
    s = gather(s, "alone");
    expect(s.growth.medicines.clarity).toBe(clarity);
    expect(s.goldenCore.gathered).toBe(2);
    s = act(s, { kind: "brew", method: "self" });
    s = act(s, { kind: "guard" });
    expect(goldenChance(s)).toBe(100);
    s = act(s, { kind: "break" });
    expect(s.realm).toBe(2);
    expect(validState(s)).toBe(true);
  });
  it("药圃互斥、撤退恢复、重复指令与损坏存档保护", () => {
    let s = act(funded(condensationCheckpoint()), { kind: "prepare" });
    s = act(s, { kind: "route", route: "share" });
    s = act(s, { kind: "fight" });
    for (const intent of [
      { type: "advance", activity: "work", months: 1 },
      { type: "equip", technique: "blade" },
      {
        type: "foundationJourney",
        action: { kind: "travel", destination: "ferry" },
      },
    ] as const)
      expect(dispatch(s, { ...intent, id: "blocked" })).toBe(s);
    const checkpoint = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(checkpoint).toEqual(s);
    const n = act(s, { kind: "withdraw" });
    expect(n.injury).toBe(s.injury);
    expect(n.goldenCore.expedition).toBe("idle");
    for (const edit of [
      (x: State) => x.goldenCore.medicine++,
      (x: State) => (x.goldenCore.formedAt = 1),
      (x: State) => (x.goldenCore.champion = "pending"),
    ]) {
      const bad = structuredClone(n);
      edit(bad);
      expect(validState(bad)).toBe(false);
      expect(() => migrateSave(bad)).toThrow();
    }
    expect(() => migrateSave({ ...n, version: 999 })).toThrow();
  });
  it("未满足圆满不能提前叩关，低资源、寿尽与事件阻断不扣物资", () => {
    const s = funded(condensationCheckpoint());
    s.age = s.limit - 6;
    expect(act(s, { kind: "break" })).toBe(s);
    s.stones = 0;
    expect(act(s, { kind: "prepare" })).toBe(s);
    const dead = { ...s, status: "dead" as const };
    expect(act(dead, { kind: "site", site: "repaired" })).toBe(dead);
    const early = createGame("初入", "wood");
    expect(act(early, { kind: "prepare" })).toBe(early);
  });
  it("v28 不补发过去大比奖励，不覆盖原档", () => {
    const s = createGame("迁移", "wood");
    const old = { ...s, treasures: legacyEquipment(s), version: 28 } as Record<string, unknown>;
    delete old.goldenCore;
    const n = migrateSave(old);
    expect(n.version).toBe(35);
    expect(n.goldenCore.medicine).toBe(0);
    expect(validState(n)).toBe(true);
    expect(old.goldenCore).toBeUndefined();
  });
  it("未备灵地不虚增把握，待选培养不会在突破后悬空", () => {
    const s = funded(condensationCheckpoint());
    const base = goldenChance(s);
    s.goldenCore.site = "repaired";
    expect(goldenChance(s) - base).toBe(8);
    s.goldenCore.site = "rented";
    expect(goldenChance(s) - base).toBe(12);
    s.goldenCore.champion = "pending";
    expect(goldenQuote(s, {kind:"break"}).error).toContain("先选取");
    expect(act(s, {kind:"break"})).toBe(s);
  });

});
