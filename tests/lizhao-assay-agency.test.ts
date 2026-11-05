import { beforeAll, expect, it } from "vitest";
import { dispatch, migrateSave, validState, type State } from "../src/core";
import { lizhaoDepthCheckpoint } from "../tools/lizhao-depth-checkpoint";
import {
  assayMethod,
  canCollect,
  resolveAssay,
  startAssay,
  type AssayMove,
} from "../src/lizhao/assay";
import { lizhaoQuote, runLizhao } from "../src/lizhao/rules";
let initial: State;
beforeAll(() => {
  initial = lizhaoDepthCheckpoint();
}, 30000);
let serial = 0;
function start() {
  return dispatch(initial, {
    type: "lizhao",
    id: `start-${++serial}`,
    action: { kind: "verify" },
  });
}
function act(s: State, move: AssayMove) {
  const q = assayMethod(s, move),
    before = structuredClone(s),
    command = {
      type: "lizhao" as const,
      id: `trial-${++serial}`,
      action: { kind: "assay" as const, move },
    };
  expect(lizhaoQuote(s, command.action).error).toBe("");
  const n = dispatch(s, command);
  expect(n.lizhao.assay).toEqual(q.next);
  expect(n.month - s.month).toBe(q.months);
  expect(n.herbs).toBe(s.herbs - q.herbs);
  expect(n.lizhao.reagent).toBe(s.lizhao.reagent);
  expect(s).toEqual(before);
  expect(dispatch(s, command)).toEqual(n);
  expect(dispatch(n, command)).toBe(n);
  expect(validState(n)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
  return n;
}
it("普通缓炼不需要分念或法宝；分念保留潮息但能提前收药", () => {
  const s = start();
  const ordinary = {
    ...s,
    spirit: { ...s.spirit, manual: "none" as const },
    treasures: { ...s.treasures, artifacts: [] },
  };
  const slow = act(act(ordinary, "drain"), "bind");
  const divided = act(s, "divide");
  expect(divided.lizhao.assay).toMatchObject({
    tide: 1,
    separation: 2,
    strain: 1,
  });
  const fast = act(divided, "bind");
  expect(slow.month - s.month).toBe(3);
  expect(fast.month - s.month).toBe(2);
  expect(slow.lizhao.recipeVerified && fast.lizhao.recipeVerified).toBe(true);
  expect(
    lizhaoQuote(ordinary, { kind: "assay", move: "divide" }).error,
  ).toContain("分念诀");
});
it("贸然收药后分念会失稳；可以收念、改缓炼、添药或御印恢复，分药进度不丢失", () => {
  const s = start();
  const burdened = act(act(s, "bind"), "divide");
  expect(canCollect(burdened.lizhao.assay)).toBe(false);
  expect(burdened.lizhao.assay).toMatchObject({
    tide: 1,
    separation: 2,
    strain: 2,
  });
  for (const move of ["rest", "drain", "herbFilter", "sealFlow"] as const) {
    let source = burdened;
    if (move === "sealFlow" && !source.treasures.artifacts.includes("tideSeal"))
      source = dispatch(source, {
        type: "treasure",
        id: `equip-${++serial}`,
        action: { kind: "deploy", item: "tideSeal" },
      });
    const repaired = act(source, move);
    expect(repaired.lizhao.assay.separation).toBe(2);
    expect(act(repaired, "bind").lizhao.recipeVerified).toBe(true);
  }
  const failed = act(burdened, "bind");
  expect(failed.lizhao.recipeVerified).toBe(false);
  expect(failed.lizhao.assay.separation).toBe(2);
});
it("滤草或御印只退潮，不能跳过分药；中断不扣料或改炉况", () => {
  const s = start();
  const filtered = act(s, "herbFilter");
  expect(filtered.lizhao.recipeVerified).toBe(false);
  expect(filtered.lizhao.assay.separation).toBe(0);
  expect(act(act(filtered, "divide"), "bind").lizhao.recipeVerified).toBe(true);
  const n = runLizhao(
    s,
    { kind: "assay", move: "herbFilter" },
    "interrupt",
    (v) => ({ ...v, status: "dead" }),
  );
  expect(n.herbs).toBe(s.herbs);
  expect(n.lizhao.assay).toEqual(s.lizhao.assay);
});
it("炉况经回港与读档保留，回来可改用普通方法", () => {
  let s = act(act(start(), "bind"), "divide");
  const saved = structuredClone(s.lizhao.assay);
  s = dispatch(s, {
    type: "lizhao",
    id: `leave-${++serial}`,
    action: { kind: "return" },
  });
  s = migrateSave(JSON.parse(JSON.stringify(s)));
  expect(s.lizhao.assay).toEqual(saved);
  expect(lizhaoQuote(s, { kind: "assay", move: "rest" }).error).toBeTruthy();
  s = dispatch(s, {
    type: "lizhao",
    id: `back-${++serial}`,
    action: { kind: "chamber" },
  });
  expect(act(act(s, "drain"), "bind").lizhao.recipeVerified).toBe(true);
});
it.each(["idle", "cloudy", "clear", "stable"] as const)(
  "v50 %s 迁移不补发成果或清空世界日程",
  (phase) => {
    const old = structuredClone(initial) as any;
    old.version = 50;
    old.lizhao.assay = { phase, mistakes: 1 };
    old.lizhao.recipeVerified = phase === "stable";
    const snapshot = structuredClone(old),
      n = migrateSave(old);
    expect(n.version).toBe(initial.version);
    expect(n.lizhao.recipeVerified).toBe(old.lizhao.recipeVerified);
    expect(n.lizhao.reagent).toBe(old.lizhao.reagent);
    expect(n.tideSurvey).toEqual(old.tideSurvey);
    expect(n.correspondence).toEqual(old.correspondence);
    expect(old).toEqual(snapshot);
    expect(validState(n)).toBe(true);
    if (phase === "clear") expect(canCollect(n.lizhao.assay)).toBe(true);
  },
);
it("拒绝损坏炉况与未来存档，报价反复读取不推进炉况", () => {
  const s = start(),
    before = structuredClone(s);
  for (let i = 0; i < 5; i++)
    for (const move of ["drain", "divide", "bind"] as const)
      assayMethod(s, move);
  expect(s).toEqual(before);
  for (const mutation of [
    { tide: 3 },
    { strain: -1 },
    { separation: 1.5 },
    { phase: "clear" },
  ]) {
    const bad = {
      ...s,
      lizhao: { ...s.lizhao, assay: { ...s.lizhao.assay, ...mutation } },
    };
    expect(() => migrateSave(bad)).toThrow();
  }
  expect(() => migrateSave({ ...s, version: s.version + 1 })).toThrow();
});
it("所有可达活跃炉况都可缓炼后收药，不存在不可恢复的试液", () => {
  const queue = [startAssay()],
    seen = new Set<string>();
  while (queue.length) {
    const a = queue.shift()!;
    const key = JSON.stringify({ ...a, mistakes: 0 });
    if (seen.has(key)) continue;
    seen.add(key);
    const recover = resolveAssay(resolveAssay(a, "drain").next, "bind").next;
    expect(recover.phase).toBe("stable");
    for (const move of [
      "drain",
      "divide",
      "rest",
      "herbFilter",
      "sealFlow",
      "bind",
    ] as const) {
      const n = resolveAssay(a, move).next;
      if (n.phase !== "stable") queue.push(n);
    }
  }
  expect(seen.size).toBeGreaterThan(5);
});

it("两月缓炼途中中断保留已过年月，不提前分药或扣除资源", () => {
  const s = start();
  let ticks = 0;
  const n = runLizhao(
    s,
    { kind: "assay", move: "drain" },
    "drain-interrupt",
    (v) => ({
      ...v,
      month: v.month + 1,
      age: v.age + 1,
      status: ++ticks === 1 ? "dead" : v.status,
    }),
  );
  expect(ticks).toBe(1);
  expect(n.month).toBe(s.month + 1);
  expect(n.herbs).toBe(s.herbs);
  expect(n.lizhao.assay).toEqual(s.lizhao.assay);
  expect(n.lizhao.recipeVerified).toBe(false);
});
