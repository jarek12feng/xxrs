// @vitest-environment happy-dom
import { it, expect, afterEach } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, type Intent } from "../src/core";
import { estateRevisitCheckpoint } from "../tools/world-revisits-checkpoint";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
async function click(text: string) {
  const b = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
  expect(b, text).toBeTruthy();
  expect(b!.disabled).toBe(false);
  b!.click();
  await nextTick();
  await nextTick();
}
it("场内进入只读；护运、奖励、求教持久命令驱动，忙碌阻止重复操作", async () => {
  const game = shallowRef(estateRevisitCheckpoint()),
    busy = shallowRef(false);
  let id = 0;
  app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: game.value,
        busy: busy.value,
        onAct: (i: Intent) => {
          game.value = dispatch(game.value, { ...i, id: `estate-ui-${++id}` });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  const before = structuredClone(game.value);
  await click("药案与护运");
  expect(game.value).toEqual(before);
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  expect(document.body.textContent).toContain("灵草6或灵石12");
  await click("接三批护运");
  await click("走短坡护送一批");
  await click("走短坡护送一批");
  const short = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("走短坡"),
  )!;
  expect(short.disabled).toBe(true);
  await click("沿水渠护送一批");
  await click("领取灵石12");
  await click("携记录向岑霁求教");
  expect(game.value.estateLife.packing).toBe(true);
  expect(game.value.stones).toBe(before.stones + 12);
  expect(game.value.month).toBe(before.month + 5);
  expect(document.body.textContent).toContain("已领悟");
  busy.value = true;
  await nextTick();
  expect(
    Array.from(document.querySelectorAll(".estate-life button")).every(
      (b) => (b as HTMLButtonElement).disabled,
    ),
  ).toBe(true);
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
});
it("药庄补给入口沿用工坊命令，缺料禁用，买齐后可自炼；帮助默认收起", async () => {
  const initial = estateRevisitCheckpoint();
  initial.foundationJourney.growth.refined = false;
  initial.foundationJourney.growth.routes.snow.prepared = false;
  initial.foundationJourney.won = initial.foundationJourney.won.filter(
    (x) => x !== "deer",
  );
  initial.herbs = 0;
  initial.stones = 40;
  const game = shallowRef(initial);
  let id = 0;
  app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: game.value,
        busy: false,
        onAct: (i: Intent) => {
          game.value = dispatch(game.value, {
            ...i,
            id: `snow-supply-ui-${++id}`,
          });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await click("药案与护运");
  const help = document.querySelector(".snow-supply") as HTMLDetailsElement;
  expect(help.open).toBe(false);
  help.querySelector("summary")!.click();
  await nextTick();
  expect(help.open).toBe(true);
  const craft = () =>
    Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("自炼护脉丹"),
    )!;
  expect(craft().disabled).toBe(true);
  await click("购灵草4");
  const before = structuredClone(game.value);
  await click("自炼护脉丹");
  expect(game.value.workshop.ward).toBe(before.workshop.ward + 1);
  expect(game.value.month).toBe(before.month + 1);
  expect(game.value.estateLife.completed).toEqual(before.estateLife.completed);
  expect(game.value.foundationJourney.growth.routes.snow.prepared).toBe(false);
});
