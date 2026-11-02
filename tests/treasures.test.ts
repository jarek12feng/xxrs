import { describe, it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type State,
} from "../src/core";
import { treasureQuote, type TreasureAction } from "../src/treasures/rules";
import { treasureIds, bookIds, type Treasure } from "../src/treasures/catalog";
import { temperEffect } from "../src/workshop/combat";
function ready(seed = 823) {
  const s = createGame("争宝", "wood", seed);
  s.month = 4;
  s.age = 196;
  s.story.stage = "waiting";
  s.qi = 120;
  s.stones = 200;
  s.herbs = 30;
  return s;
}
function act(s: State, action: TreasureAction, id = `t-${s.seen.length}`) {
  return dispatch(s, { type: "treasure", action, id });
}
function catalog(s = ready()) {
  return act(s, { kind: "catalog", venue: "market" });
}
function enter(s = catalog()) {
  return act(act(s, { kind: "budget", value: 100 }), { kind: "enter" });
}
describe("宝物与有境界限制的拍卖", () => {
  it("境界条件在命令层生效，目录抽取符合当前阶段且种子可重放", () => {
    const low = createGame("早", "wood");
    expect(act(low, { kind: "catalog", venue: "market" })).toBe(low);
    const s = ready();
    expect(act(s, { kind: "catalog", venue: "foundation" })).toBe(s);
    const a = catalog(s);
    expect(a).toEqual(catalog(s));
    expect(a.seed).not.toBe(s.seed);
    expect(validState(a)).toBe(true);
    expect(a.treasures.auction!.lots[0].item).not.toBe("mirror");
    expect(migrateSave(a)).toEqual(a);
    expect(act(a, { kind: "catalog", venue: "market" })).toBe(a);
  });
  it("二十个种子有不同目录；不抽已持有器物、已学功法或满神识丹药", () => {
    const lists = new Set<string>();
    for (let i = 1; i <= 20; i++) {
      const s = ready(i);
      s.treasures.owned.bell = 1;
      s.journey.known = ["blade", "spring", "breath", "guard", "herb"];
      s.sense = 12;
      const a = catalog(s);
      expect(a.treasures.auction!.lots[0].item).toBe("cord");
      expect(a.treasures.auction!.lots[2].item).toBe("lantern");
      expect(a.treasures.auction!.lots[1].item).not.toBe("clarity");
      lists.add(JSON.stringify(a.treasures.auction!.lots));
      expect(validState(a)).toBe(true);
    }
    expect(lists.size).toBeGreaterThan(1);
  });
  it("预算、余额拒绝不推进；仅落槌扣费，三种拍品实际到账、重发不重复", () => {
    let s = enter();
    const start = s.stones;
    const first = s.treasures.auction!.lots[0].item as Treasure;
    s = act(s, { kind: "budget", value: 0 });
    expect(act(s, { kind: "bid" })).toBe(s);
    s = act(s, { kind: "budget", value: 100 });
    const poor = { ...s, stones: 0 };
    expect(act(poor, { kind: "bid" })).toBe(poor);
    const original = structuredClone(s);
    let replay = structuredClone(s);
    for (let i = 0; i < 50 && !s.treasures.auction!.closed; i++) {
      const id = `bid-${i}`;
      const n = act(s, { kind: "bid" }, id);
      expect(n).not.toBe(s);
      expect(validState(n)).toBe(true);
      expect(act(n, { kind: "bid" }, id)).toBe(n);
      s = n;
      replay = act(replay, { kind: "bid" }, id);
    }
    expect(s).toEqual(replay);
    expect(s.treasures.auction!.closed).toBe(true);
    expect(s.stones).toBe(
      start - s.treasures.auction!.lots.reduce((a, l) => a + l.paid, 0),
    );
    expect(s.treasures.owned[first]).toBe(1);
    expect(s.treasures.equipped).toBeNull();
    expect(s.journey.known).toContain(original.treasures.auction!.lots[2].item);
    const drug = original.treasures.auction!.lots[1].item;
    expect(
      drug === "ward"
        ? s.workshop.ward
        : s.growth.medicines[drug as "healing" | "clarity"],
    ).toBe(1);
  });
  it("放弃、退出保留拍品且不重复扣费；不可即时刷新下一场", () => {
    let s = enter();
    const stones = s.stones;
    s = act(s, { kind: "pass" });
    expect(s.stones).toBe(stones);
    expect(s.treasures.auction!.index).toBe(1);
    s = act(s, { kind: "leave" });
    expect(validState(s)).toBe(true);
    expect(s.stones).toBe(stones);
    expect(act(s, { kind: "leave" })).toBe(s);
    expect(act(s, { kind: "catalog", venue: "market" })).toBe(s);
    s.month = s.treasures.nextMonth;
    s.age = 192 + s.month;
    expect(
      act(s, { kind: "catalog", venue: "market" }).treasures.auction!.closed,
    ).toBe(false);
  });
  it("目录期间能筹资，入场后其他行动冻结直到离场", () => {
    const s = catalog();
    const n = dispatch(s, {
      id: "work",
      type: "advance",
      activity: "work",
      months: 1,
    });
    expect(n.month).toBe(s.month + 1);
    expect(n.treasures).toEqual(s.treasures);
    const a = enter(n);
    expect(
      dispatch(a, {
        id: "work2",
        type: "advance",
        activity: "work",
        months: 1,
      }),
    ).toBe(a);
    const b = act(a, { kind: "leave" });
    expect(
      dispatch(b, {
        id: "work3",
        type: "advance",
        activity: "work",
        months: 1,
      }),
    ).not.toBe(b);
  });
  it.each(["commission", "enter"] as const)(
    "%s 在剧情和寿尽时先中断，不扣费用或重抽目录",
    (kind) => {
      for (const death of [false, true]) {
        let s = catalog();
        s.month = 11;
        s.age = death ? s.limit - 1 : 203;
        const seed = s.seed;
        const n = act(s, kind === "enter" ? { kind } : { kind, item: "bell" });
        expect(n.month).toBe(12);
        expect(n.stones).toBe(s.stones);
        expect(n.treasures.owned.bell).toBe(0);
        expect(n.treasures.auction!.entered).toBe(false);
        expect(n.seed).toBe(seed);
        expect(validState(n)).toBe(true);
      }
    },
  );
  it("辅器改变对应招式、可卸下、精炼一次，炼气不可驾驭照隙镜", () => {
    const s = ready();
    expect(act(s, { kind: "commission", item: "mirror" })).toBe(s);
    expect(act(s, { kind: "refine", item: "bell" })).toBe(s);
    let n = act(s, { kind: "commission", item: "bell" });
    expect(n.stones).toBe(s.stones - 28);
    expect(validState(n)).toBe(true);
    expect(temperEffect(n, "guard", true).incoming).toBe(0);
    n = act(n, { kind: "equip", item: "bell" });
    expect(temperEffect(n, "guard", true).incoming).toBe(-2);
    expect(temperEffect(n, "strike", true).damage).toBe(-1);
    n = act(n, { kind: "unequip" });
    expect(temperEffect(n, "guard", true).incoming).toBe(0);
    n.realm = 1;
    n.workshop.iron = 1;
    n = act(n, { kind: "refine", item: "bell" });
    expect(n.treasures.owned.bell).toBe(2);
    expect(n.workshop.iron).toBe(0);
    expect(act(n, { kind: "refine", item: "bell" })).toBe(n);
    for (const item of treasureIds) {
      n.treasures.owned[item] = 2;
      n.treasures.equipped = item;
      const effect = temperEffect(
        n,
        item === "bell" ? "guard" : item === "cord" ? "strike" : "discern",
        true,
      );
      expect(item === "mirror" ? effect.damage : effect.incoming).toBe(
        item === "mirror" ? 3 : -3,
      );
    }
    expect(temperEffect(n, "discern", false).damage).toBe(0);
  });
  it("事件、死亡、交锋期间不能操作；非法领域存档拒绝", () => {
    for (const change of [
      (s: State) => {
        s.status = "dead";
      },
      (s: State) => {
        s.qiJourney.node = 1;
      },
      (s: State) => {
        s.pending = { id: "x", kind: "letter" };
      },
    ]) {
      const s = ready();
      change(s);
      expect(act(s, { kind: "commission", item: "bell" })).toBe(s);
    }
    const s = enter();
    const broken = structuredClone(s);
    broken.treasures.auction!.lots[0].paid = 99;
    expect(validState(broken)).toBe(false);
    const missing = structuredClone(s);
    missing.treasures.equipped = "bell";
    expect(validState(missing)).toBe(false);
    expect(() => migrateSave({ ...s, version: 999 })).toThrow();
    const old = { ...ready(), version: 26 };
    delete (old as Partial<State>).treasures;
    const migrated = migrateSave(old);
    expect(migrated.version).toBe(30);
    expect(migrated.treasures.auction).toBeNull();
    expect(validState(migrated)).toBe(true);
  });
});

