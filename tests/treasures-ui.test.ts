// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import {
  createGame,
  dispatch,
  validState,
  migrateSave,
  type Intent,
} from "../src/core";
import TreasurePanel from "../src/treasures/TreasurePanel.vue";
it("实际按钮完成目录、预算、入场、竞拍、离场与辅器装配；恢复仍是同场", async () => {
  const s = createGame("拍会", "wood", 44);
  s.month = 4;
  s.age = 196;
  s.story.stage = "waiting";
  s.qi = 120;
  s.stones = 200;
  const state = shallowRef(s),
    host = document.createElement("div");
  let serial = 0;
  const app = createApp({
    render: () =>
      h(TreasurePanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `ui-${++serial}`,
          });
          expect(validState(state.value)).toBe(true);
        },
      }),
  });
  app.mount(host);
  const click = async (label: string) => {
    const b = [...host.querySelectorAll("button")].find((x) =>
      x.textContent?.includes(label),
    )!;
    expect(b).toBeTruthy();
    expect(b.disabled).toBe(false);
    b.click();
    await nextTick();
  };
  try {
    expect(
      [...host.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("筑基拍卖"),
      )!.disabled,
    ).toBe(true);
    await click("查看坊市小拍");
    const input = host.querySelector("input")!;
    input.value = "100";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    await click("设定预算");
    await click("赴会");
    const seed = state.value.seed;
    state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
    await nextTick();
    expect(state.value.seed).toBe(seed);
    for (let i = 0; i < 30 && state.value.treasures.auction!.index === 0; i++)
      await click("出价 ");
    expect(state.value.treasures.auction!.lots[0].result).toBe("won");
    await click("离场");
    await click("装配辅器");
    expect(state.value.treasures.equipped.length).toBeGreaterThan(0);
    expect(host.textContent).toContain("已装配");
  } finally {
    app.unmount();
  }
});

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
