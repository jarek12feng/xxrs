import { expect, it } from "vitest";
import { dispatch } from "../src/core";
import {
  evaluateEquipment,
  equipmentTurnEffect,
  loadoutPreview,
} from "../src/equipment";
import { foundationExchange } from "../src/foundation-journey/combat";
import {
  equipmentPayoffAudit,
  payoffFixture,
} from "../tools/equipment-payoff-audit";

it("钟的守后护转与镜的转照只奖励正确换招，未装备、连招、无前招和金丹不误触发", () => {
  for (const id of ["bell", "mirror"] as const) {
    const s = payoffFixture("exit", "breath");
    s.treasures.owned[id] = 1;
    s.treasures.equipped = [id];
    const move = id === "bell" ? "strike" : "discern";
    const sequence = (
      previousMove: "guard" | "strike" | "discern" | "none",
      correct = true,
    ) =>
      evaluateEquipment(s, {
        kind: "turn",
        move,
        correct,
        previousMove,
      }).sources.filter((x) => x.effect === "sequence");
    expect(sequence("guard")).toHaveLength(1);
    expect(sequence("guard", false)).toHaveLength(0);
    expect(sequence("none")).toHaveLength(0);
    expect(sequence(move)).toHaveLength(0);
    expect(
      evaluateEquipment(s, { kind: "turn", move, correct: true }).sources.some(
        (x) => x.effect === "sequence",
      ),
    ).toBe(false);
    s.realm = 2;
    expect(sequence("guard")).toHaveLength(0);
    s.realm = 1;
    s.treasures.equipped = [];
    expect(sequence("guard")).toHaveLength(0);
  }
});
it("钟与镜可同场配合，预览纯净，正确辨影的结算与共享来源一致", () => {
  const s = payoffFixture("rank3", "breath");
  s.sense = 24;
  s.treasures.owned.bell = 1;
  s.treasures.equipped = ["bell", "mirror"];
  s.foundationJourney.duel!.effect = "guard";
  // Find a visible discern window, without assigning an impossible enemy HP.
  for (let turn = 0; turn < 6; turn++) {
    s.foundationJourney.duel!.turn = turn;
    if (foundationExchange(s, "discern")!.correct) break;
  }
  const original = structuredClone(s),
    p = foundationExchange(s, "discern")!;
  expect(p.correct).toBe(true);
  const effect = equipmentTurnEffect(s, "discern", true, "guard");
  expect(effect.note).toContain("镇岳钟余音护转");
  expect(effect.note).toContain("照隙镜转照");
  expect(s).toEqual(original);
  const intent = {
    id: "sequence-settlement",
    type: "foundationJourney",
    action: { kind: "move", move: "discern" },
  } as const;
  const next = dispatch(s, intent);
  expect(next.foundationJourney.duel!.enemy).toBe(
    s.foundationJourney.duel!.enemy - p.damage,
  );
  expect(next.foundationJourney.duel!.hp).toBe(
    s.foundationJourney.duel!.hp - p.incoming + p.healing,
  );
  expect(dispatch(s, intent)).toEqual(next);
  expect(s).toEqual(original);
});
it("换装对照显示衔接条件，避免把基础与衔接增益重复相加", () => {
  const s = payoffFixture("exit", "spring");
  s.treasures.equipped = [];
  expect(loadoutPreview(s, { kind: "deploy", id: "bell" })).toContain(
    "守势后正确反击",
  );
  expect(loadoutPreview(s, { kind: "deploy", id: "bell" })).toContain(
    "不叠加前文",
  );
});
it("五关三套受控构筑，重铸同序列不损失生存且实际存在收益", () => {
  const rows = equipmentPayoffAudit();
  expect(rows).toHaveLength(15);
  for (const r of rows) {
    expect(r.before.won).toBe(true);
    expect(r.after.won).toBe(true);
    expect(r.after.hp).toBeGreaterThanOrEqual(r.before.hp);
    expect(r.after.grass).toBeLessThanOrEqual(r.before.grass);
  }
  expect(rows.some((r) => r.after.hp > r.before.hp)).toBe(true);
  expect(
    rows.some(
      (r) =>
        r.main === "blade" &&
        r.after.rounds.some((p, i) => p.damage > r.before.rounds[i]!.damage),
    ),
  ).toBe(true);
});
