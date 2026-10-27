import { expect, it } from "vitest";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";
import SceneBackdrop from "../src/SceneBackdrop.vue";
import AdventurePanel from "../src/AdventurePanel.vue";
import RoadPanel from "../src/RoadPanel.vue";
import SocialPanel from "../src/SocialPanel.vue";
import WorldPanel from "../src/WorldPanel.vue";
import { createGame } from "../src/core";

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
  expect(html).toContain('id="modal-title"');
  expect(html).toContain("长剧情".repeat(200));
  expect(html).toContain("等你一起回来");
  expect(html).not.toContain("<button");
});
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
    expect(html.slice(0, index)).not.toContain("<button");
    expect(html.slice(index)).toContain("操作区");
    expect(html.slice(index)).toContain("<button");
  },
);
it("gives every legacy exploration map its own scene and separate actions", async () => {
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
  expect(html.match(/class="scene-art"/g)).toHaveLength(3);
  for (const place of ["回春谷", "雾岭古道", "雾海孤灯"])
    expect(html).toContain(place + "探索操作区");
});
