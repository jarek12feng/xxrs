import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { actionSound } from "../src/action-sound";
import { describe, expect, it } from "vitest";
import {
  dispatch,
  migrateSave,
  validState,
  type State,
  type Intent,
} from "../src/core";
import { workshopQuote, type WorkshopOrder } from "../src/workshop/rules";
import { freshWorkshop } from "../src/workshop/state";
import { passagePlan } from "../src/qi-journey/passage";
import { qiPower, qiPreview } from "../src/qi-journey/rules";
import { foundationStep } from "../tools/foundation-playthrough";
import { expeditionSession } from "../tools/expedition-simulation";
import { tacticalPreview } from "../src/combat/game";
import { qiSites } from "../src/qi-journey/content";
import { actionReceipt } from "../src/action-feedback";
function ready() {
  const s = createGame("炉房验收", "wood", 9087);
  s.month = 4;
  s.age = 196;
  s.story.stage = "waiting";
  s.study = 2;
  s.stones = 200;
  s.herbs = 30;
  s.qi = 120;
  return s;
}
function order(s: State, o: WorkshopOrder, id = "order") {
  return dispatch(s, { id, type: "workshop", order: o });
}
describe("workshop public commands", () => {
  it.each(["craft", "buy", "commission"] as const)(
    "%s gives the same medicine with distinct time, money and knowledge requirements",
    (method) => {
      const s = ready();
      if (method !== "craft") s.study = 0;
      const q = workshopQuote(s, { product: "healing", method });
      const n = order(s, { product: "healing", method });
      expect(n.growth.medicines.healing).toBe(1);
      expect(n.stones).toBe(s.stones - q.stones);
      expect(n.herbs).toBe(s.herbs - q.herbs);
      expect(n.month - s.month).toBe(method === "buy" ? 0 : 1);
      expect(n.age - s.age).toBe(n.month - s.month);
      expect(n.seed).toBe(s.seed);
      expect(validState(n)).toBe(true);
      expect(order(n, { product: "healing", method })).toBe(n);
      expect(order(s, { product: "healing", method })).toEqual(n);
      expect(s.growth.medicines.healing).toBe(0);
    },
  );
  it("legacy forge/brew/refine commands and new orders share settlement and quotes", () => {
    const s = ready();
    s.crafted = 1;
    const pairs: [Intent, WorkshopOrder][] = [
      [
        { type: "forge", relic: "sword" },
        { product: "sword", method: "craft" },
      ],
      [
        { type: "brew", medicine: "clarity" },
        { product: "clarity", method: "craft" },
      ],
      [
        { type: "prepare", kind: "refine" },
        { product: "foundation", method: "craft" },
      ],
    ];
    for (const [old, next] of pairs)
      expect(dispatch(s, { ...old, id: "same" })).toEqual(
        order(s, next, "same"),
      );
    expect(
      order(s, { product: "foundation", method: "commission" }).pills,
    ).toBe(1);
    expect(order(s, { product: "foundation", method: "buy" })).toBe(s);
    s.crafted = 0;
    expect(order(s, { product: "foundation", method: "commission" })).toBe(s);
  });
  it("events and death interrupt before debits; no crafted reward, random roll or automatic choice", () => {
    for (const death of [false, true]) {
      const s = ready();
      s.month = 11;
      s.age = death ? s.limit - 1 : 203;
      const n = order(s, { product: "sword", method: "craft" });
      expect(n.month).toBe(12);
      expect(n.stones).toBe(s.stones);
      expect(n.herbs).toBe(s.herbs);
      expect(n.journey.relics.sword).toBe(0);
      expect(n.seed).toBe(s.seed);
      expect(n.status).toBe(death ? "dead" : "alive");
      expect(
        actionSound(s, n, {
          type: "workshop",
          order: { product: "sword", method: "craft" },
        }),
      ).toBe(death ? "death" : "choice");
      if (!death) expect(n.pending?.kind).toBe("letter");
      expect(order(n, { product: "sword", method: "craft" })).toBe(n);
      expect(validState(n)).toBe(true);
      const receipt = actionReceipt(s, n, { type: "forge", relic: "sword" })!;
      expect(receipt.title).not.toBe("灵器炼成");
    }
    const s = ready();
    s.month = 10;
    s.age = 202;
    s.crafted = 1;
    const n = order(s, { product: "foundation", method: "craft" });
    expect(n.month).toBe(12);
    expect(n.pills).toBe(s.pills);
    expect(n.stones).toBe(s.stones);
  });
  it("blocks all production during interactive and terminal states and with insufficient resources", () => {
    for (const mutate of [
      (s: State) => {
        s.stones = 0;
      },
      (s: State) => {
        s.study = 0;
      },
      (s: State) => {
        s.status = "dead";
      },
      (s: State) => {
        s.status = "complete";
      },
      (s: State) => {
        s.pending = { id: "wait", kind: "meeting" };
      },
      (s: State) => {
        s.qiJourney.node = 2;
      },
      (s: State) => {
        s.foundationJourney.duel = {} as NonNullable<
          State["foundationJourney"]["duel"]
        >;
      },
      (s: State) => {
        s.expedition.duel = { hp: 10, enemy: 10, turn: 0 };
      },
      (s: State) => {
        s.social.arena.duel = {} as NonNullable<
          State["social"]["arena"]["duel"]
        >;
      },
      (s: State) => {
        s.social.scene = {} as NonNullable<State["social"]["scene"]>;
      },
    ]) {
      const s = ready();
      mutate(s);
      expect(order(s, { product: "sword", method: "craft" })).toBe(s);
    }
  });
  it("buys a ward, reaches the real passage and consumes it exactly once, preserving alternative routes", () => {
    let s = createGame("护脉行旅", "wood", 2718);
    const trace: Intent[] = [];
    for (let i = 0; i < 450 && s.qiJourney.node !== 2; i++) {
      let c = foundationStep(s);
      if (
        c.type === "qiJourney" &&
        c.action.startsWith("enter:") &&
        !s.workshop.ward
      ) {
        c =
          s.stones < 26
            ? { type: "advance", activity: "work", months: 1 }
            : { type: "workshop", order: { product: "ward", method: "buy" } };
      }
      trace.push(c);
      s = dispatch(s, { ...c, id: `path${i}` });
      expect(validState(s), JSON.stringify(c)).toBe(true);
    }
    expect(s.qiJourney.node).toBe(2);
    expect(s.workshop.ward).toBe(1);
    const before = structuredClone(s);
    const planned = passagePlan(s, "ward", qiPower(s).hp);
    const n = dispatch(s, { type: "qiJourney", action: "ward", id: "pass" });
    expect(n.qiJourney.duel!.hp).toBe(planned.vigor);
    expect(n.workshop.ward).toBe(0);
    expect(n.injury).toBe(s.injury);
    expect(n.herbs).toBe(s.herbs);
    expect(dispatch(n, { type: "qiJourney", action: "ward", id: "pass" })).toBe(
      n,
    );
    expect(validState(n)).toBe(true);
    expect(s).toEqual(before);
    const low = structuredClone(s);
    low.qiJourney.vigor = 5;
    expect(
      passagePlan(low, "ward", qiPower(low).hp).vigor -
        passagePlan(low, "herbs", qiPower(low).hp).vigor,
    ).toBe(8);
    const poor = structuredClone(s);
    poor.workshop.ward = 0;
    poor.herbs = 0;
    poor.sense = 0;
    expect(
      dispatch(poor, { type: "qiJourney", action: "ward", id: "empty" }),
    ).toBe(poor);
    expect(
      dispatch(poor, { type: "qiJourney", action: "force", id: "escape" })
        .qiJourney.node,
    ).toBe(3);
    let replay = createGame("护脉行旅", "wood", 2718);
    trace.forEach((c, i) => {
      replay = dispatch(replay, { ...c, id: `path${i}` });
    });
    expect(replay).toEqual(s);
    expect(migrateSave(n)).toEqual(n);
  });
  it("engraving is optional, reversible, equipment-specific and changes actual combat tradeoffs", () => {
    const session = expeditionSession(9087, "sword");
    session.prepare();
    let s = session.state;
    s.stones = 200;
    s.herbs = 30;
    s.study = 2;
    if (!s.journey.relics.sword)
      s = order(s, { product: "sword", method: "buy" }, "sword");
    s = dispatch(s, { type: "equipRelic", relic: "sword", id: "equip" });
    s = order(s, { product: "iron", method: "buy" }, "iron");
    const n = order(s, { relic: "sword", temper: "keen", method: "craft" });
    expect(n.workshop.temper.sword).toBe("keen");
    expect(n.workshop.iron).toBe(0);
    expect(validState(n)).toBe(true);
    const enemy = { ...qiSites[0].enemies[0], hp: 1000 };
    const duel = { hp: 40, enemy: 1000, turn: 1 };
    const a = tacticalPreview(s, {
move: "strike",
encounter: enemy,
battle: duel,
effect: "none"
})!;
    const b = tacticalPreview(n, {
move: "strike",
encounter: enemy,
battle: duel,
effect: "none"
})!;
    expect(b.damage - a.damage).toBe(3);
    expect(b.incoming - a.incoming).toBe(1);
    expect(qiPreview(n, "strike")).toBeNull();
    const stocked = order(n, { product: "iron", method: "buy" }, "restock");
    const restored = order(
      stocked,
      { relic: "sword", temper: "plain", method: "commission" },
      "restore",
    );
    expect(restored.workshop.temper.sword).toBe("plain");
    expect(restored.stones).toBe(stocked.stones - 20);
    expect(restored.journey.relics.sword).toBe(s.journey.relics.sword);
    expect(migrateSave(restored)).toEqual(restored);
    expect(order(s, { relic: "sword", temper: "flow", method: "craft" })).toBe(
      s,
    );
  });
  it.each([
    ["sword", "keen", "strike", 1, 3, 1],
    ["sword", "array", "discern", 2, 4, 0],
    ["vial", "shell", "guard", 0, -1, -3],
    ["vial", "flow", "discern", 2, 1, -2],
  ] as const)(
    "%s %s applies only its matching tactic",
    (relic, temper, move, turn, damage, incoming) => {
      const session = expeditionSession(42, "wood");
      session.prepare();
      let s = session.state;
      s.stones = 100;
      s.herbs = 20;
      if (!s.journey.relics[relic])
        s = order(s, { product: relic, method: "buy" }, "weapon");
      s = dispatch(s, { type: "equipRelic", relic, id: "equip-test" });
      s = order(s, { product: "iron", method: "buy" }, "iron-test");
      const n = order(
        s,
        { relic, temper, method: "commission" },
        "temper-test",
      );
      expect(n.workshop.temper[relic]).toBe(temper);
      const enemy = { ...qiSites[0].enemies[0], hp: 1000, attack: 50 };
      const d = { hp: 100, enemy: 1000, turn };
      const a = tacticalPreview(s, {
move: move,
encounter: enemy,
battle: d,
effect: "none"
})!;
      const b = tacticalPreview(n, {
move: move,
encounter: enemy,
battle: d,
effect: "none"
})!;
      expect(b.damage - a.damage).toBe(damage);
      expect(b.incoming - a.incoming).toBe(incoming);
      const unarmed = structuredClone(n);
      unarmed.journey.equipped = null;
      const plainUnarmed = structuredClone(s);
      plainUnarmed.journey.equipped = null;
      expect(tacticalPreview(unarmed, {
move: move,
encounter: enemy,
battle: d,
effect: "none"
})).toEqual(
        tacticalPreview(plainUnarmed, {
move: move,
encounter: enemy,
battle: d,
effect: "none"
}),
      );
    },
  );
  it("interrupted alchemy keeps its queue entry until the product is actually delivered", () => {
    const s = ready();
    s.crafted = 1;
    s.month = 10;
    s.age = 202;
    s.journey.queue = [{ action: "refine", remaining: 1 }];
    const paused = dispatch(s, { type: "queueTick", id: "tick" });
    expect(paused.pending?.kind).toBe("letter");
    expect(paused.pills).toBe(s.pills);
    expect(paused.journey.queue).toEqual(s.journey.queue);
    const answered = dispatch(paused, {
      type: "choose",
      instanceId: paused.pending!.id,
      option: "listen",
      id: "answer",
    });
    const finished = dispatch(answered, {
      type: "queueTick",
      id: "tick-again",
    });
    expect(finished.pills).toBe(s.pills + 1);
    expect(finished.journey.queue).toEqual([]);
    expect(validState(finished)).toBe(true);
  });
  it("rejects cross-category legacy commands instead of interpreting them as a different recipe", () => {
    const s = ready();
    expect(
      dispatch(s, {
        type: "forge",
        relic: "healing" as "sword",
        id: "invalid-forge",
      }),
    ).toBe(s);
    expect(
      dispatch(s, {
        type: "brew",
        medicine: "sword" as "healing",
        id: "invalid-brew",
      }),
    ).toBe(s);
  });
  it("commissioning costs less than buying but more than crafting at the same material price", () => {
    const s = ready();
    for (const product of [
      "healing",
      "clarity",
      "ward",
      "sword",
      "vial",
    ] as const) {
      const plans = (["craft", "commission", "buy"] as const).map((method) =>
        workshopQuote(s, { product, method }),
      );
      const totals = plans.map((p) => p.stones + p.herbs * 2);
      expect(totals[0]).toBeLessThan(totals[1]!);
      expect(totals[1]).toBeLessThan(totals[2]!);
      expect(plans[0]!.study).toBeGreaterThan(0);
      expect(plans[1]!.study).toBe(0);
      expect(plans[1]!.months).toBeGreaterThan(plans[2]!.months);
    }
  });
  it("v20 migration adds no earned materials or engraving and rejects corrupt/future states", () => {
    const s = ready();
    const { workshop: _, ...rest } = s;
    const old = { ...rest, version: 20 };
    const n = migrateSave(old);
    expect(n.workshop).toEqual(freshWorkshop());
    expect(n.seed).toBe(s.seed);
    expect(old).not.toHaveProperty("workshop");
    expect(validState(n)).toBe(true);
    for (const w of [
      undefined,
      { ...n.workshop, iron: -1 },
      { ...n.workshop, ward: 0.5 },
      { ...n.workshop, temper: { sword: "shell", vial: "plain" } },
      { ...n.workshop, temper: { sword: "keen", vial: "plain" } },
    ])
      expect(validState({ ...n, workshop: w })).toBe(false);
    expect(() => migrateSave({ ...n, version: 999 })).toThrow();
  });
});

it.each(["healing", "clarity", "ward", "iron", "foundation"] as const)(
  "rejects %s production atomically at the inventory limit",
  (product) => {
    const s = ready();
    if (product === "foundation") s.pills = 1e9;
    else if (product === "healing" || product === "clarity") s.growth.medicines[product] = 1e9;
    else s.workshop[product] = 1e9;
    if (product === "foundation") s.crafted = 1;
    const purchase = { product, method: product === "foundation" ? "commission" : "buy" } as const;
    expect(workshopQuote(s, purchase).error).toBe("资源超过可保存上限");
    const snapshot = structuredClone(s);
    expect(order(s, purchase)).toBe(s);
    expect(s).toEqual(snapshot);
    if (product === "foundation") s.pills--;
    else if (product === "healing" || product === "clarity") s.growth.medicines[product]--;
    else s.workshop[product]--;
    const n = order(s, purchase);
    expect(n).not.toBe(s);
    expect(n.stones).toBe(s.stones - workshopQuote(s, purchase).stones);
    expect(validState(n)).toBe(true);
  },
);
