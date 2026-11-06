// @vitest-environment happy-dom
import { clickSceneAction, openSceneNotes } from "./golden-scene-navigation";
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, validState, type Intent } from "../src/core";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import { chooseConclaveMove } from "../tools/conclave-checkpoint";
import Panel from "../src/conclave/ConclavePanel.vue";
it("来信赴会、两胜入境、温养与深处取法均通过真实按钮提交命令", async () => {
  const s = shallowRef(conclaveCheckpoint());
  let serial = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Panel, {
        game: s.value,
        busy: false,
        onAct: (intent: Intent) => {
          const n = dispatch(s.value, {
            ...intent,
            id: `conclave-ui-${++serial}`,
          });
          expect(n).not.toBe(s.value);
          expect(validState(n)).toBe(true);
          s.value = n;
        },
      }),
  });
  app.mount(host);

  const click = (text: string) => clickSceneAction(host, text);
  const fund = async (n: number) => {
    while (s.value.stones < n) await click("劳作半年");
  };
  const herbs = async (n: number) => {
    while (s.value.herbs < n) {
      await fund(8);
      await click("购置灵草");
    }
  };
  const fight = async () => {
    while (s.value.conclave.duel) {
      const move = chooseConclaveMove(s.value);
      await click(
        { guard: "守势 · 伤害", strike: "反击 · 伤害", discern: "辨影 · 伤害" }[
          move
        ],
      );
    }
  };
  try {
    await openSceneNotes(host);
    expect(host.textContent).toContain("会期还有");
    await click("留居候会");
    await click("循道友来信");
    await click("与各宗来客");
    await herbs(16);
    await fund(12);
    await click("随顾沧遥");
    await click("登台争取");
    await fight();
    await click("登台争取");
    await fight();
    expect(s.value.conclave.wins).toBe(2);
    host.querySelector<HTMLButtonElement>("[data-hotspot=arena]")!.click();
    await nextTick();
    expect(host.textContent).toContain("自愿争优");
    await click("背潮石道");
    await fund(10);
    await click("筹备归潮");
    await click("循已知路线");
    await click("应对守阵");
    await fight();
    expect(s.value.conclave.depth).toBe(1);
    await fund(18);
    await click("温养定神珠");
    await fund(10);
    await herbs(8);
    await click("筹备归潮");
    await click("循已知路线");
    await click("应对守阵");
    await fight();
    expect(s.value.conclave.depth).toBe(2);
    await click("参悟抱元录");
    expect(s.value.conclave.method).toBe("inherit");
    await openSceneNotes(host);
    expect(host.textContent).toContain("尚未炼成丹药");
    expect(host.textContent).toContain("抱元凝神录");
  } finally {
    app.unmount();
  }
});

it("点击人物只打开现场，歇脚处换装走原命令且保留现场", async () => {
  const { conclavePlayer } = await import('../tools/conclave-checkpoint');
  const p = conclavePlayer(); p.arrive();
  const state = shallowRef(p.state), host = document.createElement('div');
  const intents: Intent[] = [];
  const app = createApp({render:()=>h(Panel,{game:state.value,busy:false,onAct:(intent:Intent)=>{
    intents.push(intent);
    state.value=dispatch(state.value,{...intent,id:`field-${intents.length}`});
    expect(validState(state.value)).toBe(true);
  }})});
  app.mount(host);
  try {
    const before=JSON.stringify(state.value);
    host.querySelector<HTMLButtonElement>('[aria-label="与顾沧遥交谈"]')!.click(); await nextTick();
    expect(host.querySelector('.narrative-inspector')?.textContent).toContain('随顾沧遥演练守势');
    expect(host.querySelector('.narrative-inspector')?.textContent).not.toContain('与叶问苓推演潮阵');
    host.querySelector<HTMLButtonElement>('[aria-label="与叶问苓交谈"]')!.click(); await nextTick();
    expect(host.querySelector('.narrative-inspector')?.textContent).toContain('与叶问苓推演潮阵');
    expect(host.querySelector('.narrative-inspector')?.textContent).not.toContain('随顾沧遥演练守势');
    expect(JSON.stringify(state.value)).toBe(before);
    expect(intents).toHaveLength(0);
    host.querySelector<HTMLButtonElement>('[data-hotspot="chamber"]')!.click(); await nextTick();
    expect(host.querySelector('.field-loadout')?.textContent).toContain('收回后器物基础修正差值');
    const primary=state.value.journey.equipped!;
    const month=state.value.month, seed=state.value.seed;
    const button=[...host.querySelectorAll<HTMLButtonElement>('.field-loadout button')].find(x=>x.textContent?.includes('收回'))!;
    expect(button.disabled).toBe(false); button.click(); await nextTick();
    expect(intents[0]).toEqual({type:'treasure',action:{kind:'withdraw',item:primary}});
    expect(state.value.journey.equipped).toBe(null);
    expect(state.value.month).toBe(month); expect(state.value.seed).toBe(seed);
    expect(host.querySelector('.field-loadout')).not.toBeNull();
    expect(host.querySelector('.narrative-inspector')?.textContent).toContain('会谷歇脚处');
  } finally {app.unmount();}
});

it('败退后直接显示复盘与原地整备，表现回调不关闭恢复面板', async()=>{
 const {conclavePlayer}=await import('../tools/conclave-checkpoint');
 const p=conclavePlayer();p.arrive();
 const s=shallowRef(p.state),host=document.createElement('div');let id=0;
 const app=createApp({render:()=>h(Panel,{game:s.value,busy:false,onAct:(intent:Intent)=>{s.value=dispatch(s.value,{...intent,id:`review-ui-${++id}`});}})});
 app.mount(host);
 try {
  await clickSceneAction(host,'登台争取');
  while(s.value.conclave.duel) await clickSceneAction(host,'反击 · 伤害');
  await nextTick();
  expect(host.textContent).toContain('调息与再战');
  expect(host.textContent).toContain('本场复盘：');
  expect([...host.querySelectorAll('button')].some(b=>b.textContent?.includes('静养一月'))).toBe(true);
  expect([...host.querySelectorAll('button')].some(b=>b.textContent?.includes('查看再战条件'))).toBe(true);
 } finally {app.unmount();host.remove();}
});

it('战中关闭用药会同步改变预览和实际命令，取胜后的对话引用本场记录',async()=>{
 const {conclavePlayer}=await import('../tools/conclave-checkpoint');
 const p=conclavePlayer();p.arrive();const s=shallowRef(p.state),host=document.createElement('div');let serial=0;
 const app=createApp({render:()=>h(Panel,{game:s.value,busy:false,onAct:(intent:Intent)=>{s.value=dispatch(s.value,{...intent,id:`conserve-ui-${++serial}`});}})});app.mount(host);
 try{
  await clickSceneAction(host,'登台争取');
  const herbs=s.value.herbs;
  const checkbox=host.querySelector<HTMLInputElement>('.battle-medicine input')!;checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));await nextTick();
  expect(checkbox.checked).toBe(false);
  const guard=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('守势')&&b.textContent?.includes('伤害'))!;
  expect(guard.textContent).not.toContain('耗草');
  for(const label of ['辨影','反击','守势','反击','守势'])await clickSceneAction(host,label+' · 伤害');
  expect(s.value.herbs).toBe(herbs);expect(s.value.conclave.wins).toBe(1);
  expect(s.value.conclave.victories[0]?.herbs).toBe(0);
  host.querySelector<HTMLButtonElement>('[data-hotspot=gu]')!.click();await nextTick();
  expect(host.textContent).toContain('走背潮石道时起始气势再 +4');
 }finally{app.unmount();host.remove();}
});
