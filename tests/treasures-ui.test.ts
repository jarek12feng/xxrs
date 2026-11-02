// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type Intent,
} from "../src/core";
import TreasurePanel from "../src/treasures/TreasurePanel.vue";
it("实际按钮完成目录、预算、入场、竞拍、离场与辅器装配；恢复仍是同场", async () => {
  const s = createGame("拍会", "wood", 44);
  s.month = 4;
  s.age = 196;
  s.story.stage = "waiting";
  s.qi = 120;
  s.stones = 200;
  const state = shallowRef(s),
    host = document.createElement("div");
  let serial = 0;
  const app = createApp({
    render: () =>
      h(TreasurePanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `ui-${++serial}`,
          });
          expect(validState(state.value)).toBe(true);
        },
      }),
  });
  app.mount(host);
  const click = async (label: string) => {
    const b = [...host.querySelectorAll("button")].find((x) =>
      x.textContent?.includes(label),
    )!;
    expect(b).toBeTruthy();
    expect(b.disabled).toBe(false);
    b.click();
    await nextTick();
  };
  try {
    expect(
      [...host.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("筑基拍卖"),
      )!.disabled,
    ).toBe(true);
    await click("查看坊市小拍");
    const input = host.querySelector("input")!;
    input.value = "100";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    await click("设定预算");
    await click("赴会");
    const seed = state.value.seed;
    state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
    await nextTick();
    expect(state.value.seed).toBe(seed);
    for (let i = 0; i < 30 && state.value.treasures.auction!.index === 0; i++)
      await click("出价 ");
    expect(state.value.treasures.auction!.lots[0].result).toBe("won");
    await click("离场");
    await click("装配辅器");
    expect(state.value.treasures.equipped).not.toBeNull();
    expect(host.textContent).toContain("已装配");
  } finally {
    app.unmount();
  }
});
