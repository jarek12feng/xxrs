// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App } from "vue";
import WorldAtlas from "../src/WorldAtlas.vue";
import { createGame, type State } from "../src/core";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
function mount(game: State) {
  const select = vi.fn();
  const root = document.createElement("div");
  document.body.append(root);
  app = createApp(WorldAtlas, { game, selected: "valley", onSelect: select });
  app.mount(root);
  return select;
}
it("only selects landmarks without mutating the save and shows future lands as noninteractive", async () => {
  const game = createGame("地图", "wood", 42),
    original = JSON.stringify(game);
  const select = mount(game);
  const buttons = [...document.querySelectorAll("button")];
  expect(buttons).toHaveLength(3);
  expect(buttons[1].textContent).toContain("筑基后探访");
  buttons[1].click();
  await nextTick();
  expect(select).toHaveBeenCalledWith("peak");
  expect(JSON.stringify(game)).toBe(original);
  expect(document.querySelectorAll(".distant")).toHaveLength(3);
  expect(
    document.querySelector(".distant")?.getAttribute("aria-label"),
  ).toContain("尚未开放");
});
it("uses existing realm and story gates and marks completed landmarks", () => {
  const game = createGame("地图", "wood", 42);
  game.realm = 1;
  game.story.stage = "resolved";
  game.journey.maps.valley = 3;
  game.journey.rank = 1;
  mount(game);
  const pins = [...document.querySelectorAll("button")];
  expect(pins[0].textContent).toContain("见闻已全");
  expect(pins[1].getAttribute("aria-label")).toContain("可探索");
  expect(pins[2].getAttribute("aria-label")).toContain("需雾岭航图");
});
