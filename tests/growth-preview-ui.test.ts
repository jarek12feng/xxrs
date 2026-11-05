import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import InventoryPanel from "../src/InventoryPanel.vue";
import InjuryImpact from "../src/InjuryImpact.vue";
import { dispatch, type Intent } from "../src/core";
it("selecting equipment is read-only; equipping refreshes the comparison", async () => {
  const s = createGame("试装", "wood", 42);
  s.journey.relics.sword = s.journey.relics.vial = 1;
  s.journey.equipped = "vial";
  const state = shallowRef(s),
    host = document.createElement("div");
  let calls = 0;
  const app = createApp({
    render: () =>
      h(InventoryPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `equip-${++calls}`,
          });
        },
      }),
  });
  app.mount(host);
  try {
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent?.includes("听松灵剑"))!
      .click();
    await nextTick();
    expect(calls).toBe(0);
    expect(host.textContent).toContain("不生效");
    expect(host.textContent).toContain("交锋基础伤害");
    const equip = [
      ...host.querySelectorAll<HTMLButtonElement>(".item-detail button"),
    ].find((b) => b.textContent?.trim() === "装备")!;
    equip.click();
    await nextTick();
    expect(calls).toBe(1);
    expect(state.value.journey.equipped).toBe("sword");
    expect(host.textContent).toContain("当前已装备");
  } finally {
    app.unmount();
  }
});
it("injury actions honor locks and disappear after actual healing", async () => {
  const s = createGame("养伤", "wood", 42);
  s.injury = 2;
  s.growth.medicines.healing = 1;
  const state = shallowRef(s),
    busy = shallowRef(true),
    host = document.createElement("div");
  let calls = 0;
  const app = createApp({
    render: () =>
      h(InjuryImpact, {
        game: state.value,
        busy: busy.value,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `heal-${++calls}`,
          });
        },
      }),
  });
  app.mount(host);
  try {
    expect([...host.querySelectorAll("button")].every((b) => b.disabled)).toBe(
      true,
    );
    busy.value = false;
    await nextTick();
    expect(host.textContent).toContain("不恢复正在交锋中的气势");
    [...host.querySelectorAll("button")]
      .find((b) => b.textContent?.includes("服回春散"))!
      .click();
    await nextTick();
    expect(calls).toBe(1);
    expect(state.value.injury).toBe(0);
    expect(host.querySelector('[aria-label="伤势影响"]')).toBeNull();
  } finally {
    app.unmount();
  }
});
