// @vitest-environment happy-dom
import { createApp, h, nextTick } from "vue";
import { expect, it } from "vitest";
import StoryScenes from "../src/scene2d/StoryScenes.vue";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { gameAudioScene } from "../src/audio-scene";
import type { StoryChapter } from "../src/scene2d/story-routing";
it("reports rendered chapter changes without commands or save mutation", async () => {
  localStorage.clear();
  const game = journeyCheckpoint();
  game.foundationJourney.location = "home";
  game.adventure.road.stage = "pass";
  const saved = JSON.stringify(game),
    scenes: StoryChapter[] = [],
    actions: unknown[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(StoryScenes, {
        game,
        busy: false,
        showRoad: true,
        entryChapter: "foundation",
        onScene: (c: StoryChapter) => scenes.push(c),
        onAct: (a: unknown) => actions.push(a),
      }),
  });
  app.mount(host);
  try {
    expect(scenes.at(-1)).toBe("foundation");
    const road = [
      ...host.querySelectorAll<HTMLButtonElement>(".story-chapters button"),
    ].find((b) => b.textContent?.includes("青嶂旧路"));
    expect(road).toBeTruthy();
    road!.click();
    await nextTick();
    expect(scenes.at(-1)).toBe("road");
    expect(gameAudioScene(game, "", "青嶂关", scenes.at(-1)).music).toBe(
      "trial",
    );
    expect(actions).toEqual([]);
    expect(JSON.stringify(game)).toBe(saved);
  } finally {
    app.unmount();
    localStorage.clear();
  }
});
