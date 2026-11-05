import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, it, expect } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, type Intent } from "../src/core";
import Panel from "../src/qi-journey/QiJourneyPanel.vue";
import { qiNarrativeNext, qiNarrativeEnemy } from "../src/qi-journey/narrative";
import { qiError } from "../src/qi-journey/rules";
import { foundationStep } from "../tools/foundation-playthrough";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("真实命令检查点可通过热点完成药窟，再返回原历练界面", async () => {
  let s = createGame("界面检查", "wood", 42, "insightful");
  for (let i = 0; i < 450; i++) {
    if (qiNarrativeNext(s) === "cave:depart" && !qiError(s, "cave:depart"))
      break;
    s = dispatch(s, { ...foundationStep(s), id: `ui-pre${i}` });
  }
  expect(qiError(s, "cave:depart")).toBe("");
  const game = shallowRef(s);
  let id = 0;
  app = createApp({
    render: () =>
      h(Panel, {
        game: game.value,
        busy: false,
        onAct: (c: Intent) => {
          game.value = dispatch(game.value, { ...c, id: `ui-n${id++}` });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  async function click(text: string) {
    const b = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(text),
    );
    expect(b, text).toBeTruthy();
    expect(b!.disabled, text).toBe(false);
    b!.click();
    await nextTick();
    await nextTick();
  }
  await click("药坪与药窟");
  await click("石涧与青嶂支路");
  await click("沿药路前往石涧");
  expect(game.value.qiJourney.narrative.location).toBe("cave");
  await click("卢雁回的约定");
  await click("互守退路");
  await click("废药床与旧阵");
  await click("刻录阵路");
  await click("右侧退路");
  await click("系绳试路");
  await click("废药床与旧阵");
  await click("亲自踏入逆流阵");
  for (let i = 0; game.value.qiJourney.narrative.duel && i < 16; i++) {
    const d = game.value.qiJourney.narrative.duel!,
      e = qiNarrativeEnemy(game.value);
    const move = e.pattern[d.turn % e.pattern.length];
    const labels = { guard: "守势", strike: "反击", discern: "辨影" };
    await click(labels[move]);
  }
  expect(game.value.qiJourney.narrative.phase).toBe("won");
  await click("分离燥烈药气");
  await click("用药液逆流调息");
  expect(game.value.qiJourney.narrative.phase).toBe("applied");
  await click("额外札记");
  await click("分抄札记");
  await click("右侧退路");
  await click("沿退路回山下");
  await click("回到山下街口");
  expect(document.body.textContent).toContain("凝元内府");
});
