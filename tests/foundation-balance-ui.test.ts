// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { createGame, dispatch, type Intent } from "../src/core";

it("offers herbs without blocking entry, emits the purchase command, and refreshes after settlement", async () => {
  const initial = createGame("行前补给", "wood", 42);
  initial.realm = 1;
  initial.journey.main = "spring";
  initial.foundationJourney.ferry = 1;
  initial.foundationJourney.location = "ferry";
  initial.herbs = 0;
  initial.stones = 12;
  const state = shallowRef(initial);
  const intents: Intent[] = [];
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          intents.push(intent);
          state.value = dispatch(state.value, { ...intent, id: "ui-supplies" });
        },
      }),
  });
  app.mount(host);
  try {
    const buy = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("购灵草 4"),
    )!;
    expect(buy.disabled).toBe(false);
    expect(host.textContent).toContain("不是入场条件");
    const snapshot = structuredClone(initial);
    buy.click();
    await nextTick();
    expect(intents).toEqual([{ type: "supplies" }]);
    expect(initial).toEqual(snapshot);
    expect(state.value.herbs).toBe(4);
    expect(state.value.stones).toBe(4);
    expect(host.textContent).not.toContain("购灵草 4");
  } finally {
    app.unmount();
    host.remove();
  }
});
