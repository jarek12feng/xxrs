import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, nextTick, shallowRef, type App } from "vue";
import WorkshopPanel from "../src/workshop/WorkshopPanel.vue";
import { dispatch, type Intent } from "../src/core";
import { workshopQuote } from "../src/workshop/rules";
let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
async function flush() {
  for (let i = 0; i < 5; i++) await nextTick();
}
it("shows the same quote that commands settle and refreshes stock, costs and locked choices", async () => {
  const initial = createGame("制作界面", "wood");
  initial.qi = 120;
  initial.study = 0;
  initial.stones = 60;
  const state = shallowRef(initial);
  const intents: Intent[] = [];
  app = createApp({
    render: () =>
      h(WorkshopPanel, {
        game: state.value,
        busy: false,
        onAct: (c: Intent) => {
          intents.push(c);
          state.value = dispatch(state.value, {
            ...c,
            id: `ui-${intents.length}`,
          });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  const button = (name: string) =>
    [...document.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === name,
    )!;
  expect(button("自行炼制护脉丹").disabled).toBe(true);
  expect(button("购买成品护脉丹").disabled).toBe(false);
  const quote = workshopQuote(state.value, { product: "ward", method: "buy" });
  button("购买成品护脉丹").click();
  await flush();
  expect(state.value.workshop.ward).toBe(1);
  expect(state.value.stones).toBe(60 - quote.stones);
  expect(initial.workshop.ward).toBe(0);
  expect(document.body.textContent).toContain("护脉丹 1");
  expect(document.body.textContent).toContain("回气 26");
  expect(document.body.textContent).toContain("不耗月份");
  button("法器与刻纹").click();
  await flush();
  expect(button("购买成品听松灵剑")).toBeDefined();
  button("购买成品听松灵剑").click();
  await flush();
  expect(state.value.journey.relics.sword).toBe(1);
  expect(state.value.journey.equipped).toBeNull();
  const equip = [...document.querySelectorAll("button")].find(
    (b) =>
      b.textContent?.includes("装配灵器") &&
      b.textContent?.includes("听松灵剑"),
  )!;
  equip.click();
  await flush();
  expect(state.value.journey.equipped).toBe("sword");
  expect(document.body.textContent).toContain("筑基后可刻纹");
  expect(intents).toHaveLength(3);
});
it("pending story disables every mutating workshop action while leaving category navigation usable", async () => {
  const s = createGame("待决", "wood");
  s.stones = 100;
  s.pending = { id: "p", kind: "meeting" };
  app = createApp(WorkshopPanel, { game: s, busy: false });
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  expect(
    [...document.querySelectorAll("button")]
      .filter((b) => !b.disabled && b.textContent?.trim() !== "查看筹备缺口")
      .map((b) => b.textContent?.trim()),
  ).toEqual(["丹药", "法器与刻纹"]);
});
it("preparation is read-only until confirmed and refreshes the chosen budget after work", async () => {
  const initial=createGame('按需筹备','wood',42);initial.stones=2;
  const state=shallowRef(initial),intents:Intent[]=[];
  app=createApp({render:()=>h(WorkshopPanel,{game:state.value,busy:false,onAct:(c:Intent)=>{
    intents.push(c);state.value=dispatch(state.value,{...c,id:`plan-${intents.length}`});
  }})});
  app.mount(document.body.appendChild(document.createElement('div')));await flush();
  const card=[...document.querySelectorAll('article.workshop-card')].find(x=>x.querySelector('h4')?.textContent?.includes('回春散'))!;
  const buy=[...card.querySelectorAll('.workshop-options > div')].find(x=>x.textContent?.includes('购买成品'))!;
  [...buy.querySelectorAll('button')].find(b=>b.textContent?.includes('查看筹备'))!.click();await flush();
  expect(intents).toHaveLength(0);
  const plan=()=>document.querySelector('[aria-label="当前筹备方案"]')!;
  expect(plan().textContent).toContain('灵石 10');
  [...plan().querySelectorAll('button')].find(b=>b.textContent?.includes('劳作筹灵石'))!.click();await flush();
  expect(intents).toEqual([{type:'advance',activity:'work',months:2}]);
  expect(state.value.growth.medicines.healing).toBe(0);
  expect(plan().textContent).toContain('灵石 0');
  [...plan().querySelectorAll('button')].find(b=>b.textContent?.includes('按所选方案'))!.click();await flush();
  expect(state.value.growth.medicines.healing).toBe(1);
  expect(plan().textContent).toContain('本次筹备已完成');
  expect(plan().textContent).not.toContain('劳作筹灵石');
});
it('retains a selected preparation across an event overlay unmount',async()=>{
  const state=createGame('中断筹备','wood',42),shown=shallowRef(true);
  const selection=shallowRef<import('../src/workshop/preparation').PreparationSelection|null>(null);
  app=createApp({render:()=>shown.value?h(WorkshopPanel,{game:state,busy:false,selection:selection.value,'onUpdate:selection':value=>{selection.value=value;}}):h('div','待决事件')});
  app.mount(document.body.appendChild(document.createElement('div')));await flush();
  [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('查看筹备缺口'))!.click();await flush();
  expect(selection.value?.order).toEqual({product:'healing',method:'craft'});
  shown.value=false;await flush();shown.value=true;await flush();
  expect(document.querySelector('[aria-label="当前筹备方案"]')?.textContent).toContain('自行炼制 · 回春散');
});
it('shows higher-realm batch output before crafting and displays the exact inventory gain', async()=>{
 const {condensationCheckpoint}=await import('../tools/golden-core-checkpoint');
 const initial=condensationCheckpoint();initial.stones=100;initial.herbs=20;
 const state=shallowRef(initial);
 app=createApp({render:()=>h(WorkshopPanel,{game:state.value,busy:false,onAct:(intent:Intent)=>{state.value=dispatch(state.value,{...intent,id:'batch-ui'});}})});
 app.mount(document.body.appendChild(document.createElement('div')));await flush();
 [...document.querySelectorAll('button')].find(b=>b.textContent?.trim()==='丹药')!.click();await flush();
 const button=[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()==='自行炼制回春散')!;
 expect(button.disabled).toBe(false);
 expect(button.parentElement!.textContent).toContain('产出 2 份');
 const before=state.value.growth.medicines.healing;
 button.click();await flush();
 expect(state.value.growth.medicines.healing).toBe(before+2);
 expect(document.body.textContent).toContain(`回春散 ${before+2}`);
});
