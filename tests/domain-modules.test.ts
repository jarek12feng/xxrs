import { describe, expect, it } from "vitest";
import {
  applyTechnique,
  grantTechnique,
  techniqueActivityEffect,
  techniqueCombatProfile,
  techniqueCultivationBonus,
  type TechniqueContext,
} from "../src/techniques";
import {
  breakthroughDetails,
  foundationFailure,
  goldenSuccess,
  qiCap,
  goldenCap,
} from "../src/progression";
import { advanceMonths, limitBySchedule, dueDeadlines } from "../src/timeline";
import { seaSchedule } from "../src/outer-sea/calendar";
import { applyDailyMedicine, quoteMedicineUse } from "../src/medicines";
import { settleResources, claimResources } from "../src/economy";
import {
  projectInteractions,
  selectInteraction,
  interactionId,
} from "../src/story-interactions";
function practitioner(): TechniqueContext {
  return {
    realm: 0,
    study: 2,
    stones: 100,
    herbs: 10,
    journey: { known: [], main: null, support: null },
    growth: {
      training: {
        spring: 0,
        blade: 0,
        breath: 0,
        herb: 0,
        guard: 0,
        lantern: 0,
      },
    },
  };
}
describe("technique module", () => {
  it("keeps rewards, tuition and equipping separate and refuses duplicate learning", () => {
    const s = practitioner();
    expect(applyTechnique(s, { kind: "learn", id: "blade" }).error).toBe("");
    expect(s.stones).toBe(80);
    expect(s.study).toBe(2);
    expect(s.journey.main).toBeNull();
    const saved = structuredClone(s);
    expect(applyTechnique(s, { kind: "learn", id: "blade" }).error).not.toBe(
      "",
    );
    expect(s).toEqual(saved);
    expect(grantTechnique(s, "guard")).toBe(true);
    expect(grantTechnique(s, "guard")).toBe(false);
    expect(s.stones).toBe(80);
    applyTechnique(s, { kind: "equip", id: "blade" });
    applyTechnique(s, { kind: "equip", id: "guard" });
    expect(s.journey).toMatchObject({ main: "blade", support: "guard" });
  });
  it("enforces training realm conditions and exposes activity capabilities", () => {
    const s = practitioner();
    grantTechnique(s, "blade");
    applyTechnique(s, { kind: "equip", id: "blade" });
    applyTechnique(s, { kind: "train", id: "blade" });
    expect(s.stones).toBe(88);
    expect(s.herbs).toBe(8);
    expect(applyTechnique(s, { kind: "train", id: "blade" }).error).toContain(
      "筑基",
    );
    expect(techniqueActivityEffect(s, "train").qi).toBe(6);
    s.realm = 1;
    applyTechnique(s, { kind: "train", id: "blade" });
    expect(techniqueCultivationBonus(s)).toBe(1);
    expect(applyTechnique(s, { kind: "train", id: "blade" }).error).toContain(
      "通达",
    );
  });
  it("advanced method switching suspends main combat effects without erasing training", () => {
    const s = {
      ...practitioner(),
      outerSea: { method: "clear" },
      conclave: { method: "none" },
    };
    grantTechnique(s, "blade");
    applyTechnique(s, { kind: "equip", id: "blade" });
    expect(techniqueCombatProfile(s).mainActive).toBe(false);
    s.outerSea.method = "continue";
    expect(techniqueCombatProfile(s).mainActive).toBe(true);
  });
});
describe("progression module", () => {
  it("preserves foundation failure floors and existing lost lifespan", () => {
    expect(
      foundationFailure({ qi: 361, ward: false, injury: 5, limit: 1188 }),
    ).toEqual({ qi: 252, ward: false, injury: 6, limit: 1176 });
    expect(
      foundationFailure({ qi: 361, ward: true, injury: 0, limit: 1188 }),
    ).toEqual({ qi: 324, ward: false, injury: 2, limit: 1188 });
    expect(goldenSuccess({ limit: 2388 })).toMatchObject({
      realm: 2,
      limit: 5988,
      cultivationRemainder: 0,
    });
  });
  it("keeps caps and odds distinct from narrative reward availability", () => {
    expect(qiCap({ realm: 0, qiJourney: { gates: 0 } })).toBe(239);
    expect(qiCap({ realm: 0, qiJourney: { gates: 1 } })).toBe(359);
    expect(goldenCap({ conclave: { stage: 2 } })).toBe(899);
    expect(
      breakthroughDetails(
        {
          foundation: 100,
          mastery: 20,
          injury: 0,
          story: { luchi: "foundation", trust: 6 },
        },
        true,
      ).chance,
    ).toBe(95);
  });
});
describe("monthly schedule", () => {
  it("stops on the exact event month, even when it was the final planned month", () => {
    const start = { month: 0, alive: true };
    const result = advanceMonths(start, 3, {
      tick: (s) => ({ ...s, month: s.month + 1 }),
      interrupt: (s) => (s.month === 3 ? "letter" : ""),
    });
    expect(result).toMatchObject({
      elapsed: 3,
      remaining: 0,
      stopped: true,
      reason: "letter",
    });
    expect(start.month).toBe(0);
  });
  it("does not tick a blocked state, and rejects invalid durations", () => {
    const policy = { tick: (s: number) => s + 1, interrupt: () => "dead" };
    expect(advanceMonths(0, 10, policy)).toMatchObject({
      state: 0,
      elapsed: 0,
      remaining: 10,
      stopped: true,
    });
    expect(() => advanceMonths(0, -1, policy)).toThrow();
    expect(advanceMonths(0, 0, policy).stopped).toBe(false);
  });
  it("uses the same deadline in forecasts and due-event detection", () => {
    const events = seaSchedule({ outerSea: { notice: 100, reminded: false } });
    expect(limitBySchedule(695, 120, events)).toMatchObject({
      months: 5,
      event: { id: "conclave", month: 700 },
    });
    expect(dueDeadlines(699, events)).toEqual([]);
    expect(dueDeadlines(700, events)).toHaveLength(1);
    expect(
      limitBySchedule(
        695,
        120,
        seaSchedule({ outerSea: { notice: 100, reminded: true } }),
      ).months,
    ).toBe(120);
  });
});
describe("medicine usage", () => {
  it("caps healing and respects cooldown only for clarity", () => {
    const s = {
      month: 10,
      injury: 1,
      sense: 11,
      growth: {
        medicines: { healing: 1, clarity: 2 },
        lastMedicineMonth: null as number | null,
      },
    };
    expect(applyDailyMedicine(s, "healing").healed).toBe(1);
    expect(s.injury).toBe(0);
    expect(applyDailyMedicine(s, "clarity").sense).toBe(1);
    expect(s.sense).toBe(12);
    const saved = structuredClone(s);
    expect(applyDailyMedicine(s, "clarity").error).toContain("药性未散");
    expect(s).toEqual(saved);
    s.month = 13;
    s.sense = 10;
    expect(applyDailyMedicine(s, "clarity").sense).toBe(2);
  });
  it("does not turn breakthrough pills or passage medicine into ordinary healing", () => {
    expect(
      quoteMedicineUse("ward", { scene: "daily", count: 1, month: 0 }).consumed,
    ).toBe(0);
    expect(
      quoteMedicineUse("ward", {
        scene: "between-battles",
        count: 1,
        month: 0,
      }),
    ).toMatchObject({ recovery: 26, consumed: 1, remaining: 0 });
    expect(
      quoteMedicineUse("foundation", {
        scene: "foundation-breakthrough",
        count: 1,
        month: 0,
      }),
    ).toMatchObject({ remaining: 0, healed: 0, sense: 0 });
    expect(
      quoteMedicineUse("goldenCore", {
        scene: "golden-breakthrough",
        count: 0,
        month: 0,
      }).consumed,
    ).toBe(0);
  });
});
describe("atomic resource settlement", () => {
  it("checks all costs before changing any resource; rewards cannot fund entry", () => {
    const s = { stones: 10, herbs: 1 };
    expect(settleResources(s, { stones: 8, herbs: 2 }).error).not.toBe("");
    expect(s).toEqual({ stones: 10, herbs: 1 });
    expect(settleResources(s, { stones: 11 }, { stones: 20 }).error).not.toBe(
      "",
    );
    expect(s.stones).toBe(10);
    expect(
      settleResources(s, { stones: 8, herbs: 1 }, { stones: 3 }).error,
    ).toBe("");
    expect(s).toEqual({ stones: 5, herbs: 0 });
  });
  it("rejects negative costs, overflow and an already claimed chapter reward", () => {
    const s = { stones: 1e9, herbs: 1 };
    expect(settleResources(s, { herbs: -1 }).error).not.toBe("");
    expect(settleResources(s, {}, { stones: 1 }).error).not.toBe("");
    expect(claimResources(s, true, { herbs: 2 }).error).not.toBe("");
    expect(s.herbs).toBe(1);
  });
});
describe("story interaction protocol", () => {
  it("uses stable action identity and recalculates stale permissions", () => {
    const specs = [
      { label: "修复灵地", action: { kind: "site", site: "repaired" } },
    ];
    const quote = (
      s: { stones: number },
      a: { kind: string; site: string },
    ) => ({ error: s.stones < 8 ? "缺少灵石" : "", stones: 8, months: 1 });
    const offers = projectInteractions({ stones: 8 }, specs, quote);
    expect(offers[0]).toMatchObject({
      available: true,
      cost: { stones: 8 },
      months: 1,
    });
    expect(interactionId({ site: "repaired", kind: "site" })).toBe(
      offers[0]!.id,
    );
    expect(
      selectInteraction({ stones: 0 }, specs, offers[0]!.id, quote),
    ).toEqual({ error: "缺少灵石", action: null });
    expect(
      selectInteraction({ stones: 8 }, [], offers[0]!.id, quote).action,
    ).toBeNull();
  });
});
