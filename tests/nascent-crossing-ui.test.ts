// @vitest-environment happy-dom
import { beforeAll, afterEach, expect, it } from "vitest";
import { createApp, h, nextTick, shallowRef, type App } from "vue";
import { dispatch, migrateSave, type State, type Intent } from "../src/core";
import NascentPanel from "../src/nascent-soul/NascentPanel.vue";
import { nascentCrossingCheckpoint } from "../tools/nascent-crossing-checkpoint";
let initial: State, app: App;
beforeAll(() => {
  initial = nascentCrossingCheckpoint();
}, 60000);
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
function mount() {
  const state = shallowRef(structuredClone(initial));
  let serial = 0;
  app = createApp({
    render: () =>
      h(NascentPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `cross-ui-${++serial}`,
          });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  return state;
}
async function click(text: string) {
  const b = [...document.querySelectorAll("button")].find((x) =>
    x.textContent?.includes(text),
  );
  expect(b, text).toBeTruthy();
  expect(b!.disabled, text).toBe(false);
  b!.click();
  await nextTick();
}
it("现场对象分别操作主潮、舟队和侧岸；护持范围与中段舟位随实际保存状态变化", async () => {
  const s = mount();
  await click("庭前礼案与来客");
  await click("赴古渡潮隙");
  const month = s.value.month;
  await click("主潮 ·");
  await click("集中护住主潮");
  expect(s.value.month).toBe(month);
  expect(document.querySelector(".main-ward")).toBeTruthy();
  expect(document.querySelector(".shore-ward")).toBeNull();
  await click("引舟越过主潮");
  expect(document.querySelector(".at-eddy")).toBeTruthy();
  expect(document.querySelector(".shore-marker")).toBeNull();
  await click("收势等候");
  s.value = migrateSave(JSON.parse(JSON.stringify(s.value)));
  await nextTick();
  expect(document.querySelector(".at-eddy")).toBeTruthy();
  expect(document.querySelector(".main-ward")).toBeNull();
  await click("侧岸 ·");
  await click("将护持转到侧岸");
  expect(document.querySelector(".shore-ward")).toBeTruthy();
  await click("引舟靠岸");
  expect(s.value.nascentSoul.ability).toBe("done");
  expect(document.querySelector(".shore-marker")).toBeTruthy();
  expect(document.querySelector(".survey-chart")).toBeTruthy();
  expect(document.querySelector(".crossed")).toBeTruthy();
});
it("镇潮印使主潮保持平稳，护持移向侧岸后可连续引航；观察热点本身不结算", async () => {
  const s = mount();
  if (!s.value.treasures.artifacts.includes("tideSeal"))
    s.value = dispatch(s.value, {
      type: "treasure",
      id: "equip-ui",
      action: { kind: "deploy", item: "tideSeal" },
    });
  await nextTick();
  await click("庭前礼案与来客");
  await click("赴古渡潮隙");
  const snapshot = structuredClone(s.value);
  await click("主潮 ·");
  expect(s.value).toEqual(snapshot);
  await click("镇潮印固定潮头");
  expect(document.querySelector(".fixed-seal")).toBeTruthy();
  await click("侧岸 ·");
  await click("将护持转到侧岸");
  expect(document.querySelector(".main-ward")).toBeTruthy();
  expect(document.querySelector(".shore-ward")).toBeTruthy();
  await click("连续引航两段");
  expect(s.value.nascentSoul.ability).toBe("done");
  expect(document.querySelector(".fixed-seal")).toBeNull();
});
