import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  breakthroughDetails,
  breakthroughSuccess,
  type State,
} from "../src/core";
import { growthPreview } from "../src/growth-preview";
import { growthComparison, growthPower } from "../src/growth-feedback";
import { actionReceipt } from "../src/action-feedback";
function ready() {
  const s = createGame("对照", "wood", 42);
  s.stones = 100;
  s.herbs = 20;
  s.study = 4;
  s.journey.known = ["spring", "blade", "herb", "guard"];
  s.journey.main = "spring";
  s.journey.support = "herb";
  s.journey.relics.sword = 1;
  s.journey.relics.vial = 1;
  s.journey.equipped = "vial";
  return s;
}
it("equipment preview equals public settlement and preserves every input including RNG", () => {
  for (const realm of [0, 1] as const) {
    const s = ready();
    s.realm = realm;
    s.foundationJourney.cultivation = realm ? 400 : 0;
    const saved = structuredClone(s);
    const preview = growthPreview(s, { kind: "relic", id: "sword" });
    expect(s).toEqual(saved);
    const after = dispatch(s, {
      id: "equip",
      type: "equipRelic",
      relic: "sword",
    });
    expect(after).not.toBe(s);
    expect(preview.lines).toEqual(growthComparison(s, after));
    expect(preview.lines.join()).toContain("+2");
    expect(preview.lines.join()).toContain("−1".replace("−", "-"));
    expect(after.seed).toBe(s.seed);
  }
});
it("training an inactive technique explicitly previews training then equipping", () => {
  const s = ready();
  const saved = structuredClone(s);
  const preview = growthPreview(s, { kind: "training", id: "blade" });
  expect(preview.note).toContain("尚未装配");
  const trained = dispatch(s, {
    id: "train",
    type: "trainTechnique",
    technique: "blade",
  });
  expect(growthPower(trained)).toEqual(growthPower(s));
  const equipped = dispatch(trained, {
    id: "equip",
    type: "equip",
    technique: "blade",
  });
  expect(preview.lines).toEqual(growthComparison(s, equipped));
  expect(preview.lines.join()).toContain("承伤 +2");
  expect(s).toEqual(saved);
});
it("healing honors the HP floor, chance cap and actual medicine settlement", () => {
  for (const injury of [1, 2, 6]) {
    const s = ready();
    s.injury = injury;
    s.growth.medicines.healing = 1;
    const preview = growthPreview(s, { kind: "healing" });
    const after = dispatch(s, {
      id: "heal",
      type: "consume",
      medicine: "healing",
    });
    expect(preview.lines).toEqual(growthComparison(s, after));
    expect(after.injury).toBe(Math.max(0, injury - 2));
    expect(
      actionReceipt(s, after, { type: "consume", medicine: "healing" })?.notes,
    ).toEqual(expect.arrayContaining(preview.lines));
  }
  const s = ready();
  s.foundation = 24;
  s.mastery = 12;
  s.story.luchi = "foundation";
  s.story.trust = 4;
  s.injury = 1;
  expect(breakthroughDetails(s, true).chance).toBe(95);
  expect(growthPreview(s, { kind: "healing" }).lines.join()).not.toContain(
    "突破把握",
  );
});
it("foundation power includes cultivation tiers; injury does not invent damage penalties", () => {
  const s = ready();
  s.realm = 1;
  s.foundationJourney.cultivation = 400;
  const hurt = { ...s, injury: 2 };
  expect(growthPower(hurt).hp).toBe(growthPower(s).hp - 10);
  const lines = growthComparison(s, hurt).join();
  expect(lines).toContain("初始气势");
  expect(lines).not.toContain("伤害");
  expect(lines).not.toContain("突破把握");
});
it("breakthrough projection shares success values without restoring lost lifespan", () => {
  const s = ready();
  s.limit -= 12;
  const next: State = { ...s, ...breakthroughSuccess(s) };
  expect(next.limit).toBe(s.limit + 1200);
  expect(growthPreview(s, { kind: "break" }).lines).toEqual(
    growthComparison(s, next),
  );
  expect(growthPreview(s, { kind: "break" }).note).toContain("199 年");
  expect(growthComparison(s, next).join()).not.toContain("吐纳");
});
it("acquired equipment and techniques do not masquerade as already equipped", () => {
  const s = ready();
  s.journey.known = [];
  s.journey.main = null;
  const learned = dispatch(s, {
    id: "learn",
    type: "learn",
    technique: "blade",
  });
  expect(
    actionReceipt(s, learned, {
      type: "learn",
      technique: "blade",
    })?.notes.join(),
  ).toContain("尚未装配");
  expect(learned.journey.main).toBeNull();
});
it("workshop previews include refinement and conditional engraving tradeoffs", () => {
  const s = ready();
  s.realm = 1;
  s.workshop.iron = 3;
  const saved = structuredClone(s);
  const preview = growthPreview(s, { kind: "refine", id: "vial" });
  const after = dispatch(s, {
    type: "workshop",
    id: "refine",
    order: { product: "vial", method: "craft" },
  });
  expect(after.journey.relics.vial).toBe(2);
  // Isolate the equipment effect from the month spent crafting.
  expect(preview.lines).toEqual(
    growthComparison(s, {
      ...after,
      age: s.age,
      month: s.month,
      cultivationRemainder: s.cultivationRemainder,
    }),
  );
  const temper = growthPreview(s, {
    kind: "temper",
    id: "vial",
    temper: "shell",
  });
  expect(temper.lines.join()).toContain("守势承伤 −3、伤害 −1");
  expect(s).toEqual(saved);
});
it("fractional foundation training gains remain visible before a full point accrues", () => {
  const s = ready();
  s.realm = 1;
  s.growth.training.spring = 1;
  const preview = growthPreview(s, { kind: "training", id: "spring" });
  expect(preview.lines.join()).toContain("零头累计");
  expect(preview.lines.join()).toContain("+0.1");
});
