import { expect, it } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { createGame as createCultivator } from "../src/core";
import { lizhaoFixture, lizhaoTick } from "../tools/lizhao-fixture";
import {
  artifactQuote,
  artifactExchange,
  runArtifactGrowth,
  type ArtifactAction,
} from "../src/artifact-growth/rules";
import {
  evaluateEquipment,
  previewEquipment,
  equipmentControl,
} from "../src/equipment";
import { freshArtifactGrowth } from "../src/artifact-growth/state";
import { sceneOwner } from "../src/scene-activity";
function fixture() {
  const s = lizhaoFixture();
  s.outerSea.met = true;
  s.lizhao.location = "harbor";
  s.lizhao.route = "independent";
  s.lizhao.preparation = "ward";
  s.lizhao.outerCleared = true;
  s.treasures.artifacts = [];
  s.journey.equipped = null;
  s.treasures.equipped = [];
  return s;
}
let serial = 0;
function act(s: State, a: ArtifactAction) {
  expect(artifactQuote(s, a).error).toBe("");
  return runArtifactGrowth(s, a, `artifact-${++serial}`, lizhaoTick);
}
function fight(s: State) {
  for (let i = 0; s.itemGrowth.golden.duel && i < 18; i++)
    s = act(s, {
      kind: "move",
      move: (["guard", "strike", "discern"] as const)[
        s.itemGrowth.golden.duel.turn % 3
      ]!,
    });
  return s;
}
it.each(["sense", "herbs"] as const)(
  "%s准备、争胚、温养、装配与破罡，唯一奖励且确定性重放",
  (preparation) => {
    let s = act(fixture(), { kind: "hear" });
    const before = structuredClone(s);
    s = act(s, { kind: "claim", preparation });
    expect(s.month - before.month).toBe(3);
    expect(before.herbs - s.herbs).toBe(preparation === "herbs" ? 6 : 0);
    expect(sceneOwner(s)).toBe("lizhao");
    const copy = structuredClone(s),
      v = artifactExchange(s, "guard")!;
    expect(s).toEqual(copy);
    const cmd = {
      id: "deterministic",
      type: "artifactGrowth",
      action: { kind: "move", move: "guard" },
    } as const;
    const next = dispatch(s, cmd);
    expect(dispatch(s, cmd)).toEqual(next);
    expect(dispatch(next, cmd)).toBe(next);
    expect(next.itemGrowth.golden.duel!.enemy).toBe(
      s.itemGrowth.golden.duel!.enemy - v.damage,
    );
    expect(
      dispatch(s, {
        id: "locked",
        type: "advance",
        activity: "work",
        months: 1,
      }),
    ).toBe(s);
    s = fight(s);
    expect(s.itemGrowth.golden.blade).toBe("embryo");
    expect(artifactQuote(s, { kind: "claim", preparation }).error).not.toBe("");
    expect(
      previewEquipment(s, [{ kind: "deploy", id: "tideBlade" }]).error,
    ).not.toBe("");
    s = act(s, { kind: "attune" });
    const load = previewEquipment(s, [{ kind: "deploy", id: "tideBlade" }]);
    expect(load.error).toBe("");
    s = load.next as State;
    s = act(s, { kind: "prove" });
    s = fight(s);
    expect(s.itemGrowth.golden.proven).toBe(true);
  },
);
it("中断不吞材料，撤退保留旧物，缺资源拒绝", () => {
  let s = act(fixture(), { kind: "hear" });
  const before = structuredClone(s);
  const n = runArtifactGrowth(
    s,
    { kind: "claim", preparation: "herbs" },
    "interrupt",
    (v) => ({ ...v, status: "dead" }),
  );
  expect(n.stones).toBe(s.stones);
  expect(n.herbs).toBe(s.herbs);
  expect(n.itemGrowth.golden.duel).toBeNull();
  expect(s).toEqual(before);
  s = act(s, { kind: "claim", preparation: "herbs" });
  s = act(s, { kind: "withdraw" });
  expect(s.injury).toBe(0);
  expect(s.itemGrowth.golden.blade).toBe("none");
  s.stones = 0;
  expect(
    artifactQuote(s, { kind: "claim", preparation: "sense" }).error,
  ).not.toBe("");
});
it("三宝容量取舍，正确衔接与未装备边界，印珠续炼各有用途", () => {
  const s = fixture();
  s.itemGrowth.golden = {
    ...freshArtifactGrowth(),
    heard: true,
    blade: "attuned",
    seal: true,
    pearl: true,
  };
  s.outerSea.seal = true;
  s.outerSea.attuned = true;
  s.outerSea.cleared = 2;
  s.conclave.depth = 2;
  s.conclave.attuned = true;
  s.treasures.artifacts = ["tideBlade", "tideSeal", "spiritPearl"];
  expect(equipmentControl(s).error).not.toBe("");
  for (const [id, move, prior] of [
    ["tideBlade", "strike", "guard"],
    ["tideSeal", "guard", "strike"],
    ["spiritPearl", "discern", "strike"],
  ] as const) {
    s.treasures.artifacts = [id];
    const context = {
      kind: "turn",
      move,
      correct: true,
      previousMove: prior,
    } as const;
    expect(
      evaluateEquipment(s, context).sources.some(
        (v) => v.source === id && v.effect === "sequence",
      ),
    ).toBe(true);
    expect(
      evaluateEquipment(s, { ...context, correct: false }).sources.some(
        (v) => v.effect === "sequence",
      ),
    ).toBe(false);
    s.treasures.artifacts = [];
    expect(
      evaluateEquipment(s, context).sources.some(
        (v) => v.effect === "sequence",
      ),
    ).toBe(false);
  }
});
it("v44保守迁移只补空域，坏档与未来版本拒绝", () => {
  const current = createCultivator("迁移", "wood", 42);
  const old = structuredClone(current) as any;
  old.version = 44;
  delete old.itemGrowth.golden;
  const copy = structuredClone(old),
    n = migrateSave(old);
  expect(n.itemGrowth.golden).toEqual(freshArtifactGrowth());
  expect(old).toEqual(copy);
  expect(validState(n)).toBe(true);
  expect(() =>
    migrateSave({ ...old, itemGrowth: { ...old.itemGrowth, ring: 99 } }),
  ).toThrow();
  expect(() => migrateSave({ ...n, version: 999 })).toThrow();
  const corrupt = structuredClone(n);
  corrupt.itemGrowth.golden.heard = true;
  expect(validState(corrupt)).toBe(false);
});

it("败退可重新准备，未实际破罡不能完成试剑", () => {
  let s = act(act(fixture(), { kind: "hear" }), {
    kind: "claim",
    preparation: "sense",
  });
  s.itemGrowth.golden.duel!.hp = 1;
  s = act(s, { kind: "move", move: "strike" });
  expect(s.itemGrowth.golden.duel).toBeNull();
  expect(s.injury).toBe(1);
  expect(s.itemGrowth.golden.blade).toBe("none");
  s = act(s, { kind: "claim", preparation: "herbs" });
  expect(s.itemGrowth.golden.duel).not.toBeNull();
  s = fight(s);
  s = act(s, { kind: "attune" });
  s = previewEquipment(s, [{ kind: "deploy", id: "tideBlade" }]).next as State;
  s = act(s, { kind: "prove" });
  s.itemGrowth.golden.duel!.enemy = 1;
  s = act(s, { kind: "move", move: "guard" });
  expect(s.itemGrowth.golden.proven).toBe(false);
  expect(artifactQuote(s, { kind: "prove" }).error).toBe("");
});
