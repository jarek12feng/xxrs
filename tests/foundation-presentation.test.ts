// @vitest-environment happy-dom
import { createApp, nextTick, reactive, h } from "vue";
import { expect, it } from "vitest";
import JourneyResult from "../src/foundation-journey/JourneyResult.vue";
import { foundationBattleCue } from "../src/foundation-journey/battle-cues";
import { foundationExchange } from "../src/foundation-journey/combat";
import { challenges } from "../src/foundation-journey/content";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { moves } from "../src/expedition/content";
it("keeps full receipts readable on demand and collapses a new outcome", async () => {
  const data = reactive({
    text: "筑基榜：第三 → 魁首。灵石 +30，清心丹 2 瓶已入袋。对手认下这一场。",
  });
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () => h(JourneyResult, { text: data.text }),
  });
  app.mount(host);
  try {
    expect(host.querySelector('[role="status"]')!.textContent).toBe(
      "筑基榜：第三 → 魁首。",
    );
    const details = host.querySelector("details")!;
    expect(details.open).toBe(false);
    details.open = true;
    expect(details.textContent).toContain("清心丹 2 瓶已入袋");
    expect(details.textContent).toContain("对手认下这一场");
    data.text = "已到无名渡。可以前往沉井。";
    await nextTick();
    expect(host.querySelector("details")!.open).toBe(false);
    expect(host.textContent).not.toContain("清心丹");
  } finally {
    app.unmount();
    host.remove();
  }
});
it("describes every real pattern step, retains opening guidance, and leaves combat and RNG untouched", () => {
  const s = journeyCheckpoint("male", true);
  for (const [id, enemy] of Object.entries(challenges)) {
    for (let turn = 0; turn < enemy.pattern.length * 2; turn++) {
      s.foundationJourney.duel = {
        ruleset: 2,
        id: id as keyof typeof challenges,
        hp: 80,
        enemy: enemy.hp,
        turn,
        effect: "none",
        aid: false,
      };
      const before = structuredClone(s);
      const exchange = Object.keys(moves).map((move) =>
        foundationExchange(s, move as keyof typeof moves),
      );
      const cue = foundationBattleCue(s);
      expect(cue.length).toBeGreaterThan(10);
      expect(cue.includes("初试提示")).toBe(id === "well" || id === "rank1");
      if (id !== "well" && id !== "rank1")
        for (const move of Object.values(moves))
          expect(cue).not.toContain(move);
      expect(s).toEqual(before);
      expect(
        Object.keys(moves).map((move) =>
          foundationExchange(s, move as keyof typeof moves),
        ),
      ).toEqual(exchange);
    }
  }
});
