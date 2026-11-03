// @vitest-environment happy-dom
import { createApp, h, shallowRef, nextTick } from "vue";
import { expect, it } from "vitest";
import { dispatch, migrateSave, validState, type Intent } from "../src/core";
import { contestCheckpoint } from "../tools/sect-contest-checkpoint";
import { contestFoes } from "../src/sect-contest/content";
import { moves } from "../src/expedition/content";
import Scene from "../src/sect-contest/SectContestScene.vue";
it("actual scene buttons announce, defer, attend, duel, reward and disappear; no permanent entry", async () => {
  const state = shallowRef(contestCheckpoint());
  const host = document.createElement("div");
  let serial = 0;
  const app = createApp({
    render: () =>
      h(Scene, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `scene-${++serial}`,
          });
          expect(validState(state.value)).toBe(true);
        },
      }),
  });
  app.mount(host);
  const click = async (text: string) => {
    const b = [...host.querySelectorAll("button")].find((x) =>
      x.textContent?.includes(text),
    )!;
    expect(b).toBeTruthy();
    expect(b.disabled).toBe(false);
    b.click();
    await nextTick();
  };
  try {
    await click("同门口信");
    expect(host.textContent).toContain("十年");
    expect(host.textContent).toContain("120 月后");
    expect(host.textContent).not.toContain("行礼上台");
    await click("下山路");
    await click("暂不参加");
    expect(host.children.length).toBe(0);
    state.value = contestCheckpoint(true);
    await nextTick();
    await click("同门口信");
    await click("前往松间石台");
    for (let i = 0; i < 3; i++) {
      await click("松间石台");
      await click("行礼上台");
      state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
      await nextTick();
      while (state.value.sectContest.duel) {
        const t = state.value.sectContest;
        await click(moves[contestFoes[i]!.pattern[t.duel!.turn % 3]!]);
      }
    }
    await click("记名与补给");
    expect(host.textContent).toContain("本届魁首");
    await click("领取灵草");
    await click("下山路");
    await click("与同门道别");
    expect(host.children.length).toBe(0);
  } finally {
    app.unmount();
  }
});
