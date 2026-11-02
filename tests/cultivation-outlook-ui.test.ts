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
  initial.limit = 2400;
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

it("offers an explicit bounded retreat with its forecast, emits a command and disables it while busy", async () => {
  const s = createGame("闭关按钮", "wood");
  s.adventure.step = "done";
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.realm = 1;
  s.limit = 2400;
  const busy = shallowRef(false),
    commands: unknown[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(CultivationOutlook, {
        game: s,
        automatic: true,
        busy: busy.value,
        onAct: (c: unknown) => commands.push(c),
      }),
  });
  app.mount(host);
  try {
    const button = host.querySelector<HTMLButtonElement>(".retreat-start")!;
    expect(button.textContent).toContain("闭关 2 年");
    expect(button.textContent).toContain("预计修为 +4");
    expect(host.textContent).toContain("出关年龄 18 年");
    expect(host.textContent).toContain("不消耗灵石、丹药");
    button.click();
    expect(commands).toEqual([
      { type: "advance", activity: "cultivate", months: 24 },
    ]);
    busy.value = true;
    await nextTick();
    expect(button.disabled).toBe(true);
    button.click();
    expect(commands).toHaveLength(1);
    expect(s.month).toBe(0);
  } finally {
    app.unmount();
  }
});

it("changing duration is free and previews the selected years before starting", async () => {
  const s = createGame("选择闭关", "wood");
  s.adventure.step = "done";
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.realm = 1;
  s.limit = 2400;
  const before = structuredClone(s),
    commands: unknown[] = [];
  const host = document.createElement("div");
  const app = createApp(CultivationOutlook, {
    game: s,
    automatic: true,
    onAct: (c: unknown) => commands.push(c),
  });
  app.mount(host);
  try {
    const select = host.querySelector("select")!;
    select.value = "long";
    select.dispatchEvent(new Event("change"));
    await nextTick();
    expect(host.textContent).toContain("出关年龄 21 年");
    expect(host.textContent).toContain("剩余寿元 179 年");
    expect(commands).toEqual([]);
    expect(s).toEqual(before);
    host.querySelector<HTMLButtonElement>(".retreat-start")!.click();
    expect(commands).toEqual([
      { type: "advance", activity: "cultivate", months: 60 },
    ]);
  } finally {
    app.unmount();
  }
});
