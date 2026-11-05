import { beforeAll, expect, it } from "vitest";
import { dispatch, migrateSave, validState, type State } from "../src/core";
import { sealPreparationCheckpoint } from "../tools/continuity-checkpoint";
import { preparationOpportunities } from "../src/growth-continuity/preparation";
import { equipmentMilestone } from "../src/growth-continuity/milestones";
import { actionReceipt } from "../src/action-feedback";
import { artifactGrowthCheckpoint } from "../tools/artifact-growth-checkpoint";
import { goldenCompletionPlayer } from "../tools/golden-completion-checkpoint";
import { artifactQuote } from "../src/artifact-growth/rules";
let seal: State;
beforeAll(() => {
  seal = sealPreparationCheckpoint();
}, 30000);
it("真实取得的镇潮印在闭关前可温养，报价和结算一致，结果明确尚未出战", () => {
  const before = structuredClone(seal),
    rows = preparationOpportunities(seal);
  expect(seal).toEqual(before);
  expect(rows.map((r) => r.id)).toEqual(["seal-attune"]);
  const r = rows[0]!;
  expect(r.error).toBe("");
  expect(r.months).toBe(6);
  expect(r.stones).toBe(8);
  const command = { ...r.intent, id: "continuity-seal" };
  const after = dispatch(seal, command);
  expect(after.outerSea.attuned).toBe(true);
  expect(after.month - seal.month).toBe(r.months);
  expect(seal.stones - after.stones).toBe(r.stones);
  expect(after.treasures.artifacts).not.toContain("tideSeal");
  expect(dispatch(after, command)).toBe(after);
  expect(dispatch(seal, command)).toEqual(after);
  expect(validState(after)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(after)))).toEqual(after);
  const receipt = actionReceipt(seal, after, r.intent)!;
  expect(receipt.title).toBe("镇潮印 · 温养已成");
  expect(receipt.notes[0]).toContain("尚未出战");
  expect(receipt.equipment?.id).toBe("tideSeal");
  expect(receipt.notes.join(" ")).not.toContain("开炉筹备");
  expect(new Set(receipt.notes).size).toBe(receipt.notes.length);
  expect(preparationOpportunities(after).map((r) => r.id)).toEqual([
    "deploy-tideSeal",
  ]);
});
it("没有所得不预告未来宝物；事件锁定、缺钱和跨地点均不能绕过原规则", () => {
  const s = structuredClone(seal);
  s.outerSea.seal = false;
  expect(preparationOpportunities(s)).toEqual([]);
  s.outerSea.seal = true;
  s.stones = 0;
  const r = preparationOpportunities(s)[0]!;
  expect(r.error).not.toBe("");
  expect(dispatch(s, { ...r.intent, id: "poor" })).toBe(s);
  s.status = "dead";
  expect(preparationOpportunities(s)).toEqual([]);
  expect(equipmentMilestone(seal, seal)).toBeNull();
  const clone = structuredClone(seal);
  clone.month++;
  expect(equipmentMilestone(seal, clone)).toBeNull();
});
it("真实争胚至温养、装配、试罡：战中无结果弹层，保存后才展示里程碑", () => {
  const p = goldenCompletionPlayer(artifactGrowthCheckpoint());
  p.work(60);
  p.herbs(6);
  p.send({
    type: "artifactGrowth",
    action: { kind: "claim", preparation: "herbs" },
  });
  let last = p.state;
  while (p.state.itemGrowth.golden.duel) {
    const before = p.state;
    const intent = {
      type: "artifactGrowth",
      action: {
        kind: "move",
        move: (["guard", "strike", "discern"] as const)[
          (p.state as State).itemGrowth.golden.duel!.turn % 3
        ]!,
      },
    } as const;
    p.send(intent);
    last = before;
    if (p.state.itemGrowth.golden.duel)
      expect(actionReceipt(before, p.state, intent)).toBeNull();
  }
  expect(p.state.itemGrowth.golden.blade).toBe("embryo");
  expect(equipmentMilestone(last, p.state)?.title).toContain("剑胚入手");
  p.work(24);
  const r = preparationOpportunities(p.state).find(
    (r) => r.id === "blade-attune",
  )!;
  expect(r.error).toBe("");
  const before = p.state;
  p.send(r.intent);
  expect(equipmentMilestone(before, p.state)?.body).toContain("尚未出战");
  expect(
    preparationOpportunities(p.state).some((r) => r.id === "blade-proof"),
  ).toBe(false);
  for (const item of [
    ...p.state.treasures.artifacts,
    ...p.state.treasures.equipped,
    ...(p.state.journey.equipped ? [p.state.journey.equipped] : []),
  ])
    p.send({ type: "treasure", action: { kind: "withdraw", item } });
  const deploy = preparationOpportunities(p.state).find(
    (r) => r.id === "deploy-tideBlade",
  )!;
  expect(deploy.error).toBe("");
  p.send(deploy.intent);
  const proof = preparationOpportunities(p.state).find(
    (r) => r.id === "blade-proof",
  )!;
  expect(proof.error).toBe("");
  expect(proof.months).toBe(artifactQuote(p.state, { kind: "prove" }).months);
  p.send(proof.intent);
  expect(preparationOpportunities(p.state)).toEqual([]);
  while (p.state.itemGrowth.golden.duel) {
    last = p.state;
    p.send({
      type: "artifactGrowth",
      action: {
        kind: "move",
        move: (["guard", "strike", "discern"] as const)[
          (p.state as State).itemGrowth.golden.duel!.turn % 3
        ]!,
      },
    });
  }
  expect(p.state.itemGrowth.golden.proven).toBe(true);
  expect(equipmentMilestone(last, p.state)?.title).toContain("试罡已过");
  expect(
    preparationOpportunities(p.state).some((r) => r.id === "blade-proof"),
  ).toBe(false);
}, 30000);

import { itemGrowthForgeCheckpoint } from "../tools/item-growth-checkpoint";
it("筑基带回器髓后可从闭关前重铸，异地不代办，成果保留原器纹", () => {
  const s = itemGrowthForgeCheckpoint();
  const row = preparationOpportunities(s).find((r) => r.id === "reforge-vial")!;
  expect(row.error).toBe("");
  const before = structuredClone(s);
  const away = structuredClone(s);
  away.foundationJourney.location = "estate";
  const blocked = preparationOpportunities(away).find(
    (r) => r.id === "reforge-vial",
  )!;
  expect(blocked.error).toContain("行前居");
  expect(dispatch(away, { ...blocked.intent, id: "away-forge" })).toBe(away);
  const n = dispatch(s, { ...row.intent, id: "prepared-forge" });
  expect(n.itemGrowth.reforged.vial).toBe(true);
  expect(n.workshop.temper).toEqual(before.workshop.temper);
  expect(preparationOpportunities(n).some((r) => r.id === "reforge-vial")).toBe(
    false,
  );
  expect(equipmentMilestone(s, n)?.body).toContain("守势承伤−2");
});