it("对手不能超出既定预算加价，玩家出价追平其预算即可落槌", () => {
  let s = enter();
  const l = s.treasures.auction!.lots[0];
  l.rival = l.opening;
  s = act(s, { kind: "bid" });
  expect(s.treasures.auction!.lots[0].result).toBe("won");
  expect(s.treasures.auction!.lots[0].paid).toBe(l.opening);
  expect(validState(s)).toBe(true);
});

it('三辅器进入共用交锋结算，未装配不生效，正确辨影才加伤',async()=>{
  const {tacticalExchange}=await import('../src/expedition/combat');
  const {qiSites}=await import('../src/qi-journey/content');
  const s=ready();s.realm=1;
  const enemy={...qiSites[0].enemies[0],hp:1000,attack:50};
  for(const [item,move,turn,damage,incoming] of [['bell','guard',0,0,-2],['cord','strike',1,-1,-2],['mirror','discern',2,2,0]] as const){
    const n=structuredClone(s);n.treasures.owned[item]=1;n.treasures.equipped=item;
    const duel={hp:100,enemy:1000,turn};const a=tacticalExchange(s,move,enemy,duel,'none')!,b=tacticalExchange(n,move,enemy,duel,'none')!;
    expect(b.damage-a.damage).toBe(damage);expect(b.incoming-a.incoming).toBe(incoming);
    n.treasures.equipped=null;expect(tacticalExchange(n,move,enemy,duel,'none')).toEqual(a);
  }
});
