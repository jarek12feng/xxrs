import { describe, it, expect } from "vitest";
import {
  dispatch,
  validState,
  migrateSave,
  type State,
  type Intent,
} from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import {
  itemGrowthQuote,
  cachePreview,
  runItemGrowth,
  type ItemGrowthAction,
} from "../src/item-growth/rules";
import { freshItemGrowth, storageProfile } from "../src/item-growth/state";
import { equipmentTurnEffect, previewEquipment } from "../src/equipment";
import { foundationExchange } from "../src/foundation-journey/combat";
import { workshopQuote } from "../src/workshop/rules";
import { SAVE_VERSION } from "../src/save-version";
import { createCultivator } from "../tools/cultivator-fixture";
import { rejectedActionReason } from "../src/action-diagnostics";
let serial = 0;
function beforeCache() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  p.act({ kind: "inherit", technique: "spring" });
  const s = p.state;
  s.sense = 18;
  s.injury = 0;
  s.stones = 200;
  s.workshop.iron = 5;
  return s;
}
function act(s: State, action: ItemGrowthAction) {
  expect(itemGrowthQuote(s, action).error, JSON.stringify(action)).toBe("");
  const n = dispatch(s, {
    id: `cache-${serial++}`,
    type: "itemGrowth",
    action,
  });
  expect(n).not.toBe(s);
  expect(validState(n), JSON.stringify(action)).toBe(true);
  return n;
}
function ring(s = beforeCache()) {
  s = act(s, { kind: "inspect" });
  s = act(s, { kind: "enter", preparation: "sense" });
  for (const move of ["observe", "brace", "reach"] as const)
    s = act(s, { kind: "move", move });
  return s;
}
function home(s: State) {
  const p = journeyPlayer(s);
  p.fight("exit");
  p.act({ kind: "travel", destination: "home" });
  return p.state;
}
describe("遗戒、储物与旧器成长", () => {
  it.each(["sense", "iron"] as const)(
    "经%s准备解禁取得戒指，中途读档和固定种子可重放",
    (preparation) => {
      let s = act(beforeCache(), { kind: "inspect" });
      if (preparation === "iron") s.sense = 3;
      const before = structuredClone(s);
      s = act(s, { kind: "enter", preparation });
      expect(s.month - before.month).toBe(1);
      expect(s.workshop.iron).toBe(
        before.workshop.iron - (preparation === "iron" ? 1 : 0),
      );
      expect(s.seed).toBe(before.seed);
      for (const move of ["observe", "brace", "reach"] as const) {
        const original = structuredClone(s);
        const v = cachePreview(s, move)!;
        expect(s).toEqual(original);
        const cmd = {
          id: `repeat-${serial++}`,
          type: "itemGrowth",
          action: { kind: "move", move },
        } as const;
        const n = dispatch(s, cmd);
        expect(dispatch(s, cmd)).toEqual(n);
        expect(dispatch(n, cmd)).toBe(n);
        if (n.itemGrowth.trial)
          expect(n.itemGrowth.trial.stability).toBe(v.stability);
        s = migrateSave(JSON.parse(JSON.stringify(n)));
        expect(validState(s)).toBe(true);
      }
      expect(s.itemGrowth.ring).toBe(1);
      expect(storageProfile(s.itemGrowth).capacity).toBe(4);
      expect(s.itemGrowth.collected).toBe(0);
      expect(itemGrowthQuote(s, { kind: "enter", preparation }).error).not.toBe(
        "",
      );
    },
  );
  it("强取失败只留普通伤势，撤回不发奖励，静养后能重试", () => {
    let s = act(beforeCache(), { kind: "inspect" });
    s = act(s, { kind: "enter", preparation: "sense" });
    s = act(s, { kind: "move", move: "reach" });
    s = act(s, { kind: "move", move: "reach" });
    expect(s.itemGrowth.trial).toBeNull();
    expect(s.itemGrowth.ring).toBe(0);
    expect(s.injury).toBe(1);
    s = dispatch(s, {
      id: "cache-rest",
      type: "advance",
      activity: "rest",
      months: 1,
    });
    expect(s.injury).toBe(0);
    s = act(s, { kind: "enter", preparation: "iron" });
    s = act(s, { kind: "withdraw" });
    expect(s.itemGrowth.ring).toBe(0);
    expect(s.injury).toBe(0);
    s = act(s, { kind: "enter", preparation: "sense" });
    for (const move of ["observe", "brace", "reach"] as const)
      s = act(s, { kind: "move", move });
    expect(s.itemGrowth.ring).toBe(1);
  });
  it("满载拒绝不消耗或丢失；未取戒可扩容运一块，也能付费封装", () => {
    let s = act(beforeCache(), { kind: "inspect" });
    const snapshot = structuredClone(s);
    expect(
      itemGrowthQuote(s, { kind: "collect", method: "carry" }).error,
    ).toContain("载荷2");
    expect(
      dispatch(s, {
        id: "full",
        type: "itemGrowth",
        action: { kind: "collect", method: "carry" },
      }),
    ).toBe(s);
    expect(s).toEqual(snapshot);
    s = act(s, { kind: "collect", method: "pack" });
    expect(s.itemGrowth.packedOre).toBe(1);
    expect(s.stones).toBe(snapshot.stones - 12);
    expect(storageProfile(s.itemGrowth).used).toBe(0);
    s = home(s);
    s = act(s, { kind: "expand" });
    expect(storageProfile(s.itemGrowth).capacity).toBe(2);
    const p = journeyPlayer(s);
    p.act({ kind: "travel", destination: "ferry" });
    s = act(p.state, { kind: "collect", method: "carry" });
    expect(s.itemGrowth.collected).toBe(2);
    expect(s.itemGrowth.ring).toBe(0);
    expect(storageProfile(s.itemGrowth).used).toBe(2);
    expect(
      itemGrowthQuote(s, { kind: "collect", method: "pack" }).error,
    ).toContain("取尽");
  });
  it.each(["sword", "vial"] as const)(
    "重铸%s保留器纹，只有装备后生效，下一场预览与结算一致",
    (relic) => {
      let s = ring();
      s = act(s, { kind: "collect", method: "carry" });
      s = home(s);
      // Isolate gear configuration; travel, ring and ore were earned through public commands.
      s.journey.relics[relic] = 2;
      s.journey.equipped = relic;
      s.workshop.temper[relic] = "plain";
      const month = s.month,
        stones = s.stones,
        iron = s.workshop.iron;
      const old = equipmentTurnEffect(
        s,
        relic === "sword" ? "strike" : "guard",
        true,
      );
      s = act(s, { kind: "reforge", relic });
      expect(s.month - month).toBe(3);
      expect(s.stones).toBe(stones - 24);
      expect(s.workshop.iron).toBe(iron - 1);
      expect(s.itemGrowth.ore).toBe(0);
      expect(s.journey.relics[relic]).toBe(2);
      const improved = equipmentTurnEffect(
        s,
        relic === "sword" ? "strike" : "guard",
        true,
      );
      expect(improved.damage - old.damage).toBe(relic === "sword" ? 3 : 0);
      expect(improved.incoming - old.incoming).toBe(relic === "vial" ? -2 : 0);
      expect(old.note).not.toContain("重铸：");
      expect(improved.note).toContain(
        relic === "sword" ? "听松灵剑重铸：伤害 +3" : "归元灵瓶重铸：承伤 -2",
      );
      expect(improved.note).toContain("已计入器物修正");
      const unequipped = previewEquipment(s, [
        { kind: "unequip", slot: "primary" },
      ]);
      expect(unequipped.error).toBe("");
      expect(
        equipmentTurnEffect(unequipped.next, "guard", true).note,
      ).not.toContain("重铸：");
      expect(equipmentTurnEffect(unequipped.next, "strike", true).damage).toBe(
        0,
      );
      const p = journeyPlayer(s);
      p.act({ kind: "battle", battle: "rank1" });
      s = p.state;
      expect(s.foundationJourney.duel).not.toBeNull();
      const move = relic === "sword" ? "strike" : "guard";
      const before = s.foundationJourney.duel!;
      const v = foundationExchange(s, move)!;
      const n = dispatch(s, {
        id: `payoff-${relic}`,
        type: "foundationJourney",
        action: { kind: "move", move },
      });
      expect(n.foundationJourney.duel?.enemy).toBe(
        Math.max(0, before.enemy - v.damage),
      );
      expect(validState(n)).toBe(true);
      expect(migrateSave(JSON.parse(JSON.stringify(n)))).toEqual(n);
    },
  );
  it("内层修复联动分念诀与炼丹报价、筹备及实际扣料，突破丹不减料", () => {
    let s = home(ring());
    expect(s.spirit.manual).toBe("learned");
    s.sense = 18;
    const order = { product: "clarity", method: "commission" } as const;
    const before = workshopQuote(s, order);
    s = act(s, { kind: "restore" });
    const after = workshopQuote(s, order);
    expect(after.herbs).toBe(before.herbs - 1);
    expect(after.effect).toContain("节省灵草1");
    expect(storageProfile(s.itemGrowth).capacity).toBe(6);
    const herbs = s.herbs,
      medicine = s.growth.medicines.clarity;
    const n = dispatch(s, { id: "preserved-alchemy", type: "workshop", order });
    expect(n.herbs).toBe(herbs - after.herbs);
    expect(n.growth.medicines.clarity).toBe(medicine + 1);
    expect(n.itemGrowth.ring).toBe(2);
    expect(
      workshopQuote(s, { product: "foundation", method: "commission" }).herbs,
    ).toBe(
      workshopQuote(
        { ...s, itemGrowth: freshItemGrowth() },
        { product: "foundation", method: "commission" },
      ).herbs,
    );
  });
  it("探阵跨域互斥，预览不能导致练功、旅行、换装或重复取材", () => {
    const s = act(act(beforeCache(), { kind: "inspect" }), {
      kind: "enter",
      preparation: "sense",
    });
    const intents: Intent[] = [
      { type: "advance", activity: "work", months: 1 },
      {
        type: "foundationJourney",
        action: { kind: "travel", destination: "home" },
      },
      {
        type: "spirit",
        action: { kind: "enter", source: "well", preparation: "herbs" },
      },
      { type: "treasure", action: { kind: "withdraw", item: "sword" } },
      { type: "itemGrowth", action: { kind: "collect", method: "pack" } },
    ];
    for (const intent of intents) {
      expect(dispatch(s, { ...intent, id: `locked-${serial++}` })).toBe(s);
      expect(rejectedActionReason(s, intent)).not.toBe("");
    }
  });
  it("事件或寿尽中断工期不扣材料，保留旧成果；损坏存档拒绝", () => {
    const s = act(beforeCache(), { kind: "inspect" });
    const old = structuredClone(s);
    const interrupted = runItemGrowth(
      s,
      { kind: "enter", preparation: "iron" },
      "interrupt",
      (x) => ({
        ...x,
        month: x.month + 1,
        pending: {
          id: "test",
          kind: "visit",
          month: x.month + 1,
        } as State["pending"],
      }),
    );
    expect(interrupted.itemGrowth.trial).toBeNull();
    expect(interrupted.workshop.iron).toBe(s.workshop.iron);
    expect(s).toEqual(old);
    s.age = s.limit - 1;
    const dead = dispatch(s, {
      id: "cache-death",
      type: "itemGrowth",
      action: { kind: "enter", preparation: "iron" },
    });
    expect(dead.status).toBe("dead");
    expect(dead.itemGrowth.trial).toBeNull();
    expect(dead.workshop.iron).toBe(s.workshop.iron);
    expect(validState(dead)).toBe(true);
    const forged = createCultivator("假戒", "wood");
    forged.itemGrowth.ring = 1;
    expect(validState(forged)).toBe(false);
  });
  it("43版仅补空域，保留已有入道与剧情，不补戒；未知版本不覆盖", () => {
    const s = ring();
    const old = { ...s, version: 43 } as unknown as Record<string, unknown>;
    delete old.itemGrowth;
    const snapshot = structuredClone(old);
    const n = migrateSave(old);
    expect(n.version).toBe(SAVE_VERSION);
    expect(n.itemGrowth).toEqual(freshItemGrowth());
    expect(n.qiJourney).toEqual(s.qiJourney);
    expect(old).toEqual(snapshot);
    expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
    expect(() => migrateSave({ ...n, version: SAVE_VERSION + 1 })).toThrow();
    const missing = { ...n } as Partial<State>;
    delete missing.itemGrowth;
    expect(validState(missing)).toBe(false);
  });
});
