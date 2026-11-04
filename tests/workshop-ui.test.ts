// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, nextTick, shallowRef, type App } from "vue";
import WorkshopPanel from "../src/workshop/WorkshopPanel.vue";
import { createGame, dispatch, type Intent } from "../src/core";
import { workshopQuote } from "../src/workshop/rules";
let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
async function flush() {
  for (let i = 0; i < 5; i++) await nextTick();
}
it("shows the same quote that commands settle and refreshes stock, costs and locked choices", async () => {
  const initial = createGame("制作界面", "wood");
  initial.qi = 120;
  initial.study = 0;
  initial.stones = 60;
  const state = shallowRef(initial);
  const intents: Intent[] = [];
  app = createApp({
    render: () =>
      h(WorkshopPanel, {
        game: state.value,
        busy: false,
        onAct: (c: Intent) => {
          intents.push(c);
          state.value = dispatch(state.value, {
            ...c,
            id: `ui-${intents.length}`,
          });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  const button = (name: string) =>
    [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === name,
    )!;
  expect(button("自行炼制护脉丹").disabled).toBe(true);
  expect(button("购买成品护脉丹").disabled).toBe(false);
  const quote = workshopQuote(state.value, { product: "ward", method: "buy" });
  button("购买成品护脉丹").click();
  await flush();
  expect(state.value.workshop.ward).toBe(1);
  expect(state.value.stones).toBe(60 - quote.stones);
  expect(initial.workshop.ward).toBe(0);
  expect(document.body.textContent).toContain("护脉丹 1");
  expect(document.body.textContent).toContain("回气 26");
  expect(document.body.textContent).toContain("不耗月份");
  button("法器与刻纹").click();
  await flush();
  expect(button("购买成品听松灵剑")).toBeDefined();
  button("购买成品听松灵剑").click();
  await flush();
  expect(state.value.journey.relics.sword).toBe(1);
  expect(state.value.journey.equipped).toBeNull();
  const equip = [...document.querySelectorAll("button")].find(
    (b) =>
      b.textContent?.includes("装配灵器") &&
      b.textContent?.includes("听松灵剑"),
  )!;
  equip.click();
  await flush();
  expect(state.value.journey.equipped).toBe("sword");
  expect(document.body.textContent).toContain("筑基后可刻纹");
  expect(intents).toHaveLength(3);
});
it("pending story disables every mutating workshop action while leaving category navigation usable", async () => {
  const s = createGame("待决", "wood");
  s.stones = 100;
  s.pending = { id: "p", kind: "meeting" };
  app = createApp(WorkshopPanel, { game: s, busy: false });
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  expect(
    [...document.querySelectorAll("button")]
      .filter((b) => !b.disabled)
      .map((b) => b.textContent?.trim()),
  ).toEqual(["丹药", "法器与刻纹"]);
});
