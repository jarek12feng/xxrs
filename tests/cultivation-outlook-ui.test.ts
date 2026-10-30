// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import { createGame } from "../src/core";
import CultivationOutlook from "../src/CultivationOutlook.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import {
  cultivationMonthlyGain,
  cultivationProjection,
  formatLifeMonths,
} from "../src/cultivation";
import { challenges } from "../src/foundation-journey/content";

it("shows actual life-adjusted gains and changes from a forecast to an explicit lifetime warning", async () => {
  const initial = createGame("试修", "wood", 42);
  initial.realm = 1;
  const state = shallowRef(initial);
  const host = document.createElement("div");
  const app = createApp({
    render: () => h(CultivationOutlook, { game: state.value, months: 3 }),
  });
  app.mount(host);
  try {
    const forecast = cultivationProjection(initial);
    expect(host.textContent).toContain(
      `下月吐纳实际 +${cultivationMonthlyGain(initial)}`,
    );
    expect(host.textContent).toContain(
      `预计需 ${formatLifeMonths(forecast.monthsToTarget!)}`,
    );
    expect(host.textContent).toContain("本次最长 3 月");
    expect(host.querySelector('[role="status"]')).toBeNull();
    state.value = { ...initial, age: initial.limit - 2 };
    await nextTick();
    expect(host.textContent).toContain("寿尽前无法达到");
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      "第 2 月寿尽",
    );
    expect(host.textContent).toContain("当月不再获得收益");
    expect(initial.age).toBe(192);
  } finally {
    app.unmount();
  }
});

it("puts opponent realm pressure and solo restrictions next to combat choices", () => {
  const s = createGame("试剑", "sword", 42);
  s.realm = 1;
  s.foundationJourney.duel = {
    ruleset: 2,
    id: "rank2",
    turn: 0,
    enemy: challenges.rank2.hp,
    hp: 50,
    effect: "none",
    aid: false,
  };
  const before = structuredClone(s);
  const host = document.createElement("div");
  const app = createApp(FoundationPanel, {
    game: s,
    busy: false,
    mode: "board",
  });
  app.mount(host);
  try {
    expect(host.textContent).toContain("筑基中期");
    expect(host.textContent).toContain("尚无越阶机缘");
    expect(host.textContent).toContain("本场独自应战");
    expect(s).toEqual(before);
  } finally {
    app.unmount();
  }
});
