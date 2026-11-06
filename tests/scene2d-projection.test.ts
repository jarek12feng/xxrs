import { createCultivator as createGame } from "../tools/cultivator-fixture";
import { expect, it } from "vitest";
import { dispatch, type State } from "../src/core";
import { adventureOptions, type AdventureAction } from "../src/adventure";
import { openingScene } from "../src/scene2d/opening";

const send = (s: State, action: AdventureAction) =>
  dispatch(s, { type: "adventure", action, id: `projection-${s.seen.length}` });

it.each(["medicine", "guide", "ward"] as const)(
  "short actions preserve every full description through %s preparation, failure and rescue",
  (method) => {
    let state = createGame("问道", "wood", 42);
    for (const action of [
      "inspect",
      "depart",
      method,
      "rush",
      "prepare",
      "depart",
      "shortcut",
      "retreat",
      "prepare",
      "depart",
      "trail",
      "challenge",
      "takeHerbs",
    ] as const) {
      const before = structuredClone(state);
      const scene = openingScene(state.adventure);
      const options = scene.objects.flatMap((object) => object.options);
      expect(options.map(({ action, label }) => ({ action, label }))).toEqual(
        expect.arrayContaining(adventureOptions(state.adventure)),
      );
      expect(
        options.every(
          (option) =>
            option.shortLabel.length > 0 && option.shortLabel.length <= 6,
        ),
      ).toBe(true);
      expect(options.some((option) => option.action === action)).toBe(true);
      expect(state).toEqual(before);
      state = send(state, action);
    }
    const ending = openingScene(state.adventure);
    expect(ending.briefResult).not.toBe("");
    expect(state.adventure.result.startsWith(ending.briefResult)).toBe(true);
    expect(state.adventure.result).toContain("获得灵草 4");
    expect(state.month).toBe(0);
  },
);

it("places dialogue portraits on real speakers without using a painted background as a sprite", () => {
  let state = createGame("问道", "wood", 42);
  state = send(send(state, "inspect"), "depart");
  const scene = openingScene(state.adventure);
  const healer = scene.objects.find((object) => object.id === "medicine")!;
  expect(healer).toMatchObject({
    kind: "person",
    speaker: "温蘅",
    portrait: "/art/characters/wenheng.webp",
  });
  expect(healer.art).toBeUndefined();
  const companion = scene.objects.find((object) => object.id === "luchi")!;
  expect(companion).toMatchObject({ kind: "person", speaker: "陆迟", y: 55, foot: {x:67,y:72} });
  expect(scene.objects.find((object) => object.id === "exit")?.kind).toBe(
    "exit",
  );
  expect(
    openingScene(createGame("初见", "wood", 42).adventure).briefResult,
  ).toBe("");
});

it("the rescued worker appears in the world only after rescue, with no new reward actions", () => {
  let state=createGame("救人", "wood",42);
  for(const action of ['inspect','depart','medicine','prepare','depart','trail'] as const) state=send(state,action);
  expect(openingScene(state.adventure).objects.some(o=>o.id==='worker')).toBe(false);
  state=send(state,'challenge');
  const worker=openingScene(state.adventure).objects.find(o=>o.id==='worker');
  expect(worker?.kind).toBe('person');expect(worker?.options).toEqual([]);
  expect(openingScene(JSON.parse(JSON.stringify(state.adventure))).objects.find(o=>o.id==='worker')).toEqual(worker);
});
