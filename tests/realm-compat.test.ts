import { expect, it } from "vitest";
import { createGame } from "../src/core";
import { cultivationMonth, cultivationMonthlyGain, cultivationProjection, realmStageLabel } from "../src/progression";
import { retreatDurations, retreatPlan } from "../src/retreat";
import { readiness } from "../src/combat/game";
import { opponentRealmName, realmPressure } from "../src/realm-pressure";
import { openingGuide } from "../src/opening-guide";
import { growthGoals } from "../src/growth";
import { advancementChanges, advancementPromise } from "../src/recognition/view";
import { heroArt } from "../src/presentation/art";

it("nascent cultivation cannot accrue fractional qi or project an earlier realm target", () => {
  const s = createGame("归来", "wood");
  s.realm = 3;
  s.qi = 360;
  s.conclave.stage = 3;
  s.outerSea.cultivation = 1200;
  s.cultivationRemainder = 239;
  const before = structuredClone(s);
  expect(realmStageLabel(s)).toBe("元婴前期");
  expect(cultivationMonth(s)).toEqual({ gain: 0, remainder: 239 });
  expect(cultivationMonthlyGain(s)).toBe(0);
  expect(cultivationProjection(s, 9999)).toMatchObject({ current: 0, target: 0, batchMonths: 0, monthlyGain: 0, monthsToTarget: null });
  expect(retreatDurations(s)).toEqual([]);
  expect(retreatPlan(s)).toMatchObject({ duration: 0, batchMonths: 0, reachesTarget: false, exitAge: s.age });
  expect(s).toEqual(before);
});

it("nascent strengthens earned combat power and does not reintroduce qi guidance or art", () => {
  const golden = createGame("归来", "wood");
  golden.realm = 2;
  golden.conclave.stage = 3;
  golden.conclave.method = "inherit";
  golden.outerSea.method = "continue";
  golden.adventure.step = "done";
  const nascent = { ...golden, realm: 3 as const };
  const before=readiness(golden),after=readiness(nascent);
  expect(after.hp).toBeGreaterThan(before.hp);
  expect(after.damage).toBeGreaterThan(before.damage);
  expect(after.armor).toBeGreaterThan(before.armor);
  expect(opponentRealmName({ realm: 3, stage: 0 })).toBe("元婴前期");
  expect(realmPressure(nascent, { realm: 2, stage: 3 }).gap).toBe(0);
  expect(openingGuide(nascent)).toBeNull();
  expect(growthGoals(nascent).join(" ")).toContain("元婴初成");
  expect(growthGoals(nascent).join(" ")).not.toMatch(/备齐筑基丹|护送药车|筑基已成/);
  expect(advancementPromise(nascent)).toContain("元婴初成");
  expect(advancementChanges(golden, nascent).join(" ")).toContain("元婴已成");
  expect(heroArt("male", 3)).toBe(heroArt("male", 1));
  expect(heroArt("male", 2)).toBe(heroArt("male", 1));
});

it("golden completion projects the new cultivation cap without a qi fallback", () => {
  const s = createGame("圆满", "wood");
  s.realm = 2;
  s.conclave.stage = 3;
  s.outerSea.cultivation = 1198;
  expect(realmStageLabel(s)).toBe("金丹圆满");
  expect(cultivationProjection(s)).toMatchObject({ current: 1198, target: 1200, missing: 2, bottleneck: false });
});
