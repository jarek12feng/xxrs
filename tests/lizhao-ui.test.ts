// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import LizhaoPanel from "../src/lizhao/LizhaoPanel.vue";
import {
  lizhaoFixture,
  lizhaoTick,
  chooseLizhaoMove,
} from "../tools/lizhao-fixture";
import { runLizhao } from "../src/lizhao/rules";
import type { Intent } from "../src/core";
it("热点只读，现场命令结算准备与战斗，刷新后从保存战况继续", async () => {
  const state = shallowRef(lizhaoFixture());
  state.value = runLizhao(state.value, { kind: "visit" }, "visit", lizhaoTick);
  const host = document.createElement("div");
  document.body.append(host);
  let serial = 0;
  const app = createApp({
    render: () =>
      h(LizhaoPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          if (intent.type === "lizhao")
            state.value = runLizhao(
              state.value,
              intent.action,
              `ui-${++serial}`,
              lizhaoTick,
            );
        },
      }),
  });
  app.mount(host);
  const click = async (label: string) => {
    const b = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(label),
    );
    expect(b, label).toBeTruthy();
    expect(b!.disabled).toBe(false);
    b!.click();
    await nextTick();
  };
  try {
    const before = JSON.stringify(state.value);
    await click("药船修士与分药台");
    expect(JSON.stringify(state.value)).toBe(before);
    await click("独立勘探");
    await click("药囊与静养处");
    await click("准备净药囊");
    expect(state.value.lizhao.preparation).toBe("purify");
    await click("前方道路");
    await click("踏上分潮石道");
    await click("前方道路");
    await click("应对分潮禁阵");
    expect(host.querySelector(".combat-bar")).toBeTruthy();
    expect(host.textContent).toContain("积毒");
    expect(host.textContent).toContain("材料与已开道路保留");
    const move = chooseLizhaoMove(state.value);
    await click(
      { guard: "守势护丹", strike: "破枢反击", discern: "辨影排毒" }[move],
    );
    expect(state.value.lizhao.duel?.turn).toBe(1);
    state.value = JSON.parse(JSON.stringify(state.value));
    await nextTick();
    expect(host.textContent).toContain("第 2 合");
    await click("撤回港口");
    expect(state.value.lizhao.location).toBe("harbor");
    expect(host.querySelector(".combat-bar")).toBeNull();
  } finally {
    app.unmount();
    host.remove();
  }
});
