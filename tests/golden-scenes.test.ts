import { observeTide } from "../tools/outer-sea-checkpoint";
// @vitest-environment happy-dom
import { createApp, h, nextTick } from "vue";
import { expect, it } from "vitest";
import Golden from "../src/golden-core/GoldenCorePanel.vue";
import Sea from "../src/outer-sea/OuterSeaPanel.vue";
import Conclave from "../src/conclave/ConclavePanel.vue";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import { outerSeaCheckpoint } from "../tools/outer-sea-checkpoint";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { clickSceneAction } from "./golden-scene-navigation";
import { dispatch, type Intent } from "../src/core";
it.each([
  ["凝丹", Golden, condensationCheckpoint],
  ["外海", Sea, outerSeaCheckpoint],
  ["诸宗会", Conclave, conclaveCheckpoint],
] as const)(
  "%s对象观察不发命令、不改年月种子资源，收起恢复现场",
  async (_, Panel, checkpoint) => {
    const game = checkpoint();
    const before = JSON.stringify(game);
    const commands: Intent[] = [];
    const host = document.createElement("div");
    const app = createApp({
      render: () =>
        h(Panel, {
          game,
          busy: false,
          onAct: (intent: Intent) => commands.push(intent),
        }),
    });
    app.mount(host);
    try {
      expect(host.querySelector(".narrative-inspector")).toBeNull();
      const points = [
        ...host.querySelectorAll<HTMLButtonElement>("[data-hotspot]"),
      ];
      expect(points.length).toBeGreaterThan(0);
      for (const point of points.filter(p=>p.dataset.hotspot!=="shore"&&p.dataset.hotspot!=="letter"&&p.dataset.hotspot!=="golden-story")) {
        point.click();
        await nextTick();
        expect(host.querySelector(".narrative-inspector")).not.toBeNull();
      }
      host
        .querySelector<HTMLButtonElement>('[aria-label="收起现场操作"]')!
        .click();
      await nextTick();
      expect(host.querySelector(".narrative-inspector")).toBeNull();
      expect(commands).toEqual([]);
      expect(JSON.stringify(game)).toBe(before);
    } finally {
      app.unmount();
    }
  },
);
it("凝丹关键损失与真实报价在行动前显示；busy下不能提交", async () => {
  const game = condensationCheckpoint();
  const commands: Intent[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Golden, {
        game,
        busy: true,
        onAct: (intent: Intent) => commands.push(intent),
      }),
  });
  app.mount(host);
  try {
    host.querySelector<HTMLButtonElement>('[data-hotspot="chamber"]')!.click();
    await nextTick();
    expect(host.textContent).toContain("失败伤势 +2");
    expect(host.textContent).toContain("六个月及已备护持");
    const commandButtons = [
      ...host.querySelectorAll<HTMLButtonElement>(".scene-choice button"),
    ];
    expect(commandButtons.length).toBeGreaterThan(0);
    expect(commandButtons.every((button) => button.disabled)).toBe(true);
    expect(commands).toEqual([]);
  } finally {
    app.unmount();
  }
});
it("恢复遗迹交锋时无需选中对象便能应对并显示来势", async () => {
  let game = outerSeaCheckpoint();
  game.stones += 100;
  game.herbs += 10;
  let serial = 0;
  const run = (action: Extract<Intent, { type: "outerSea" }>["action"]) => {
    game = dispatch(game, {
      type: "outerSea",
      action,
      id: `scene-battle-${++serial}`,
    });
  };
  run({ kind: "sail" });
  run({ kind: "meet" });
  observeTide(intent => { game = dispatch(game, { ...intent, id: `scene-tide-${++serial}` }); });
  run({ kind: "pact", pact: "share" });
  run({ kind: "prepare" });
  run({ kind: "enter" });
  run({ kind: "fight" });
  expect(game.outerSea.duel).not.toBeNull();
  const sent: Intent[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Sea, {
        game,
        busy: false,
        onAct: (intent: Intent) => sent.push(intent),
      }),
  });
  app.mount(host);
  try {
    expect(host.querySelector(".battle-inspector")).not.toBeNull();
    expect(host.textContent).toContain("先辨灵流");
    await clickSceneAction(host, "辨影");
    expect(sent).toEqual([
      { type: "outerSea", action: { kind: "move", move: "discern" } },
    ]);
    expect(game.outerSea.duel!.turn).toBe(0);
  } finally {
    app.unmount();
  }
});
