import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { expect, it } from "vitest";
import { dispatch } from "../src/core";
import { storyRoute, storyLocation } from "../src/wayfaring/story-routes";
import { foundationArrivalPoint } from "../src/foundation-journey/scene-approach";
import { outerSeaCheckpoint } from "../tools/outer-sea-checkpoint";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { seaQuote } from "../src/outer-sea/rules";
import { conclaveQuote } from "../src/conclave/rules";
it("nearby routes name distinct sites, never charge a month or grant observation progress", () => {
  let s = createGame("寻路", "wood");
  s = dispatch(s, { id: "inspect", type: "adventure", action: "inspect" });
  for (const action of ["depart", "depart", "trail", "retreat"] as const) {
    const before = structuredClone(s),
      intent = { type: "adventure" as const, action },
      p = storyRoute(s, intent)!;
    expect(p.months).toBe(0);
    expect(p.distance).toBeGreaterThan(0);
    expect(p.error).toBe("");
    expect(s).toEqual(before);
    const n = dispatch(s, { ...intent, id: "step-" + s.seen.length });
    expect(storyLocation(n, p.domain)).toBe(p.to);
    expect(n.month).toBe(s.month);
    s = n;
  }
});
it("sea and conclave map quotes use the actual domain costs and hide unrevealed meeting places", () => {
  const sea = outerSeaCheckpoint(),
    intent = { type: "outerSea" as const, action: { kind: "sail" as const } };
  const p = storyRoute(sea, intent)!;
  expect(p).toMatchObject(seaQuote(sea, intent.action));
  expect(p.distance).toBe(54000);
  expect(p.sites.some((s) => s.id === "court")).toBe(false);
  const meeting = conclaveCheckpoint(),
    visit = { type: "conclave" as const, action: { kind: "visit" as const } };
  expect(storyRoute(meeting, visit)).toMatchObject(
    conclaveQuote(meeting, visit.action),
  );
  expect(
    storyRoute(meeting, {
      type: "conclave",
      action: { kind: "training", style: "ward" },
    }),
  ).toBeNull();
});
it("arrival feet reflect the safe destination entrance without changing rule coordinates", () => {
  expect(foundationArrivalPoint("ferry", "home")).toEqual({ x: 82, y: 88 });
  expect(foundationArrivalPoint("home", "ferry")).toEqual({ x: 24, y: 88 });
  expect(foundationArrivalPoint("snow", "estate")).toEqual({ x: 18, y: 86 });
});
