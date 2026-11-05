import { beforeAll, expect, it } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { nascentCrossingCheckpoint } from "../tools/nascent-crossing-checkpoint";
import {
  nascentQuote,
  runNascent,
  type NascentAction,
} from "../src/nascent-soul/rules";
import {
  crossingQuote,
  crossingView,
  freshCrossing,
  type CrossingMove,
} from "../src/nascent-soul/crossing";
let initial: State;
let serial = 0;
beforeAll(() => {
  initial = nascentCrossingCheckpoint();
}, 60000);
function act(s: State, action: NascentAction) {
  const q = nascentQuote(s, action);
  expect(q.error, JSON.stringify(action)).toBe("");
  const cmd = {
      type: "nascentSoul" as const,
      action,
      id: `crossing-${++serial}`,
    },
    snapshot = structuredClone(s);
  const n = dispatch(s, cmd);
  expect(n).not.toBe(s);
  expect(s).toEqual(snapshot);
  expect(dispatch(s, cmd)).toEqual(n);
  expect(dispatch(n, cmd)).toBe(n);
  expect(n.month - s.month).toBe(q.months);
  expect(n.stones).toBe(s.stones);
  expect(n.herbs).toBe(s.herbs);
  expect(validState(n)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
  return n;
}
const move = (s: State, m: CrossingMove) =>
  act(s, { kind: "crossing", move: m });
const start = () => act(initial, { kind: "survey" });
it("基础元婴护持无需法宝：主潮到回水湾，换护侧岸后登岸设标", () => {
  let s = start();
  s.treasures.artifacts = [];
  const before = s.month;
  expect(
    nascentQuote(s, { kind: "crossing", move: "advance" }).error,
  ).toContain("主潮");
  s = move(s, "main");
  expect(crossingView(s)).toMatchObject({ main: true, shore: false });
  s = move(s, "advance");
  expect(s.nascentSoul.crossing.position).toBe("eddy");
  expect(s.nascentSoul.ability).not.toBe("done");
  expect(
    nascentQuote(s, { kind: "crossing", move: "advance" }).error,
  ).toContain("侧岸");
  s = move(s, "shore");
  expect(crossingView(s)).toMatchObject({ main: false, shore: true });
  s = move(s, "advance");
  expect(s.month - before).toBe(2);
  expect(s.nascentSoul.ability).toBe("done");
  expect(s.nascentSoul.crossing.position).toBe("shore");
  expect(
    nascentQuote(s, { kind: "crossing", move: "advance" }).error,
  ).toBeTruthy();
  expect(s.nascentSoul.last).toContain("路标");
});
it("铺开护持可一路分批缓渡，无需猜换势顺序；用时与集中护持不同", () => {
  let s = move(start(), "wide");
  const before = s.month;
  expect(crossingView(s)).toMatchObject({ main: true, shore: true });
  s = move(s, "advance");
  expect(s.nascentSoul.crossing.position).toBe("eddy");
  s = move(s, "advance");
  expect(s.month - before).toBe(4);
  expect(s.nascentSoul.ability).toBe("done");
});
it.each([
  ["seal", "shore"],
  ["shore", "seal"],
] as const)(
  "镇潮印与护岸可以按任意顺序布置：%s/%s，覆盖两处后连续引航",
  (...order) => {
    let s = start();
    if (!s.treasures.artifacts.includes("tideSeal"))
      s = dispatch(s, {
        type: "treasure",
        id: `equip-${++serial}`,
        action: { kind: "deploy", item: "tideSeal" },
      });
    const before = s.month;
    for (const m of order) s = move(s, m);
    expect(crossingView(s)).toMatchObject({
      main: true,
      shore: true,
      fixed: true,
    });
    const quote = crossingQuote(s, "advance");
    expect(quote.months).toBe(2);
    expect(quote.next.position).toBe("shore");
    s = move(s, "advance");
    expect(s.month - before).toBe(2);
    expect(s.nascentSoul.ability).toBe("done");
  },
);
it("停在回水湾可收势、保存、重整，不退回此岸、不损失器材或发奖", () => {
  let s = move(move(start(), "main"), "advance");
  s = move(s, "release");
  const before = s.month;
  s = migrateSave(JSON.parse(JSON.stringify(s)));
  expect(crossingView(s)).toMatchObject({
    position: "eddy",
    main: false,
    shore: false,
  });
  expect(
    nascentQuote(s, { kind: "crossing", move: "advance" }).error,
  ).toBeTruthy();
  s = move(s, "wide");
  s = move(s, "advance");
  expect(s.month - before).toBe(2);
  expect(s.nascentSoul.ability).toBe("done");
});
it("拥有未装配、未温养以及途中卸下镇潮印均不能伪造镇流；可改用基础护持", () => {
  const s = start();
  const absent = { ...s, treasures: { ...s.treasures, artifacts: [] } };
  expect(crossingQuote(absent, "seal").error).toContain("装配");
  const cold = { ...s, outerSea: { ...s.outerSea, attuned: false } };
  expect(crossingQuote(cold, "seal").error).toBeTruthy();
  let n = s;
  if (!n.treasures.artifacts.includes("tideSeal"))
    n = dispatch(n, {
      type: "treasure",
      id: `equip-${++serial}`,
      action: { kind: "deploy", item: "tideSeal" },
    });
  n = move(move(n, "seal"), "shore");
  n = { ...n, treasures: { ...n.treasures, artifacts: [] } };
  expect(crossingView(n).fixed).toBe(false);
  expect(crossingQuote(n, "advance").error).toContain("主潮");
  n = move(n, "main");
  n = move(n, "advance");
  n = move(n, "shore");
  expect(move(n, "advance").nascentSoul.ability).toBe("done");
});
it("连续引航途中中断，已耗月保留，不提前移动舟队或建立路标", () => {
  let s = start();
  if (!s.treasures.artifacts.includes("tideSeal"))
    s = dispatch(s, {
      type: "treasure",
      id: `equip-${++serial}`,
      action: { kind: "deploy", item: "tideSeal" },
    });
  s = move(move(s, "seal"), "shore");
  let ticks = 0;
  const n = runNascent(
    s,
    { kind: "crossing", move: "advance" },
    "stop",
    (v) => ({
      ...v,
      month: v.month + 1,
      age: v.age + 1,
      status: ++ticks === 1 ? "dead" : v.status,
    }),
  );
  expect(ticks).toBe(1);
  expect(n.month).toBe(s.month + 1);
  expect(n.nascentSoul.crossing).toEqual(s.nascentSoul.crossing);
  expect(n.nascentSoul.ability).not.toBe("done");
});
it.each(["none", "surveyed", "sheltered", "done"] as const)(
  "v53 %s 迁移保留真实成果，不编造中段行舟",
  (ability) => {
    const old = structuredClone(initial) as any;
    old.version = 53;
    old.nascentSoul.ability = ability;
    delete old.nascentSoul.crossing;
    const snapshot = structuredClone(old),
      n = migrateSave(old);
    expect(old).toEqual(snapshot);
    expect(n.nascentSoul.ability).toBe(ability);
    expect(n.nascentSoul.crossing.position).toBe(
      ability === "done" ? "shore" : "near",
    );
    expect(n.friendJourney).toEqual(old.friendJourney);
    expect(n.stones).toBe(old.stones);
    expect(validState(n)).toBe(true);
  },
);
it("拒绝伪造抵岸与损坏字段、未来版本；完成后无重复结算", () => {
  const s = start();
  for (const crossing of [
    { ...freshCrossing(), position: "shore" },
    { ...freshCrossing(), seal: "yes" },
    { ...freshCrossing(), focus: "bad" },
  ]) {
    const bad = { ...s, nascentSoul: { ...s.nascentSoul, crossing } };
    expect(validState(bad)).toBe(false);
    expect(() => migrateSave(bad)).toThrow();
  }
  expect(() => migrateSave({ ...s, version: s.version + 1 })).toThrow();
  const done = move(move(move(s, "wide"), "advance"), "advance");
  expect(
    dispatch(done, {
      type: "nascentSoul",
      id: "no-repeat",
      action: { kind: "crossing", move: "advance" },
    }),
  ).toBe(done);
});
it("观察与报价纯只读；所有可达布置和中段停泊都能改用基础护持完成", () => {
  const startState = start(),
    snapshot = structuredClone(startState),
    queue = [startState],
    seen = new Set<string>();
  while (queue.length) {
    const s = queue.shift()!,
      key = JSON.stringify(s.nascentSoul.crossing);
    if (seen.has(key)) continue;
    seen.add(key);
    let c = s;
    if (c.nascentSoul.crossing.position === "near") {
      c = {
        ...c,
        nascentSoul: {
          ...c.nascentSoul,
          ability: "sheltered",
          crossing: crossingQuote(c, "main").next,
        },
      };
      c = {
        ...c,
        nascentSoul: {
          ...c.nascentSoul,
          crossing: crossingQuote(c, "advance").next,
        },
      };
    }
    c = {
      ...c,
      nascentSoul: {
        ...c.nascentSoul,
        crossing: crossingQuote(c, "shore").next,
      },
    };
    expect(crossingQuote(c, "advance").done).toBe(true);
    for (const move of [
      "main",
      "shore",
      "wide",
      "seal",
      "release",
      "advance",
    ] as const) {
      const q = crossingQuote(s, move);
      if (!q.error && !q.done)
        queue.push({
          ...s,
          nascentSoul: {
            ...s.nascentSoul,
            ability: "sheltered",
            crossing: q.next,
          },
        });
    }
  }
  expect(seen.size).toBeGreaterThan(6);
  expect(startState).toEqual(snapshot);
});
