// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import { createGame, dispatch, type Intent } from "../src/core";
import QiJourneyPanel from "../src/qi-journey/QiJourneyPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";

it("the passage button displays the predicted vigor and submits a real command without consuming supplies", async () => {
  const s = createGame("护脉", "wood");
  s.qi = 240; s.qiJourney.gates = 1; s.qiJourney.node = 2;
  s.qiJourney.route = "array"; s.qiJourney.vigor = 10;
  const state = shallowRef(s), host = document.createElement("div");
  let submitted: Intent | undefined;
  const app = createApp({ render: () => h(QiJourneyPanel, {
    game: state.value, busy: false, onAct: (intent: Intent) => {
      submitted = intent; state.value = dispatch(state.value, { ...intent, id: "ui-passage" });
    },
  }) });
  app.mount(host);
  try {
    [...host.querySelectorAll("button")].find(b => b.textContent?.includes("灵流险地"))!.click();
    await nextTick();
    const button = [...host.querySelectorAll("button")].find(b => b.textContent?.includes("淬脉行气直穿"))!;
    expect(button.disabled).toBe(false); expect(button.textContent).toContain("22");
    button.click(); await nextTick();
    expect(submitted).toEqual({ type: "qiJourney", action: "meridian" });
    expect(state.value.qiJourney.duel!.hp).toBe(22);
    expect(host.textContent).toContain("凝元守台傀儡");
    expect(state.value.herbs).toBe(s.herbs);
  } finally { app.unmount(); }
});
it("snow exposes the time-for-supplies choice and replaces it with onward route choices after preparation", async () => {
  const s = journeyCheckpoint("male", true);
  s.foundationJourney.location = "snow";
  s.foundationJourney.growth.routes.snow = { prepared: false, choice: "", processed: false, revisited: false };
  s.foundationJourney.won = s.foundationJourney.won.filter(id => id !== "deer");
  s.stones = 40;
  const state = shallowRef(s), host = document.createElement("div");
  const app = createApp({ render: () => h(FoundationPanel, {
    game: state.value, busy: false, onAct: (intent: Intent) => {
      state.value = dispatch(state.value, { ...intent, id: "ui-snow" });
    },
  }) });
  app.mount(host);
  try {
    host.querySelector<HTMLButtonElement>('[data-hotspot="prepare"]')!.click();
    await nextTick();
    const button = [...host.querySelectorAll("button")].find(b => b.textContent?.includes("行功御寒"))!;
    expect(button.disabled).toBe(false); expect(button.textContent).toContain("六月");
    button.click(); await nextTick();
    expect(state.value.month - s.month).toBe(6);
    expect(state.value.stones).toBe(38);
    expect(state.value.workshop.ward).toBe(s.workshop.ward);
    host.querySelector<HTMLButtonElement>('[data-hotspot="encounter"]')!.click();
    await nextTick();
    expect(host.textContent).toContain("绕行缓坡");
    expect(host.textContent).toContain("抢过风口");
    expect(host.textContent).not.toContain("行功御寒 ·");
  } finally { app.unmount(); }
});
