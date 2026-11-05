import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import {
  dispatch,
  validState,
  type Intent,
} from "../src/core";
import TreasurePanel from "../src/treasures/TreasurePanel.vue";

it("御器容量不足显示具体原因，凝神后双辅器可共存并逐件收回", async () => {
  const s=createGame("兼御","wood");
  s.month=4;s.age=196;s.story.stage="waiting";s.qi=120;
  s.journey.relics.sword=1;s.journey.equipped="sword";
  s.treasures.owned.bell=s.treasures.owned.cord=1;
  const state=shallowRef(s),host=document.createElement("div");let serial=0;
  const app=createApp({render:()=>h(TreasurePanel,{game:state.value,busy:false,onAct:(i:Intent)=>{
    state.value=dispatch(state.value,{...i,id:`control-ui-${++serial}`});
    expect(validState(state.value)).toBe(true);
  }})});
  app.mount(host);
  const card=(name:string)=>[...host.querySelectorAll("article")].find(el=>el.textContent?.includes(name))!;
  const button=(name:string,label:string)=>[...card(name).querySelectorAll("button")].find(el=>el.textContent?.includes(label))!;
  try {
    button("镇岳钟","装配辅器").click();await nextTick();
    expect(host.textContent).toContain("御器 4/5");
    expect(button("缚风索","装配辅器").disabled).toBe(true);
    expect(card("缚风索").textContent).toContain("御器需神识容量 6");
    state.value=dispatch(state.value,{id:"meditate-ui",type:"advance",activity:"meditate",months:3});await nextTick();
    expect(button("缚风索","装配辅器").disabled).toBe(false);
    button("缚风索","装配辅器").click();await nextTick();
    expect(host.textContent).toContain("御器 6/6");
    expect(state.value.treasures.equipped).toEqual(["bell","cord"]);
    button("镇岳钟","收回此器").click();await nextTick();
    expect(state.value.treasures.equipped).toEqual(["cord"]);
    expect(host.textContent).toContain("御器 4/6");
  } finally {app.unmount();}
});

it("专御改为辅器时展示净收益，取药阶段按钮禁用", async () => {
  const { outerSeaCheckpoint } = await import("../tools/outer-sea-checkpoint");
  const s = outerSeaCheckpoint(); s.sense = 18; s.treasures.owned.bell = 1;
  const state = shallowRef(s), host = document.createElement("div");
  const app = createApp({render:()=>h(TreasurePanel,{game:state.value,busy:false})});
  app.mount(host);
  try {
    const card = [...host.querySelectorAll("article")].find(el=>el.textContent?.includes("镇岳钟"))!;
    expect(card.textContent).toContain("反击伤害 -3、承伤 +1");
    expect(card.textContent).toContain("守势伤害 -2、承伤 -1");
    state.value = {...state.value, goldenCore:{...state.value.goldenCore, expedition:"prepared"}};
    await nextTick();
    expect([...host.querySelectorAll("button")].find(el=>el.textContent?.includes("收回主器"))!.disabled).toBe(true);
    expect([...card.querySelectorAll("button")].find(el=>el.textContent?.includes("装配辅器"))!.disabled).toBe(true);
  } finally { app.unmount(); }
});
