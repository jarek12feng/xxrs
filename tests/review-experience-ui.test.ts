// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { afterEach, beforeAll, expect, it } from "vitest";
import { dispatch, type State, type Intent } from "../src/core";
import {
  finishGoldenCompletion,
  goldenLateCheckpoint,
} from "../tools/golden-completion-checkpoint";
import NascentPanel from "../src/nascent-soul/NascentPanel.vue";
import LizhaoPanel from "../src/lizhao/LizhaoPanel.vue";
let checkpoints: Record<string, State>;
beforeAll(() => {
  checkpoints = finishGoldenCompletion(
    goldenLateCheckpoint(),
    "self",
    "marry",
  ).checkpoints;
});
let cleanup = () => {};
afterEach(() => cleanup());
function mount(name: string, lizhao = false, accept = true) {
  const state = shallowRef(structuredClone(checkpoints[name]!));
  const host = document.body.appendChild(document.createElement("div"));
  let id = 0;
  const app = createApp({
    render: () =>
      h(lizhao ? LizhaoPanel : NascentPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          if (accept)
            state.value = dispatch(state.value, {
              ...intent,
              id: `scene-ui-${++id}`,
            });
        },
      }),
  });
  app.mount(host);
  cleanup = () => {
    app.unmount();
    host.remove();
  };
  const click = async (label: string) => {
    const b = [...host.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(label),
    );
    expect(b, label).toBeTruthy();
    expect(b!.disabled, label).toBe(false);
    b!.click();
    await nextTick();
  };
  return { state, host, click };
}
it("独立战斗栏不再生成遮挡面板，鼠标按钮仍派发安全撤退", async () => {
  const { host, state, click } = mount("lizhao-battle", true);
  expect(host.querySelector(".battle-inspector")).toBeNull();
  expect(host.querySelector(".combat-vitals")?.textContent).toContain(
    "守炉傀儡",
  );
  expect(
    host.querySelector(".lizhao-enemy img")?.getAttribute("src"),
  ).toContain("golem");
  await click("撤回港口");
  expect(state.value.lizhao.duel).toBeNull();
  expect(state.value.lizhao.location).toBe("harbor");
});
it("圆满六印从已结算状态派生，重挂载仍保留破印", async () => {
  const { host, state, click } = mount("completion-trial");
  await click("破开禁纹");
  expect(host.querySelectorAll('[data-broken="true"]').length).toBe(
    state.value.nascentSoul.trial!.seals,
  );
  state.value = JSON.parse(JSON.stringify(state.value));
  await nextTick();
  expect(host.querySelectorAll('[data-broken="true"]').length).toBe(
    state.value.nascentSoul.trial!.seals,
  );
});
it("行功演出不在命令被拒绝或未保存时抢先切段", async () => {
  const { host, state, click } = mount("nascent-phase-0", false, false);
  const before = JSON.stringify(state.value);
  await click("循脉导出");
  expect(
    host.querySelector(".practice-world")?.getAttribute("data-phase"),
  ).toBe("0");
  expect(JSON.stringify(state.value)).toBe(before);
});
it("准备现场显示三段征象，动作后才改变丹流阶段", async () => {
  const { host, state, click } = mount("nascent-ready");
  await click("灵地与护持");
  expect(host.querySelectorAll(".channeling-forecast li")).toHaveLength(3);
  state.value = structuredClone(checkpoints["nascent-phase-0"]!);
  await nextTick();
  await click("循脉导出");
  expect(
    host.querySelector(".practice-world")?.getAttribute("data-phase"),
  ).toBe("1");
  expect(host.textContent).toContain("丹瓶收空");
});
it("正式礼只显示保存来客，护渡三步更换现场与舟、护持、路标", async () => {
  const { host, state, click } = mount("nascent");
  await click("庭前礼案与来客");
  await click("稳固半年");
  await click("正式观礼，谢绝新职务");
  expect(host.querySelectorAll(".ceremony-guest")).toHaveLength(
    state.value.nascentSoul.guests.length,
  );
  expect(
    [...host.querySelectorAll(".ceremony-guest img")].map((i) =>
      i.getAttribute("alt"),
    ),
  ).toEqual(state.value.nascentSoul.guests);
  expect(host.querySelector(".ceremony-runner")).not.toBeNull();
  await click("赴古渡潮隙");
  expect(host.querySelector(".survey-boat")).not.toBeNull();
  expect(host.querySelector(".crossing-ward")).toBeNull();
  await click("展开元婴护持");
  expect(host.querySelector(".crossing-ward")).not.toBeNull();
  await click("带测绘队渡过");
  expect(host.querySelector(".shore-marker")).not.toBeNull();
  expect(host.textContent).toContain("本卷内容");
});
