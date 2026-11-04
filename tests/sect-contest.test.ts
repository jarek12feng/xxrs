import { SAVE_VERSION } from "../src/save-version";
import { legacyEquipment } from "./legacy-equipment";
import { describe, it, expect } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import { contestFoes, NOTICE_MONTHS } from "../src/sect-contest/content";
import { contestError, type ContestAction } from "../src/sect-contest/rules";
export function eligible(main: "spring" | "blade" | "breath" = "spring") {
  const p = journeyPlayer(
    journeyCheckpoint("male", false, main === "blade" ? "sword" : "wood", main),
  );
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: main });
  p.fight("application");
  p.cultivate(200);
  p.fight("exit");
  p.act({ kind: "ferryOutcome", outcome: "escort" });
  p.send({ type: "join", branch: "dan" });
  p.act({ kind: "travel", destination: "home" });
  expect(validState(p.state)).toBe(true);
  return p.state;
}
export function action(
  s: State,
  a: ContestAction,
  id = `contest-${s.month}-${s.seen.length}`,
) {
  return dispatch(s, { id, type: "sectContest", action: a });
}
export function opening(s = eligible()) {
  s = action(s, { kind: "prepare" });
  while (s.month < s.sectContest.starts) {
    const old = s;
    s = dispatch(s, {
      id: `work-${s.month}`,
      type: "advance",
      activity: "work",
      months: 12,
    });
    if (s === old) throw new Error("Preparation stalled");
  }
  expect(s.month).toBe(s.sectContest.starts);
  expect(s.sectContest.reminded).toBe(true);
  return action(s, { kind: "enter" });
}
function compete(s: State, win = true) {
  s = action(s, { kind: "fight" });
  expect(s.sectContest.duel).not.toBeNull();
  if (!win) return action(s, { kind: "withdraw" });
  while (s.sectContest.duel) {
    const t = s.sectContest;
    const move = contestFoes[t.results.length]!.pattern[t.duel!.turn % 3]!;
    s = action(s, { kind: "move", move });
    expect(validState(s)).toBe(true);
  }
  return s;
}
describe("剧情中的十年内比之约", () => {
  it("中期归山同门告知，提前十年；金丹预告基准五十年，无新独立入口", () => {
    const s = eligible();
    expect(s.sectContest.stage).toBe("invited");
    expect(s.sectContest.source).toBe("return");
    expect(s.sectContest.starts - s.month).toBe(120);
    expect(NOTICE_MONTHS.golden).toBe(600);
    expect(s.sectContest.last).toContain("许砚舟");
    expect(action(s, { kind: "enter" })).toBe(s);
    const early = journeyCheckpoint();
    expect(early.sectContest.stage).toBe("unheard");
    expect(action(early, { kind: "enter" })).toBe(early);
  });
  it("散修、危机期间不会收到强制参赛消息，暂缓也不影响修行", () => {
    const p = journeyPlayer(journeyCheckpoint("male", true));
    p.act({ kind: "travel", destination: "home" });
    expect(p.state.sectContest.stage).toBe("unheard");
    const s = eligible();
    const n = action(s, { kind: "defer" });
    expect(n.sectContest.stage).toBe("deferred");
    expect(
      dispatch(n, {
        id: "continue-cultivate",
        type: "advance",
        activity: "cultivate",
        months: 12,
      }).month,
    ).toBeGreaterThan(n.month);
  });
  it("长闭关精准停在开场月份，未自动报名；同一状态重放一致", () => {
    let s = action(eligible(), { kind: "prepare" });
    s.month = s.sectContest.starts - 2;
    s.age += 118;
    const command = {
      id: "long-retreat",
      type: "advance",
      activity: "cultivate",
      months: 120,
    } as const;
    const n = dispatch(s, command);
    expect(n.month - s.month).toBe(2);
    expect(n.sectContest.stage).toBe("invited");
    expect(n.sectContest.duel).toBeNull();
    expect(n).toEqual(dispatch(s, command));
    expect(validState(n)).toBe(true);
    expect(dispatch(n, { ...command, id: "must-decide" })).toBe(n);
  });
  it.each(["spring", "blade", "breath"] as const)(
    "%s 三场可达，完整存读档，重复命令和领奖不发第二份",
    (main) => {
      let s = opening(eligible(main));
      for (let i = 0; i < 3; i++) {
        s = compete(s);
        expect(s.sectContest.results[i]).toBe("win");
        s = migrateSave(JSON.parse(JSON.stringify(s)));
      }
      expect(s.sectContest.best).toBe(3);
      expect(s.sectContest.stage).toBe("finished");
      const n = action(s, { kind: "reward", reward: "herbs" }, "gift");
      expect(n.herbs - s.herbs).toBe(12);
      expect(action(n, { kind: "reward", reward: "medicine" }, "gift")).toBe(n);
      expect(action(n, { kind: "reward", reward: "herbs" }, "different")).toBe(
        n,
      );
      expect(validState(n)).toBe(true);
    },
  );
  it("认输推进本届赛程且不受伤，弃权不伪造夺魁，成绩奖只补差额", () => {
    let s = opening();
    s = compete(s);
    s = compete(s, false);
    expect(s.sectContest.results).toEqual(["win", "loss"]);
    s = action(s, { kind: "leave" });
    expect(s.sectContest.results).toEqual(["win", "loss", "loss"]);
    expect(s.sectContest.best).toBe(1);
    expect(s.sectContest.last).not.toContain("魁首");
    const n = action(s, { kind: "reward", reward: "medicine" });
    expect(n.growth.medicines.healing - s.growth.medicines.healing).toBe(1);
    expect(validState(n)).toBe(true);
  });
  it("斗法期间拒绝换装、工坊、拍卖、修行和其他战斗；重新载入仍可认输", () => {
    const s = action(opening(), { kind: "fight" });
    for (const c of [
      { type: "advance", activity: "work", months: 1 },
      { type: "equip", technique: "blade" },
      { type: "treasure", action: { kind: "catalog", venue: "foundation" } },
      { type: "workshop", order: { product: "healing", method: "craft" } },
      {
        type: "foundationJourney",
        action: { kind: "battle", battle: "rank1" },
      },
    ] as const)
      expect(dispatch(s, { ...c, id: "blocked" })).toBe(s);
    const n = action(migrateSave(JSON.parse(JSON.stringify(s))), {
      kind: "withdraw",
    });
    expect(n.sectContest.results).toEqual(["loss"]);
    expect(n.injury).toBe(s.injury);
  });
  it("寿尽抢占入场、不扣费用；坏日期、伪造领奖与未知存档拒绝", () => {
    let s = opening();
    s.age = s.limit - 1;
    const n = action(s, { kind: "fight" });
    expect(n.status).toBe("dead");
    expect(n.stones).toBe(s.stones);
    expect(n.sectContest.duel).toBeNull();
    expect(validState(n)).toBe(true);
    s = eligible();
    for (const edit of [
      (x: State) => x.sectContest.starts++,
      (x: State) => (x.sectContest.claimed = 3),
      (x: State) => x.sectContest.results.push("win"),
    ]) {
      const bad = structuredClone(s);
      edit(bad);
      expect(validState(bad)).toBe(false);
      expect(() => migrateSave(bad)).toThrow();
    }
    expect(() => migrateSave({ ...s, version: 999 })).toThrow();
  });
  it("v27 不补造参赛与邀约，更新后仍保留原进度", () => {
    const s = eligible();
    const old = { ...s, sense:Math.min(12,s.sense), treasures: legacyEquipment(s), version: 27 } as Record<string, unknown>;
    delete old.sectContest;
    delete old.spirit;
    const n = migrateSave(old);
    expect(n.version).toBe(SAVE_VERSION);
    expect(n.sectContest.stage).toBe("unheard");
    expect(n.foundationJourney).toEqual(s.foundationJourney);
    expect(old.version).toBe(27);
    expect(validState(n)).toBe(true);
  });
  it("错过本届不封路，之后交接获得提前十年的下一届消息", () => {
    let s = action(eligible(), { kind: "defer" });
    s.month = s.sectContest.starts + 12;
    s.age += 132;
    // An actual sect duty is a new encounter, not a menu that refreshes the date.
    s.herbs += 2;
    s = dispatch(s, { id: "return-duty", type: "duty", duty: "herbs" });
    expect(s.sectContest.edition).toBe(2);
    expect(s.sectContest.starts - s.month).toBe(120);
    expect(validState(s)).toBe(true);
  });
});
it("实际败北可静养恢复，已得成绩不丢，缺钱开战不会扣费", () => {
  let s = opening();
  s.foundation = 0;
  s.mastery = 0;
  s.study = 0;
  s.sense = 4;
  s.journey.main = null;
  s.journey.support = null;
  s.journey.equipped = null;
  s = action(s, { kind: "fight" });
  for (let i = 0; i < 12 && s.sectContest.duel; i++)
    s = action(s, { kind: "move", move: "strike" });
  expect(s.sectContest.results).toEqual(["loss"]);
  expect(s.injury).toBe(1);
  expect(validState(s)).toBe(true);
  s = dispatch(s, {
    id: "recover",
    type: "advance",
    activity: "rest",
    months: 1,
  });
  expect(s.injury).toBe(0);
  s.stones = 0;
  expect(action(s, { kind: "fight" })).toBe(s);
});
it("古道危机撞上开场可暂不参赛，避免提醒与恢复互相卡住", () => {
  const s = opening();
  s.sectContest.stage = "invited";
  s.foundationJourney.heroine.expedition = true;
  s.foundationJourney.rescue = 1;
  expect(contestError(s, { kind: "enter" })).toContain("接应");
  expect(action(s, { kind: "defer" }).sectContest.stage).toBe("deferred");
});
it("新成绩领取前不会被离场覆盖，同成绩续届不再发奖", () => {
  let s = opening();
  s = compete(compete(compete(s)));
  expect(action(s, { kind: "leave" })).toBe(s);
  s = action(s, { kind: "reward", reward: "herbs" });
  s = action(s, { kind: "leave" });
  s.month = s.sectContest.starts + 12;
  s.age += 12;
  s = dispatch(s, { id: "next-edition", type: "duty", duty: "watch" });
  expect(s.sectContest.edition).toBe(2);
  s = opening(s);
  s = compete(compete(compete(s)));
  expect(action(s, { kind: "reward", reward: "medicine" })).toBe(s);
  expect(validState(s)).toBe(true);
});
