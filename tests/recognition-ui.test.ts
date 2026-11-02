// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import RecognitionPanel from "../src/recognition/RecognitionPanel.vue";
import { dispatch, type Intent } from "../src/core";
import { mistCheckpoint } from "../tools/mist-checkpoint";
it("offers appointments, records actual work and lets the player leave the office", async () => {
  const initial = mistCheckpoint();
  initial.journey.branch = "dan";
  initial.herbs = 30;
  const state = shallowRef(initial);
  let id = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(RecognitionPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `ui-role-${++id}`,
          });
        },
      }),
  });
  app.mount(host);
  const click = async (text: string) => {
    const b = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    )!;
    expect(b, text).toBeTruthy();
    expect(b.disabled).toBe(false);
    b.click();
    await nextTick();
  };
  try {
    await click("回山受录内门");
    expect(host.textContent).toContain("内门弟子");
    await click("接受护药领队之职");
    const before = state.value.stones;
    await click("备药稳行");
    expect(state.value.stones).toBeGreaterThan(before);
    expect(host.textContent).toContain("旧路已熟");
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      "灵石 +",
    );
    await click("交还行牌");
    expect(host.textContent).toContain("内门弟子 · 未任职");
    expect(
      [...host.querySelectorAll("button")]
        .filter((b) => b.textContent?.includes("备药稳行"))
        .every((b) => b.disabled),
    ).toBe(true);
  } finally {
    app.unmount();
  }
});
