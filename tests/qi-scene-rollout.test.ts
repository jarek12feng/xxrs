import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App } from "vue";
import RoadPanel from "../src/RoadPanel.vue";
import MistPanel from "../src/MistPanel.vue";
import QiJourneyPanel from "../src/qi-journey/QiJourneyPanel.vue";

import { mistCheckpoint } from "../tools/mist-checkpoint";
let app: App;
afterEach(() => { app?.unmount(); document.body.innerHTML = ""; });
const select = async (id: string) => {
  document.querySelector<HTMLButtonElement>(`[data-hotspot="${id}"]`)!.click();
  await nextTick();
};
it("opening road objects is read-only and a commitment keeps its cost and irreversible consequence", async () => {
  const game = mistCheckpoint(42, "wood", "male", true), act = vi.fn();
  const before = JSON.stringify(game);
  app = createApp(RoadPanel, { game, busy: false, onAct: act });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.querySelector('[aria-label="行路与准备操作区"]')).toBeNull();
  await select("objects");
  expect(act).not.toHaveBeenCalled(); expect(JSON.stringify(game)).toBe(before);
  expect(document.body.textContent).toContain("归路建成后不能改选");
  expect(document.body.textContent).toContain("灵草");
  const observe = [...document.querySelectorAll("button")].find(b => b.textContent?.includes("观察："))!;
  observe.click(); await nextTick();
  expect(act).toHaveBeenCalledTimes(1);
  // No parent-persisted replacement means no premature prepared/result state.
  expect(game.adventure.road.prepared).toBe("none");
  expect(JSON.stringify(game)).toBe(before);
});
it("mist scene keeps entry costs and failure consequences at the actual array before dispatch", async () => {
  const game = mistCheckpoint(), act = vi.fn();
  Object.assign(game.adventure.mist, { stage: "gate", garden: true, vow: "steady", partner: "solo" });
  app = createApp(MistPanel, { game, busy: false, onAct: act });
  app.mount(document.body.appendChild(document.createElement("div")));
  await select("object");
  expect(act).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain("失败安全撤回");
  expect(document.body.textContent).toContain("失败伤势 +1");
  expect(document.body.textContent).toContain("本次灵石 −");
});
it("a loaded qi battle exposes responses and withdrawal without opening a hotspot", () => {
  const game = createGame("试炼", "wood");
  game.qi = 120; game.qiJourney.node = 1;
  game.qiJourney.duel = { hp: 30, enemy: 30, turn: 0, effect: "none" };
  app = createApp(QiJourneyPanel, { game, busy: true });
  app.mount(document.body.appendChild(document.createElement("div")));
  const buttons = [...document.querySelectorAll("button")];
  for (const label of ["守势化劲", "破绽反击", "凝神辨影", "撤回山下"]) {
    const button = buttons.find(b => b.textContent?.includes(label));
    expect(button).toBeDefined(); expect(button!.disabled).toBe(true);
  }
});
it("药谷护药实战保留药谷地点，不误入下一阶段凝元内府", () => {
  const game = createGame("护药地点", "wood");
  game.qi = 256; game.qiJourney.gates = 1;
  game.qiJourney.trial = "medicine"; game.qiJourney.route = "medicine";
  game.qiJourney.node = 1;
  game.qiJourney.duel = { hp: 51, enemy: 90, turn: 0, effect: "none" };
  app = createApp(QiJourneyPanel, { game, busy: false });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.querySelector('.narrative-stage h2')?.textContent).toBe("药谷采药径");
});
