// @vitest-environment happy-dom
import { it, expect } from "vitest";
import { createApp, h, shallowRef, nextTick } from "vue";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import { dispatch, validState, type Intent } from "../src/core";
import TideSurveyPanel from "../src/tide-survey/TideSurveyPanel.vue";
it("侧廊面板展示成本风险，经公共命令行动后禁止本期重复", async () => {
  const s = goldenLateCheckpoint(),
    at = Math.ceil(s.month / 120) * 120;
  s.age += at - s.month;
  s.month = at;
  s.injury = 0;
  const state = shallowRef(s),
    host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(TideSurveyPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, { ...intent, id: "tide-ui" });
        },
      }),
  });
  app.mount(host);
  try {
    expect(host.textContent).toContain("神识24");
    expect(host.textContent).toContain("灵石6");
    const button = host.querySelector("button")!;
    expect(button.disabled).toBe(false);
    button.click();
    await nextTick();
    expect(validState(state.value)).toBe(true);
    expect(host.querySelector("button")!.disabled).toBe(true);
    expect(host.textContent).toContain("本次潮隙已经探过");
  } finally {
    app.unmount();
  }
}, 30000);
