import { expect, it } from "vitest";
import { lizhaoCheckpoint } from "../tools/lizhao-checkpoint";
import { artifactGrowthCheckpoint } from "../tools/artifact-growth-checkpoint";
import { goldenCompletionPlayer } from "../tools/golden-completion-checkpoint";
import { artifactExchange, artifactQuote } from "../src/artifact-growth/rules";
import { validState, migrateSave, dispatch } from "../src/core";
import { equipmentTurnEffect } from "../src/equipment";
it("公开剧情路线取得剑胚、续炼印珠、温养换装、真正破罡并逐步读档", () => {
  const initial = artifactGrowthCheckpoint(),
    p = goldenCompletionPlayer(initial);
  const act = (action: Parameters<typeof artifactQuote>[1]) =>
    p.send({ type: "artifactGrowth", action });
  act({ kind: "cultivate", artifact: "tideSeal" });
  act({ kind: "cultivate", artifact: "spiritPearl" });
  const afterCultivation = p.state;
  expect(
    equipmentTurnEffect(afterCultivation, "guard", true, "strike").note,
  ).toContain("镇潮印镇压");
  expect(
    equipmentTurnEffect(afterCultivation, "discern", true, "strike").note,
  ).toContain("定神珠护识");
  act({ kind: "claim", preparation: "sense" });
  for (let i = 0; p.state.itemGrowth.golden.duel && i < 18; i++)
    act({
      kind: "move",
      move: (["guard", "strike", "discern"] as const)[
        p.state.itemGrowth.golden.duel!.turn % 3
      ]!,
    });
  expect(p.state.itemGrowth.golden.blade).toBe("embryo");
  act({ kind: "attune" });
  for (const item of [...p.state.treasures.artifacts])
    p.send({ type: "treasure", action: { kind: "withdraw", item } });
  p.send({ type: "treasure", action: { kind: "deploy", item: "tideBlade" } });
  act({ kind: "prove" });
  act({ kind: "move", move: "guard" });
  const preview = artifactExchange(p.state, "strike")!;
  expect(preview.breaking).toBe(true);
  expect(preview.note).toContain("破开罡衣");
  act({ kind: "move", move: "strike" });
  expect(
    p.state.itemGrowth.golden.duel?.broken ?? p.state.itemGrowth.golden.proven,
  ).toBe(true);
  for (let i = 0; p.state.itemGrowth.golden.duel && i < 18; i++)
    act({
      kind: "move",
      move: (["guard", "strike", "discern"] as const)[
        p.state.itemGrowth.golden.duel!.turn % 3
      ]!,
    });
  expect(p.state.itemGrowth.golden.proven).toBe(true);
  expect(validState(p.state)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(p.state)))).toEqual(p.state);
  const corrupted = structuredClone(p.state);
  corrupted.itemGrowth.golden.blade = "none";
  expect(validState(corrupted)).toBe(false);
  expect(
    dispatch(p.state, {
      id: "no-reward-repeat",
      type: "artifactGrowth",
      action: { kind: "claim", preparation: "sense" },
    }),
  ).toBe(p.state);
});

it("拒绝绕过器室地点与外层历练的战中档，保留正常战中迁移", () => {
  const p = goldenCompletionPlayer(artifactGrowthCheckpoint());
  p.send({
    type: "artifactGrowth",
    action: { kind: "claim", preparation: "sense" },
  });
  const battle = p.state;
  expect(validState(battle)).toBe(true);
  for (const field of ["outerCleared", "location"] as const) {
    const bad = structuredClone(battle);
    if (field === "outerCleared") bad.lizhao.outerCleared = false;
    else bad.lizhao.location = "away";
    expect(validState(bad)).toBe(false);
    expect(() => migrateSave(bad)).toThrow();
  }
  const old = structuredClone(battle) as any;
  old.version = 45;
  delete old.treasures.auctionArchive;
  const upgraded = migrateSave(old);
  expect(upgraded.itemGrowth.golden).toEqual(battle.itemGrowth.golden);
  expect(validState(upgraded)).toBe(true);
});

it("续炼被首次会期来信打断，保留时间但不扣材料或发成果", () => {
  const s = lizhaoCheckpoint("spring", "inner-sea");
  s.outerSea.notice = s.month - 599;
  s.outerSea.reminded = false;
  expect(validState(s)).toBe(true);
  const next = dispatch(s, {
    id: "artifact-meeting-interruption",
    type: "artifactGrowth",
    action: { kind: "cultivate", artifact: "tideSeal" },
  });
  expect(next.month).toBe(s.month + 1);
  expect(next.outerSea.reminded).toBe(true);
  expect(next.stones).toBe(s.stones);
  expect(next.herbs).toBe(s.herbs);
  expect(next.itemGrowth.golden.seal).toBe(false);
  expect(validState(next)).toBe(true);
});
