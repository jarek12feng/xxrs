// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import CompanionshipPanel from "../src/companionship/CompanionshipPanel.vue";
import { createGame, type Intent } from "../src/core";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";

it("world objects reveal only their actions, observing is free, and moving to another place closes the inspector", async () => {
  const initial = journeyCheckpoint("male", true);
  initial.foundationJourney.location = "snow";
  initial.foundationJourney.growth.routes.snow = {
    prepared: false,
    choice: "",
    processed: false,
    revisited: false,
  };
  initial.foundationJourney.won = initial.foundationJourney.won.filter(
    (id) => id !== "deer",
  );
  const state = shallowRef(initial),
    before = structuredClone(initial),
    commands: Intent[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: state.value,
        busy: false,
        onAct: (i: Intent) => commands.push(i),
      }),
  });
  app.mount(host);
  const select = async (id: string) => {
    host.querySelector<HTMLButtonElement>(`[data-hotspot="${id}"]`)!.click();
    await nextTick();
  };
  try {
    expect(host.querySelector('[aria-label="现场操作"]')).toBeNull();
    expect(host.textContent).not.toContain("行功御寒 ·");
    await select("prepare");
    expect(host.textContent).toContain("行功御寒");
    expect(host.textContent).toContain("六月");
    expect(host.querySelector('[aria-label="筑基行旅地点"]')).toBeNull();
    await select("road");
    expect(host.querySelector('[aria-label="筑基行旅地点"]')).not.toBeNull();
    expect(host.textContent).not.toContain("行功御寒 ·");
    expect(commands).toEqual([]);
    expect(state.value).toEqual(before);
    state.value = {
      ...initial,
      foundationJourney: { ...initial.foundationJourney, location: "home" },
    };
    await nextTick();
    expect(host.querySelector('[aria-label="现场操作"]')).toBeNull();
  } finally {
    app.unmount();
  }
});

it("companion route keeps material costs and supports preparation without issuing a story command", async () => {
  const state = createGame("归路", "wood", 42);
  state.realm = 1;
  state.companionship.stage = "prepare";
  state.herbs = 8;
  const before = structuredClone(state),
    commands: Intent[] = [];
  let equipment = 0;
  const host = document.createElement("div");
  const app = createApp(CompanionshipPanel, {
    game: state,
    busy: false,
    onAct: (i: Intent) => commands.push(i),
    onEquipment: () => equipment++,
  });
  app.mount(host);
  try {
    expect(host.querySelector('[aria-label="现场操作"]')).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-hotspot="route"]')!.click();
    await nextTick();
    expect(host.textContent).toContain("消耗灵草 4");
    expect(commands).toEqual([]);
    expect(state).toEqual(before);
    host
      .querySelector<HTMLButtonElement>('[data-hotspot="equipment"]')!
      .click();
    await nextTick();
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent?.includes("查看功法装配"))!
      .click();
    expect(equipment).toBe(1);
    expect(commands).toEqual([]);
    expect(state).toEqual(before);
  } finally {
    app.unmount();
  }
});
