import { expect, it } from "vitest";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";
import SceneBackdrop from "../src/SceneBackdrop.vue";
import AdventurePanel from "../src/AdventurePanel.vue";
import RoadPanel from "../src/RoadPanel.vue";
import MistPanel from "../src/MistPanel.vue";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import SocialPanel from "../src/SocialPanel.vue";
import WorldPanel from "../src/WorldPanel.vue";
import { createGame, dispatch, mistScenes, type MistStage } from "../src/core";

it.each(Object.keys(mistScenes).filter((k) => k !== "dormant") as MistStage[])(
  "keeps %s chapter narration separate from touch controls",
  async (stage) => {
    let game = mistCheckpoint();
    game = dispatch(game, {
      id: "scene-letter",
      type: "mist",
      action: "receive",
    });
    game.adventure.mist.stage = stage;
    const html = await renderToString(
      createSSRApp({ render: () => h(MistPanel, { game, busy: false }) }),
    );
    const index = html.indexOf('class="scene-controls"');
    expect(index).toBeGreaterThan(0);
    expect(html.slice(0, index)).toContain(mistScenes[stage].title);
    expect(html.slice(html.indexOf('class="scene-backdrop"'), index)).not.toContain("<button");
    expect(html.slice(index)).toContain("雾海探索操作区");
    expect(html.slice(index)).toContain("<button");
  },
);

it("keeps long narrative and speaker on the artwork without embedding action buttons", async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(SceneBackdrop, {
          image: "/scenes/mist-path.jpg",
          title: "雾林",
          body: "长剧情".repeat(200),
          speaker: "陆迟",
          quote: "等你一起回来",
          headingId: "modal-title",
        }),
    }),
  );
  expect(html).toContain('class="scene-art"');
  expect(html).toContain('class="scene-ink"');
  expect(html).toContain('data-atmosphere="mist"');
  expect(html).toContain('id="modal-title"');
  expect(html).toContain("长剧情".repeat(200));
  expect(html).toContain("等你一起回来");
  expect(html).not.toContain("<button");
});
it.each(["market", "pass"] as const)(
  "shows a distinct %s portrait and separate investigation controls",
  async (stage) => {
    const game = createGame("旅人", "wood");
    game.adventure.step = "done";
    Object.assign(game.adventure.road, {
      stage,
      thanked: true,
      met: true,
      commission: true,
      map: true,
      obstacle: "mist",
    });
    const html = await renderToString(
      createSSRApp({
        render: () => h(RoadPanel, { game, busy: false, running: false }),
      }),
    );
    expect(html).toContain(
      stage === "market"
        ? "/characters/yuqing.jpg"
        : "/characters/qingzhang.jpg",
    );
    const index = html.indexOf('class="scene-controls"');
    expect(html.slice(html.indexOf('class="scene-backdrop"'), index)).not.toContain("<button");
    expect(html.slice(index)).toContain("环顾四周调查区");
    expect(html.slice(index)).toContain(
      stage === "market" ? "药队旧账册" : "石阶上的刻痕",
    );
  },
);
it.each(["opening", "road", "relationship", "arena"] as const)(
  "separates %s narration from accessible operation region",
  async (mode) => {
    const game = createGame("旅人", "wood", 42);
    if (mode === "road") game.adventure.step = "done";
    const panel =
      mode === "opening"
        ? AdventurePanel
        : mode === "road"
          ? RoadPanel
          : SocialPanel;
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(panel as Component, { game, busy: false, running: false, mode }),
      }),
    );
    const index = html.indexOf('class="scene-controls"');
    expect(index).toBeGreaterThan(0);
    expect(html.slice(0, index)).toContain('class="scene-narrative"');
    expect(html.slice(html.indexOf('class="scene-backdrop"'), index)).not.toContain("<button");
    expect(html.slice(index)).toContain("操作区");
    expect(html.slice(index)).toContain("<button");
  },
);
it("opens the main route atlas with a current location and a separate exploration entry", async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(WorldPanel, {
          game: createGame("旅人", "wood"),
          busy: false,
          running: false,
        }),
    }),
  );
  expect(html).toContain("雨夜渡口");
  expect(html).toContain("你在此处");
  expect(html).toContain("主线地标详情");
  expect(html).toContain("道友寻亲");
});
it("puts the required market conversation before optional locked investigation", async () => {
  const game = createGame("旅人", "wood", 42);
  game.adventure.step = "done";
  game.adventure.road.stage = "market";
  game.adventure.road.thanked = true;
  const html = await renderToString(
    createSSRApp({ render: () => h(RoadPanel, { game, busy: false }) }),
  );
  expect(html.indexOf("与行脚人郁青交谈")).toBeGreaterThan(0);
  expect(html.indexOf("与行脚人郁青交谈")).toBeLessThan(
    html.indexOf('aria-label="环顾四周调查区"'),
  );
});
