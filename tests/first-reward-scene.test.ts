import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, type Intent } from "../src/core";
import Learning from "../src/LearningChoices.vue";
import Practice from "../src/scene2d/FirstPractice.vue";
function rescued() {
  let game = createGame("新学试招", "wood", 42);
  for (const [index, action] of (
    [
      "inspect",
      "depart",
      "medicine",
      "prepare",
      "depart",
      "trail",
      "challenge",
      "return",
    ] as const
  ).entries()) {
    game = dispatch(game, {
      type: "adventure",
      action,
      id: `gift-rescue-${index}`,
    });
  }
  return game;
}
it("谢礼木匣观察不领取；保存回传前不消失，成功后只领取一次", async () => {
  const game = shallowRef(rescued());
  const commands: Intent[] = [];
  let exits = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Learning, {
        game: game.value,
        busy: false,
        standalone: true,
        onAct: (i: Intent) => commands.push(i),
        onClose: () => exits++,
      }),
  });
  app.mount(host);
  try {
    expect(host.querySelector(".narrative-inspector")).toBeNull();
    const before = JSON.stringify(game.value);
    host.querySelector<HTMLButtonElement>('[data-hotspot="book"]')!.click();
    await nextTick();
    expect(commands).toEqual([]);
    expect(JSON.stringify(game.value)).toBe(before);
    const learn = [
      ...host.querySelectorAll<HTMLButtonElement>(".gift-option button"),
    ][1]!;
    expect(learn.textContent).toContain("学会并主修");
    learn.click();
    await nextTick();
    expect(commands).toEqual([
      { type: "learning", choice: "blade", equip: true },
    ]);
    expect(host.querySelector('[data-hotspot="book"]')).not.toBeNull();
    game.value = dispatch(game.value, { ...commands[0]!, id: "gift-accepted" });
    await nextTick();
    expect(game.value.journey.main).toBe("blade");
    expect(host.querySelector('[data-hotspot="book"]')).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-hotspot="exit"]')!.click();
    await nextTick();
    expect(exits).toBe(1);
  } finally {
    app.unmount();
  }
});
it("独立试招直接进入现场，三种招式及退出不修改角色资源或时间", async () => {
  const game = dispatch(rescued(), {
    type: "learning",
    choice: "blade",
    equip: true,
    id: "practice-book",
  });
  const before = JSON.stringify(game);
  let exits = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Practice, {
        game,
        busy: false,
        standalone: true,
        onClose: () => exits++,
      }),
  });
  app.mount(host);
  try {
    expect(host.querySelector(".practice-actors")).not.toBeNull();
    expect(host.textContent).toContain("无奖励");
    for (const button of host.querySelectorAll<HTMLButtonElement>(
      ".practice-moves button",
    )) {
      button.click();
      await nextTick();
      expect(host.querySelector('[role="status"]')?.textContent).toContain("→");
    }
    expect(JSON.stringify(game)).toBe(before);
    host.querySelector<HTMLButtonElement>(".practice-exit")!.click();
    await nextTick();
    expect(exits).toBe(1);
  } finally {
    app.unmount();
  }
});
it("独立试招在busy状态不能启动招式", async () => {
  const game = dispatch(rescued(), {
    type: "learning",
    choice: "spring",
    equip: true,
    id: "practice-busy",
  });
  const host = document.createElement("div");
  const app = createApp({
    render: () => h(Practice, { game, busy: true, standalone: true }),
  });
  app.mount(host);
  try {
    expect(
      [
        ...host.querySelectorAll<HTMLButtonElement>(".practice-moves button"),
      ].every((b) => b.disabled),
    ).toBe(true);
    expect(host.querySelector('[role="status"]')).toBeNull();
  } finally {
    app.unmount();
  }
});
