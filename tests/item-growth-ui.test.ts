import { itemGrowthForgeCheckpoint } from "../tools/item-growth-checkpoint";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, validState, migrateSave, type Intent } from "../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import InventoryPanel from "../src/InventoryPanel.vue";
it("真实现场热点与按钮完成取戒，读档接续同一禁制，背包显示戒与载荷", async () => {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  p.fight("well");
  const state = shallowRef(p.state),
    view = shallowRef("scene"),
    host = document.createElement("div");
  document.body.append(host);
  let serial = 0;
  const mount = () =>
    createApp({
      render: () =>
        h(view.value === "scene" ? FoundationPanel : InventoryPanel, {
          game: state.value,
          busy: false,
          onAct: (intent: Intent) => {
            state.value = dispatch(state.value, {
              ...intent,
              id: `cache-ui-${++serial}`,
            });
            expect(validState(state.value)).toBe(true);
          },
        }),
    });
  let app = mount();
  app.mount(host);
  const click = async (text: string) => {
    const button = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    );
    expect(button, host.textContent ?? "").toBeTruthy();
    expect(button!.disabled).toBe(false);
    button!.click();
    await nextTick();
  };
  try {
    const before = structuredClone(state.value);
    await click("侧室石匣");
    expect(state.value).toEqual(before);
    await click("查看石匣铭文");
    expect(state.value.itemGrowth.discovered).toBe(true);
    // The command-built checkpoint has enough trained sense for the actual offered preparation.
    await click("以神识定阵");
    await click("辨读外环");
    state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
    app.unmount();
    app = mount();
    app.mount(host);
    await nextTick();
    expect(host.textContent).toContain("暗流回卷");
    await click("托住阵脚");
    await click("探入取戒");
    expect(state.value.itemGrowth.ring).toBe(1);
    await click("沉纹器髓 · 余2块");
    await click("将一块器髓收入容器");
    expect(state.value.itemGrowth.ore).toBe(1);
    // Importing another earned save must close the old local chamber inspector.
    state.value = itemGrowthForgeCheckpoint();
    await nextTick();
    expect(host.querySelector('[aria-label="沉井侧室 · 前人遗物"]')).toBeNull();
    expect(host.textContent).toContain("听松行前居");
    view.value = "inventory";
    await nextTick();
    expect(host.textContent).toContain("栖尘戒");
    expect(host.textContent).toContain("大件载荷 2 / 4");
    expect(
      host.querySelector('img[src="/art/item-growth/relic-ring.webp"]'),
    ).not.toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
