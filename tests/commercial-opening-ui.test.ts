import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick } from "vue";
import { expect, it } from "vitest";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { openingGuide } from "../src/opening-guide";
import { type Intent } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
it("first earned main technique takes priority over another conversation, without equipping automatically", () => {
  const s = createGame("新玩家", "sword", 2654435761);
  s.adventure.step = "done";
  s.journey.learning.book = true;
  s.journey.known = ["blade"];
  const before = structuredClone(s);
  expect(openingGuide(s)?.action).toBe("skills");
  expect(openingGuide(s)?.label).toBe("装配第一册功法");
  expect(s).toEqual(before);
});
it("the actual panel offers a bounded preparation command and a single homecoming narrative", async () => {
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.fight("culmination");
  p.cultivate(600);
  p.act({ kind: "travel", destination: "home" });
  p.act({ kind: "epilogue" });
  const host = document.body.appendChild(document.createElement("div"));
  const intents: Intent[] = [];
  const app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: p.state,
        busy: false,
        onAct: (a: Intent) => intents.push(a),
      }),
  });
  app.mount(host);
  await nextTick();
  try {
    host
      .querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!
      .click();
    await nextTick();
    expect(host.querySelectorAll('[aria-label="筑基篇尾声"]')).toHaveLength(1);
    expect(host.textContent?.split("你独自走完归流阵")).toHaveLength(2);
    expect(host.textContent).toContain("可在凝丹筹备中争取主药、炼丹并叩关");
    expect(intents).toEqual([]);
  } finally {
    app.unmount();
    host.remove();
  }
});

it("shows future combo effects and lethal risk before emitting a single move command", async () => {
  const p = journeyPlayer(journeyCheckpoint("male", true));
  p.act({ kind: "battle", battle: "culmination" });
  const state = structuredClone(p.state);
  state.foundationJourney.duel!.hp = 1;
  state.journey.support = null;
  state.journey.equipped = null;
  state.foundation = 0;
  state.growth.training.spring = 0;
  state.growth.training.guard = 0;
  state.foundationJourney.rescue = 0;
  state.foundationJourney.growth.steady = "none";
  state.foundationJourney.inheritance = "none";
  const before = structuredClone(state);
  const intents: Intent[] = [];
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: state,
        busy: false,
        onAct: (a: Intent) => intents.push(a),
      }),
  });
  app.mount(host);
  await nextTick();
  try {
    const guard = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("守势化劲"),
    )!;
    expect(guard.textContent).toContain("下合反击伤害 +10");
    expect(guard.textContent).toContain("此招承伤会耗尽气势");
    expect(host.textContent).toContain("同招连用");
    expect(intents).toEqual([]);
    guard.click();
    expect(intents).toEqual([
      { type: "foundationJourney", action: { kind: "move", move: "guard" } },
    ]);
    expect(state).toEqual(before);
  } finally {
    app.unmount();
    host.remove();
  }
});
