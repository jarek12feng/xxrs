// @vitest-environment happy-dom
import { clickSceneAction, openSceneNotes } from "./golden-scene-navigation";
import { createApp, h, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, validState, type Intent } from "../src/core";
import { outerSeaCheckpoint } from "../tools/outer-sea-checkpoint";
import Panel from "../src/outer-sea/OuterSeaPanel.vue";
it("外海按钮从相识到探险、法宝与闭关均发送命令，显示五十年约定", async () => {
  const s = shallowRef(outerSeaCheckpoint());
  s.value.stones += 200;
  s.value.herbs += 20;
  let i = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Panel, {
        game: s.value,
        busy: false,
        onAct: (intent: Intent) => {
          const n = dispatch(s.value, { ...intent, id: `sea-ui-${++i}` });
          expect(n).not.toBe(s.value);
          expect(validState(n)).toBe(true);
          s.value = n;
        },
      }),
  });
  app.mount(host);

  const click = (text: string) => clickSceneAction(host, text);
  try {
    await click("循海路");
    await click("与修堤者");
    await click("共享潮图");
    expect(host.querySelector('[aria-label="现场操作"]')).toBeNull();
    await click("筹备避潮");
    await click("踏上退潮");
    await click("应对镇潮");
    while (s.value.outerSea.duel)
      await click(["辨影", "守势", "反击"][s.value.outerSea.duel.turn % 3]!);
    await click("先取镇潮印");
    await click("交接潮图");
    await openSceneNotes(host);
    expect(host.textContent).toContain("尚余 600 月");
    await click("温养镇潮印");
    await openSceneNotes(host);
    expect(host.textContent).toContain("已温养");
    await click("开始闭关");
    expect(s.value.outerSea.cultivation).toBeGreaterThan(30);
    expect(host.textContent).toContain("出关年龄");
  } finally {
    app.unmount();
  }
});
