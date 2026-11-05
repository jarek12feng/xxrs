// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, type Intent } from "../src/core";
import CultivationOutlook from "../src/CultivationOutlook.vue";
import ActionFeedback from "../src/ActionFeedback.vue";
import { actionReceipt } from "../src/action-feedback";
import { sealPreparationCheckpoint } from "../tools/continuity-checkpoint";
import { retreatPlan } from "../src/retreat";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("闭关前选择不强制，温养按原命令结算并显示所得；重复准备入口消失", async () => {
  const game = shallowRef(sealPreparationCheckpoint());
  const before = structuredClone(game.value);
  let intent: Intent | undefined;
  app = createApp({
    render: () =>
      h(CultivationOutlook, {
        game: game.value,
        automatic: true,
        onAct: (i: Intent) => {
          intent = i;
          game.value = dispatch(game.value, { ...i, id: "preparation-ui" });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.body.textContent).toContain("也可继续修行");
  expect(game.value).toEqual(before);
  expect(
    Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("开始闭关"),
    )?.disabled,
  ).toBe(false);
  const button = Array.from(document.querySelectorAll("button")).find(
    (b) => b.textContent === "温养镇潮印",
  )!;
  expect(button.disabled).toBe(false);
  button.click();
  await nextTick();
  expect(game.value.outerSea.attuned).toBe(true);
  expect(document.body.textContent).not.toContain("温养镇潮印");
  expect(document.body.textContent).toContain("出战镇潮印");
  const receipt = actionReceipt(before, game.value, intent!)!;
  app.unmount();
  app = createApp(ActionFeedback, { receipt, expanded: true });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(
    document.querySelector('[aria-label="器物成长结果"]')?.textContent,
  ).toContain("温养已成");
  expect(document.body.textContent).toContain("尚未出战");
});
it("会期截短闭关不会误报余寿不足", () => {
  const s = sealPreparationCheckpoint();
  s.outerSea.notice = s.month - 590;
  s.outerSea.reminded = false;
  const plan = retreatPlan(s, "regular", 300);
  expect(plan.stopsForMeeting).toBe(true);
  app = createApp(CultivationOutlook, {
    game: s,
    automatic: true,
    target: 300,
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.body.textContent).toContain("会期来信时出关");
  expect(document.body.textContent).not.toContain("余寿不足，已缩短");
});
