import { expect, it } from "vitest";
import { preparationAdvice } from "../src/expedition/presentation";
import { openingGuide } from "../src/opening-guide";
import { actionSound } from "../src/action-sound";
import { expeditionSession } from "../tools/expedition-simulation";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import BattleStage from "../src/expedition/BattleStage.vue";
it("introduces the small fight before requiring foundation preparation", () => {
  const p = expeditionSession();
  expect(p.state.realm).toBe(0);
  expect(openingGuide(p.state)?.title).toBe("先试山道护送");
  p.send({ type: "expedition", action: "accept" });
  const before = p.state;
  p.send({ type: "expedition", action: "enter" });
  expect(p.state.month).toBe(before.month + 1);
  expect(openingGuide(p.state)).toBeNull();
  p.fight();
  expect(p.state.expedition.cleared).toBe(1);
  expect(p.state.realm).toBe(0);
  expect(openingGuide(p.state)?.title).toContain("两种准备");
});
it("suggests only relevant recovery steps and never mutates state", () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  const state = { ...p.state, stones: 0, injury: 2 };
  const frozen = structuredClone(state);
  const tips = preparationAdvice(state);
  expect(tips.map((x) => x.label)).toEqual([
    "静养一月 · 伤势 −1",
    "劳作一月 · 灵石 +5",
  ]);
  expect(state).toEqual(frozen);
});
it("maps committed results to distinct audio cues", () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  const before = p.state;
  p.send({ type: "expedition", action: "guard" });
  expect(
    actionSound(before, p.state, { type: "expedition", action: "guard" }),
  ).toBe("guard");
  const turn = p.state;
  p.send({ type: "expedition", action: "guard" });
  expect(
    actionSound(turn, p.state, { type: "expedition", action: "guard" }),
  ).toBe("hurt");
});
it("renders different opponents and accessible exact health meters", async () => {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  const html = await renderToString(
    createSSRApp(BattleStage, {
      quest: p.state.expedition,
      foe: "劫药客",
      playerMax: 36,
      enemyMax: 34,
    }),
  );
  expect(html).toContain('data-foe="raider"');
  expect(html).toContain('aria-label="你的气势"');
  expect(html).toContain('max="34"');
  const boss = await renderToString(
    createSSRApp(BattleStage, { quest: p.state.expedition, foe: "蚀阵傀儡" }),
  );
  expect(boss).toContain('class="golem"');
  expect(boss).not.toContain('class="raider"');
});
it("keeps the tutorial fight accessible across both paths and all aptitudes", () => {
  for (const path of ["wood", "sword"] as const)
    for (const aptitude of ["sturdy", "insightful", "perceptive"] as const) {
      const p = expeditionSession(42, path, aptitude);
      p.send({ type: "expedition", action: "accept" });
      p.send({ type: "expedition", action: "enter" });
      p.fight();
      expect(p.state.expedition.cleared).toBe(1);
      expect(p.state.realm).toBe(0);
      expect(p.state.injury).toBe(0);
    }
});
