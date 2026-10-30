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
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("button.atlas-pin"),
  ];
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
  const pins = [
    ...document.querySelectorAll<HTMLButtonElement>("button.atlas-pin"),
  ];
  expect(pins[0].textContent).toContain("见闻已全");
  expect(pins[1].getAttribute("aria-label")).toContain("可探索");
  expect(pins[2].getAttribute("aria-label")).toContain("需雾岭航图");
});

it("the compact landmark list selects the same place without travel or save mutation", async () => {
  const game = createGame("列表", "wood", 42);
  const before = structuredClone(game);
  const select = mount(game);
  const items =
    document.querySelectorAll<HTMLButtonElement>(".atlas-list button");
  expect(items).toHaveLength(3);
  items[1]!.click();
  await nextTick();
  expect(select).toHaveBeenCalledWith("peak");
  expect(game).toEqual(before);
});

it("reveals current-world geography without pretending distant lands are open or discovering another world", () => {
  const game = createGame("初入山", "wood", 42);
  const before = structuredClone(game);
  const select = mount(game);
  expect(document.querySelector("h3")?.textContent).toBe("青玄界 · 本界全图");
  const catalogue = document.querySelector(".atlas-regions")!;
  expect(catalogue.textContent).toContain("听松山及山下药路");
  expect(catalogue.textContent).toContain("青嶂关与云栈");
  expect(catalogue.textContent).toContain("雾岭与雾海");
  expect(catalogue.querySelectorAll("article")).toHaveLength(6);
  expect(catalogue.querySelectorAll("button")).toHaveLength(0);
  expect(catalogue.textContent).toContain("仙境”是地名");
  expect(document.querySelector(".atlas-boundary")?.textContent).toContain(
    "发现新的界域",
  );
  expect(select).not.toHaveBeenCalled();
  expect(game).toEqual(before);
});

it("story mode shows fixed future landmarks as selectable previews without inventing travel", async () => {
  const game = createGame("地理", "wood", 42),
    before = structuredClone(game);
  const selectStory = vi.fn();
  app = createApp(WorldAtlas, {
    game,
    selected: "valley",
    story: true,
    selectedStory: "ferry",
    onSelectStory: selectStory,
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  const gate = [
    ...document.querySelectorAll<HTMLButtonElement>("button.atlas-pin"),
  ].find((b) => b.textContent?.includes("雾海回声阵"))!;
  expect(gate.getAttribute("aria-label")).toContain("循线索开启");
  gate.click();
  await nextTick();
  expect(selectStory).toHaveBeenCalledWith("gate");
  expect(game).toEqual(before);
  expect(
    document.querySelectorAll(".story-atlas button.atlas-pin"),
  ).toHaveLength(14);
});
