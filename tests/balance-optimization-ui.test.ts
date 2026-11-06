// @vitest-environment happy-dom
import { expect, it } from "vitest";
import { createApp, h, nextTick, ref } from "vue";
import AscensionPanel from "../src/ascension/AscensionPanel.vue";
import { createCultivator } from "../tools/cultivator-fixture";
it("凝丹面板展示同一结算概率，不再把零紊乱显示成无条件必成", async () => {
  const s = createCultivator("凝丹预估", "wood", 42);
  s.realm = 1;
  s.foundation = 24;
  s.journey.main = "spring";
  s.growth.training.spring = 2;
  s.goldenCore.site = "repaired";
  s.ascension = {
    realm: 1,
    step: 3,
    strain: 0,
    history: ["引气", "稳脉", "凝聚"],
  };
  const game = ref(s),
    host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () => h(AscensionPanel, { game: game.value, busy: false }),
  });
  try {
    app.mount(host);
    await nextTick();
    expect(host.textContent).toContain("本次把握 93%");
    expect(host.textContent).not.toContain("本次必成");
    game.value.goldenCore.guard = true;
    await nextTick();
    expect(host.textContent).toContain("本次把握 100%");
    game.value.ascension!.strain = 2;
    await nextTick();
    expect(host.textContent).toContain("本次把握 78%");
  } finally {
    app.unmount();
    host.remove();
  }
});
