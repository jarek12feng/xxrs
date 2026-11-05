import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App } from "vue";
import WorldAtlas from "../src/WorldAtlas.vue";
import { type State } from "../src/core";
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
it("only selects landmarks without mutating the save or retaining obsolete geography", async () => {
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
  expect(document.querySelectorAll(".distant")).toHaveLength(0);
  for (const obsolete of ["昆仑雪域", "太虚古墟", "蓬莱仙境"])
    expect(document.body.textContent).not.toContain(obsolete);
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
  expect(catalogue.textContent).not.toContain("青嶂关与云栈");
  expect(catalogue.textContent).not.toContain("雾岭与雾海");
  expect(catalogue.querySelectorAll("article")).toHaveLength(1);
  expect(catalogue.querySelectorAll("button")).toHaveLength(0);
  expect(catalogue.textContent).not.toContain("筑基内陆六地");
  expect(catalogue.textContent).not.toContain("穿云壁与外海");
  expect(catalogue.textContent).not.toContain("随金丹行旅展开");
  expect(document.querySelector(".atlas-boundary")?.textContent).toContain(
    "发现新的界域",
  );
  expect(select).not.toHaveBeenCalled();
  expect(game).toEqual(before);
});

it("story map conceals unknown locations without inventing travel", async () => {
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
  expect(gate).toBeUndefined();
  expect(selectStory).not.toHaveBeenCalled();
  expect(game).toEqual(before);
  expect(document.querySelectorAll(".story-atlas button.atlas-pin")).toHaveLength(1);
});

it('拍卖场所附着在原地点，选中仍只返回原旅行目的地', async () => {
  const { auctionFixture } = await import('../tools/auction-checkpoint');
  const game = auctionFixture();
  const before = structuredClone(game);
  const select = vi.fn();
  app = createApp(WorldAtlas, {game, selected: 'valley', story: true, selectedStory: 'market', onSelectStory: select});
  app.mount(document.body.appendChild(document.createElement('div')));
  const market = [...document.querySelectorAll<HTMLButtonElement>('.atlas-list button')].find(b=>b.textContent?.includes('坊市小拍'))!;
  expect(market).toBeTruthy();
  market.click();
  await nextTick();
  expect(select).toHaveBeenCalledWith('market');
  expect(game).toEqual(before);
});
