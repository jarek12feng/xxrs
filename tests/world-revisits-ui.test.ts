// @vitest-environment happy-dom
import { it, expect, afterEach } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, type Intent } from "../src/core";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import SeaPanel from "../src/outer-sea/OuterSeaPanel.vue";
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
it("古渡旧图为独立现场对象，选择只读、补给扣款且不跳转主场景", async () => {
  const game = shallowRef(conclaveCheckpoint());
  let id = 0;
  app = createApp({
    render: () =>
      h(SeaPanel, {
        game: game.value,
        busy: false,
        onAct: (i: Intent) =>
          (game.value = dispatch(game.value, {
            ...i,
            id: `revisit-ui:${++id}`,
          })),
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  const before = structuredClone(game.value);
  await click("潮图留下的去路");
  expect(game.value).toEqual(before);
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  expect(document.body.textContent).toContain("共享的潮图");
  const details = document.querySelector(".revisit-panel details")!;
  details.setAttribute("open", "");
  await click("向药船补灵草4");
  expect(game.value.herbs).toBe(before.herbs + 4);
  expect(game.value.stones).toBe(before.stones - 6);
  expect(game.value.outerSea.cleared).toBe(2);
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
});
