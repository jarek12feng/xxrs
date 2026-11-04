import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type State,
} from "../src/core";
import {
  equipmentControl,
  applyEquipmentChange,
  previewEquipment,
  evaluateEquipment,
  type EquipmentContext,
} from "../src/equipment";
import { senseLimit, controlCapacity } from "../src/spirit";
import {
  dailyMedicineQuote,
  applyDailyMedicine,
  quoteMedicineUse,
} from "../src/medicines";
import { readiness, tacticalPreview } from "../src/combat/game";
import { workshopQuote } from "../src/workshop/rules";
import { legacyEquipment } from "./legacy-equipment";
import { treasureQuote } from "../src/treasures/rules";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import { seaFoe } from "../src/outer-sea/rules";
import { outerSeaCheckpoint, seaPlayer } from "../tools/outer-sea-checkpoint";

function ready() {
  const s = createGame("御器", "wood", 123);
  Object.assign(s, {
    month: 4,
    age: 196,
    qi: 120,
    stones: 200,
    herbs: 30,
    study: 2,
  });
  s.story.stage = "waiting";
  s.journey.relics.sword = 1;
  s.journey.equipped = "sword";
  s.treasures.owned.bell = s.treasures.owned.cord = 1;
  return s;
}
function gear(): EquipmentContext {
  return {
    ...ready(),
    realm: 2,
    sense: 36,
    outerSea: { attuned: true, seal: true },
    conclave: { attuned: true, depth: 1 },
  };
}
describe("神识成长与御器", () => {
  it("同一凝神命令达到容量门槛后可兼御，拒绝不扣时间或种子", () => {
    let s = ready();
    s = dispatch(s, {
      id: "bell",
      type: "treasure",
      action: { kind: "equip", item: "bell" },
    });
    const snapshot = structuredClone(s);
    expect(equipmentControl(s)).toMatchObject({ used: 4, capacity: 5 });
    expect(
      dispatch(s, {
        id: "cord",
        type: "treasure",
        action: { kind: "equip", item: "cord" },
      }),
    ).toBe(s);
    expect(s).toEqual(snapshot);
    const c = {
      id: "focus",
      type: "advance",
      activity: "meditate",
      months: 3,
    } as const;
    const n = dispatch(s, c);
    expect(n).toEqual(dispatch(s, c));
    expect(n.sense).toBe(6);
    expect(n.month - s.month).toBe(3);
    s = dispatch(n, {
      id: "cord",
      type: "treasure",
      action: { kind: "equip", item: "cord" },
    });
    expect(s.treasures.equipped).toEqual(["bell", "cord"]);
    expect(validState(s)).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const off = dispatch(s, {
      id: "off",
      type: "treasure",
      action: { kind: "withdraw", item: "bell" },
    });
    expect(off.treasures.equipped).toEqual(["cord"]);
    expect(off.month).toBe(s.month);
    expect(
      dispatch(off, {
        id: "off",
        type: "treasure",
        action: { kind: "withdraw", item: "cord" },
      }),
    ).toBe(off);
  });
  it("相同预览与执行承载相同器物，失败预览不污染原数组", () => {
    const s = gear();
    const before = structuredClone(s);
    const changes = [
      { kind: "deploy", id: "tideSeal" },
      { kind: "deploy", id: "spiritPearl" },
    ] as const;
    const p = previewEquipment(s, changes);
    expect(p.error).toBe("");
    expect(equipmentControl(p.next)).toMatchObject({ used: 16, capacity: 16 });
    const n = structuredClone(s);
    for (const change of changes)
      expect(applyEquipmentChange(n, change).error).toBe("");
    expect(p.next).toEqual(n);
    expect(p.after).toEqual(
      evaluateEquipment(n, { kind: "base", includeAttuned: true }),
    );
    expect(s).toEqual(before);
    expect(
      previewEquipment(n, [{ kind: "equip", id: "bell" }]).error,
    ).toContain("容量");
    expect(n.treasures.equipped).toEqual([]);
  });
  it("温养不自动叠加战力；法宝受境界、温养和容量共同约束", () => {
    const s = gear();
    const baseline = evaluateEquipment(s, {
      kind: "base",
      includeAttuned: true,
    });
    s.sense = 3;
    expect(
      applyEquipmentChange(s, { kind: "deploy", id: "tideSeal" }).error,
    ).toContain("容量");
    s.sense = 36;
    s.realm = 1;
    expect(
      applyEquipmentChange(s, { kind: "deploy", id: "tideSeal" }).error,
    ).toContain("金丹");
    s.realm = 2;
    s.outerSea!.attuned = false;
    expect(
      applyEquipmentChange(s, { kind: "deploy", id: "tideSeal" }).error,
    ).toContain("温养");
    s.outerSea!.attuned = true;
    expect(
      applyEquipmentChange(s, { kind: "deploy", id: "tideSeal" }).error,
    ).toBe("");
    const after = evaluateEquipment(s, { kind: "base", includeAttuned: true });
    // Equipping a second item gives up +2/+1 focus, gains the seal's +4/+3.
    expect(after.damage - baseline.damage).toBe(2);
    expect(after.armor - baseline.armor).toBe(2);
  });
  it("神识增量不重复放大旧伤害与概率，多辅器只叠加条件效果", () => {
    const s = ready();
    s.realm = 1;
    s.sense = 12;
    s.treasures.equipped = ["bell", "cord"];
    const before = readiness(s);
    s.sense = 24;
    expect(readiness(s)).toEqual(before);
    expect(
      evaluateEquipment(s, { kind: "turn", move: "strike", correct: true }),
    ).toMatchObject({ damage: -2, incoming: -2 });
    expect(
      evaluateEquipment(s, { kind: "turn", move: "guard", correct: true }),
    ).toMatchObject({ damage: 0, incoming: -2 });
    const p = tacticalPreview(s, {
      encounter: { hp: 100, attack: 10, pattern: ["strike"] },
      battle: { hp: 30, enemy: 100, turn: 0 },
      move: "strike",
      effect: "none",
    });
    expect(p?.damage).toBeGreaterThan(0);
    expect(s.sense).toBe(24);
  });
  it("专御与多器是互斥选择，无器物不获得加成", () => {
    const s = ready();
    s.realm = 1;
    s.sense = 18;
    expect(equipmentControl(s).focused).toBe(true);
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 4,
      armor: 1,
    });
    applyEquipmentChange(s, { kind: "equip", id: "bell" });
    expect(equipmentControl(s).focused).toBe(false);
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 2,
      armor: 0,
    });
    applyEquipmentChange(s, { kind: "unequip", slot: "primary" });
    applyEquipmentChange(s, { kind: "unequip", slot: "auxiliary" });
    expect(evaluateEquipment(s, { kind: "base" })).toMatchObject({
      damage: 0,
      armor: 0,
    });
  });
  it.each([0, 1, 2])("境界 %i 的神识与容量上限集中计算", (realm) => {
    expect(senseLimit(realm)).toBe([12, 24, 48][realm]);
    expect(controlCapacity(senseLimit(realm))).toBe([8, 12, 20][realm]);
  });
  it("神识满境停止，晋阶后可继续；不能越境保存", () => {
    const s = ready();
    s.sense = 12;
    expect(
      dispatch(s, {
        id: "full",
        type: "advance",
        activity: "meditate",
        months: 1,
      }),
    ).toBe(s);
    s.sense = 13;
    expect(validState(s)).toBe(false);
    const gold = outerSeaCheckpoint();
    gold.sense = 47;
    const n = dispatch(gold, {
      id: "gold-spirit",
      type: "advance",
      activity: "meditate",
      months: 12,
    });
    expect(n.sense).toBe(48);
    expect(n.month - gold.month).toBe(1);
    expect(validState(n)).toBe(true);
    const illegal = { ...n, sense: 49 };
    expect(validState(illegal)).toBe(false);
  });
  it("养神丹接入原工坊收支、库存与服用命令，不低价跨境囤药", () => {
    const low = ready();
    expect(
      workshopQuote(low, { product: "spirit", method: "buy" }).error,
    ).toContain("金丹");
    const s = outerSeaCheckpoint();
    s.stones = 200;
    s.herbs = 30;
    s.study = 2;
    s.sense = 24;
    const c = {
      id: "make-spirit",
      type: "workshop",
      order: { product: "spirit", method: "craft" },
    } as const;
    const n = dispatch(s, c);
    expect(n.growth.medicines.spirit).toBe(1);
    expect(n.stones).toBe(s.stones - 18);
    expect(n.herbs).toBe(s.herbs - 6);
    expect(validState(n)).toBe(true);
    expect(dispatch(n, c)).toBe(n);
    const used = dispatch(n, {
      id: "use-spirit",
      type: "consume",
      medicine: "spirit",
    });
    expect(used.sense).toBe(28);
    expect(used.growth.medicines.spirit).toBe(0);
    expect(used.month).toBe(n.month);
    expect(validState(used)).toBe(true);
    s.growth.medicines.spirit = 1e9;
    expect(dispatch(s, c)).toBe(s);
  });
  it("拒绝重器超载、重复装备与伪造法宝存档", () => {
    const s = ready();
    s.treasures.equipped = ["bell", "cord"];
    expect(validState(s)).toBe(false);
    s.sense = 6;
    expect(validState(s)).toBe(true);
    s.treasures.equipped = ["bell", "bell"];
    expect(validState(s)).toBe(false);
    s.treasures.equipped = [];
    s.treasures.artifacts = ["tideSeal"];
    expect(validState(s)).toBe(false);
  });
  it("v34 原档不变，保留装备拥有与选择，不虚构神识或新药", () => {
    const s = ready();
    s.treasures.equipped = ["bell"];
    const { spirit: _, ...medicines } = s.growth.medicines;
    const old = {
      ...s,
      version: 34,
      treasures: legacyEquipment(s),
      growth: { ...s.growth, medicines },
    };
    const before = structuredClone(old);
    const n = migrateSave(old);
    expect(old).toEqual(before);
    expect(n.version).toBe(35);
    expect(n.sense).toBe(s.sense);
    expect(n.treasures.equipped).toEqual(["bell"]);
    expect(n.treasures.artifacts).toEqual([]);
    expect(n.growth.medicines.spirit).toBe(0);
    expect(n.seed).toBe(s.seed);
    expect(() => migrateSave({ ...old, sense: 13 })).toThrow();
    expect(() =>
      migrateSave({
        ...old,
        treasures: { ...old.treasures, equipped: ["bell"] },
      }),
    ).toThrow();
    expect(() => migrateSave({ ...n, version: 999 })).toThrow();
  });
  it.each(["dead", "pending", "battle", "travel"])(
    "%s 期间不能改装或服药",
    (mode) => {
      const s = ready();
      s.growth.medicines.clarity = 1;
      if (mode === "dead") s.status = "dead";
      if (mode === "pending") s.pending = { id: "event", kind: "letter" };
      if (mode === "battle") s.qiJourney.node = 1;
      if (mode === "travel")
        s.wayfaring.passage = {
          route: "sea:home",
          total: 6,
          remaining: 3,
        } as State["wayfaring"]["passage"];
      expect(
        dispatch(s, {
          id: mode,
          type: "treasure",
          action: { kind: "equip", item: "bell" },
        }),
      ).toBe(s);
      expect(
        dispatch(s, { id: mode, type: "consume", medicine: "clarity" }),
      ).toBe(s);
    },
  );
});
describe("养神药报价", () => {
  it.each([
    [0, 11, 1],
    [1, 11, 2],
    [1, 12, 1],
    [1, 23, 1],
  ] as const)("境界 %i 神识 %i 服清心丹增 %i", (realm, sense, gain) => {
    expect(
      quoteMedicineUse("clarity", {
        scene: "daily",
        realm,
        sense,
        count: 1,
        month: 5,
      }).sense,
    ).toBe(gain);
  });
  it("高阶药递减与共同药性间隔，疗伤不受影响", () => {
    const s = {
      realm: 2,
      month: 10,
      sense: 35,
      injury: 2,
      growth: {
        medicines: { healing: 1, clarity: 1, spirit: 3 },
        lastMedicineMonth: null as number | null,
      },
    };
    expect(applyDailyMedicine(s, "spirit").sense).toBe(4);
    expect(dailyMedicineQuote(s, "clarity").error).toContain("药性");
    expect(applyDailyMedicine(s, "healing").healed).toBe(2);
    s.month += 3;
    expect(applyDailyMedicine(s, "spirit").sense).toBe(2);
    s.month += 3;
    s.sense = 47;
    expect(applyDailyMedicine(s, "spirit").sense).toBe(1);
    const before = structuredClone(s);
    expect(applyDailyMedicine(s, "clarity").error).not.toBe("");
    expect(s).toEqual(before);
    expect(
      quoteMedicineUse("clarity", {
        scene: "daily",
        realm: 2,
        sense: 24,
        count: 1,
        month: 10,
      }).error,
    ).toContain("上限");
    expect(
      quoteMedicineUse("spirit", {
        scene: "daily",
        realm: 1,
        sense: 12,
        count: 1,
        month: 10,
      }).error,
    ).toContain("金丹");
  });
});

