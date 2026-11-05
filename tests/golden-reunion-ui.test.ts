// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, migrateSave, type Intent } from "../src/core";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import SeaPanel from "../src/outer-sea/OuterSeaPanel.vue";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
async function click(label: string) {
  const b = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label),
  );
  expect(b, label).toBeTruthy();
  expect(b!.disabled, label).toBe(false);
  b!.click();
  await nextTick();
  await nextTick();
}
it("古渡主场景进入重逢、布锚读档续做、分别撤下人物且可返回", async () => {
  const game = shallowRef(goldenLateCheckpoint());
  let id = 0;
  const mount = () => {
    app = createApp({
      render: () =>
        h(SeaPanel, {
          game: game.value,
          busy: false,
          onAct: (intent: Intent) =>
            (game.value = dispatch(game.value, {
              ...intent,
              id: `reunion-ui:${++id}`,
            })),
        }),
    });
    app.mount(document.body.appendChild(document.createElement("div")));
  };
  mount();
  await click("故人之约");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  await click("绳尺与古渡信路");
  await click("托驿使回信");
  await click("循新记号相见");
  expect(document.querySelector(".reunion-partner")).toBeTruthy();
  await click("辨清双影");
  await click("侧堤归绳");
  await click("先系归绳");
  expect(game.value.goldenStory.reunion.stage).toBe("anchored");
  app.unmount();
  document.body.innerHTML = "";
  game.value = migrateSave(JSON.parse(JSON.stringify(game.value)));
  mount();
  await click("故人之约");
  await click("侧堤归绳");
  await click("沿侧堤实测");
  await click("苏婉宁");
  await click("暂留完整底图");
  await click("互留信路");
  expect(game.value.goldenStory.reunion.stage).toBe("departed");
  expect(document.querySelector(".reunion-partner")).toBeNull();
  await click("回古渡");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  expect(document.body.textContent).toContain("同行旧记");
});
