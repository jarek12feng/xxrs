// @vitest-environment happy-dom
import { clickSceneAction, openSceneNotes } from "./golden-scene-navigation";
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, migrateSave, validState, type Intent } from "../src/core";
import { condensationCheckpoint } from "../tools/golden-core-checkpoint";
import Status from "../src/CultivationStatus.vue";
import Ascension from "../src/ascension/AscensionPanel.vue";
import Panel from "../src/golden-core/GoldenCorePanel.vue";
it("实际按钮走通分药、炼丹、灵地、护持、凝丹和初行，重载保留成果", async () => {
  const state = shallowRef(condensationCheckpoint());
  // Resource-rich fixture isolates UI/dispatch wiring; the separate audit uses actual earned resources.
  state.value.stones += 200;
  state.value.herbs += 30;
  state.value.workshop.ward++;
  const host = document.createElement("div");
  let serial = 0;
  const onAct = (i: Intent) => {
    const before = state.value;
    state.value = dispatch(before, { ...i, id: `ui-golden-${++serial}` });
    expect(state.value).not.toBe(before);
    expect(validState(state.value)).toBe(true);
  };
  const app = createApp({render:()=>h('div',[
    h(Panel,{game:state.value,busy:false,onAct}),
    h(Ascension,{game:state.value,busy:false,onAct})
  ])});
  app.mount(host);

  const click = (text: string) => clickSceneAction(host, text);
  try {
    await openSceneNotes(host);
    expect(host.textContent).toContain("两胜固定授一份主药");
    await click("整备行装");
    await click("与柳知微合力");
    await click("应对守药石偶");
    while (state.value.goldenCore.duel) {
      await click(
        ["守势", "辨影", "反击"][state.value.goldenCore.duel.turn % 3]!,
      );
    }
    await click("采下凝露芝心");
    await click("自行合药");
    expect(host.querySelector('[aria-label="现场操作"]')).toBeNull();
    await click("租用凝丹静室");
    await click("备护脉阵");
    host.querySelector<HTMLButtonElement>("[data-hotspot=chamber]")!.click();
    await nextTick();
    expect(host.textContent).toContain("预计出关年龄");
    expect(host.textContent).toContain("届时余寿");
    expect(host.textContent).toContain("直接叩关把握 100%");
    await click("凝丹行功");
    for(let n=0;n<3;n++) {
      const b=[...host.querySelectorAll<HTMLButtonElement>('.ascension-overlay button')].find(x=>x.textContent?.includes('以灵草药气调和'))!;
      b.click(); await nextTick();
      state.value=migrateSave(JSON.parse(JSON.stringify(state.value))); await nextTick();
    }
    const finish=[...host.querySelectorAll<HTMLButtonElement>('.ascension-overlay button')].find(x=>x.textContent?.includes('服丹，完成突破'))!;
    finish.click(); await nextTick();
    state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
    await nextTick();
    expect(host.textContent).toContain("金丹初成");
    expect(host.textContent).not.toContain("服丹叩关");
    const statusHost = document.createElement("div");
    const statusApp = createApp({
      render: () => h(Status, { game: state.value }),
    });
    statusApp.mount(statusHost);
    expect(statusHost.textContent).toContain("金丹前期");
    expect(statusHost.textContent).not.toContain("360");
    statusApp.unmount();
    host.querySelector<HTMLButtonElement>('[data-hotspot="golden-story"]')!.click();
    await nextTick();
    await click("以散修身份请人引荐");
    host.querySelector<HTMLButtonElement>('[data-hotspot="exit"]')!.click();
    await nextTick();
    await click("独自越过云壁");
    expect(state.value.goldenCore.farShore).toBe(true);
    await openSceneNotes(host);
    expect(host.textContent).toContain("前往外海古渡");
  } finally {
    app.unmount();
  }
});