it("旧档神识不足时收回超载辅器但不丢失器物或赠送成长", () => {
  const s = outerSeaCheckpoint();
  s.sense = 3;
  s.treasures.owned.mirror = 1;
  s.treasures.equipped = ["mirror"];
  const old = { ...s, version: 34, treasures: legacyEquipment(s) };
  const before = structuredClone(old);
  const n = migrateSave(old);
  expect(n.treasures.equipped).toEqual([]);
  expect(n.treasures.owned.mirror).toBe(1);
  expect(n.treasures.last).toContain("暂收回储物袋");
  expect(n.sense).toBe(3);
  expect(n.journey.equipped).toBe(s.journey.equipped);
  expect(old).toEqual(before);
  expect(validState(n)).toBe(true);
});


it("外海与会谷主辅器加工均拒绝，安全处换装仍有效", () => {
  for (const location of ["ferry", "court"] as const) {
    const s = outerSeaCheckpoint();
    if (location === "ferry") s.outerSea.location = "ferry";
    else s.conclave.location = "court";
    s.stones = 200; s.herbs = 30; s.study = 4; s.workshop.iron = 4;
    for (const order of [
      { product: "sword", method: "commission" },
      { product: "vial", method: "commission" },
      { product: "vial", method: "craft" },
      { relic: "vial", temper: "plain", method: "commission" },
    ] as const) {
      expect(workshopQuote(s, order).error).toContain("坊市");
      expect(dispatch(s, { id: "remote", type: "workshop", order })).toBe(s);
    }
    expect(treasureQuote(s, { kind: "commission", item: "bell" }).error).toContain("坊市");
    expect(treasureQuote(s, { kind: "withdraw", item: s.journey.equipped! }).error).toBe("");
    expect(dispatch(s, { id: "off-site", type: "treasure", action: { kind: "withdraw", item: s.journey.equipped! } }).journey.equipped).toBe(null);
  }
});
it("凝丹取药各阶段的装备报价与执行拒绝一致", () => {
  const initial = condensationCheckpoint();
  initial.stones += 100; initial.herbs += 30;
  let s = dispatch(initial, { id: "prep", type: "goldenCore", action: { kind: "prepare" } });
  for (const phase of ["prepared", "path", "won"] as const) {
    // The phase lock must precede all individual ownership/capacity checks.
    s.goldenCore.expedition = phase;
    for (const item of ["vial", "bell", "tideSeal"] as const) {
      const action = { kind: "withdraw", item } as const;
      expect(treasureQuote(s, action).error).toContain("结束历练");
      expect(dispatch(s, { id: `phase-${phase}-${item}`, type: "treasure", action })).toBe(s);
    }
  }
});
it("清心丹后段报价说明完整制作成本与免费凝神替代", () => {
  const s = outerSeaCheckpoint(); s.sense = 12;
  const q = workshopQuote(s, { product: "clarity", method: "craft" });
  expect(q).toMatchObject({ months: 1, stones: 4, herbs: 2 });
  expect(q.effect).toContain("凝神一月同增 1");
});
it("低血量旧战档提示法宝变化，仍可撤退重整并重新出战", () => {
  const p = seaPlayer(outerSeaCheckpoint());
  p.work(100); p.herbs(30);
  for (const action of [{kind:"sail"}, {kind:"meet"}, {kind:"pact",pact:"share"}, {kind:"prepare"}, {kind:"enter"}, {kind:"fight"}] as const)
    p.send({type:"outerSea", action});
  while(p.state.outerSea.duel) {
    const d=p.state.outerSea.duel;
    p.send({type:"outerSea", action:{kind:"move",move:seaFoe(d.depth).pattern[d.turn%3]!}});
  }
  p.send({type:"outerSea",action:{kind:"reward",reward:"seal"}});
  p.send({type:"outerSea",action:{kind:"attune"}});
  while(p.state.outerSea.cultivation<60) p.send({type:"advance",activity:"cultivate",months:12});
  p.send({type:"outerSea",action:{kind:"prepare"}});
  p.send({type:"outerSea",action:{kind:"enter"}});
  p.send({type:"outerSea",action:{kind:"fight"}});
  const old=p.state; old.sense=12; old.outerSea.duel!.hp=1;
  const migrated=migrateSave({...old,version:34,treasures:legacyEquipment(old)});
  expect(migrated.log[0]!.text).toContain("原自动战力加成已停止");
  expect(migrated.treasures.last).toContain("安全处");
  const n=seaPlayer(migrated);
  n.send({type:"outerSea",action:{kind:"withdraw"}});
  n.send({type:"treasure",action:{kind:"withdraw",item:n.state.journey.equipped!}});
  n.send({type:"treasure",action:{kind:"deploy",item:"tideSeal"}});
  expect(n.state.treasures.artifacts).toEqual(["tideSeal"]);
  expect(validState(n.state)).toBe(true);
});
