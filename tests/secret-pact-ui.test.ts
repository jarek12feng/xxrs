// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import { dispatch, validState, type Intent } from "../src/core";
import SecretPactPanel from "../src/secret-pact/SecretPactPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { secretPactCheckpoint } from "../tools/secret-pact-checkpoint";
it("shows the early promise and real disabled realm gate", async () => {
  const s = secretPactCheckpoint(false),
    host = document.createElement("div");
  const app = createApp({
    render: () => h(SecretPactPanel, { game: s, busy: false }),
  });
  app.mount(host);
  try {
    host
      .querySelector<HTMLButtonElement>('[data-hotspot="preparation"]')!
      .click();
    await nextTick();
    expect(host.textContent).toContain("筑基中期");
    expect(host.textContent).toContain("气势 200");
    expect(host.textContent).toContain("攻势 28");
    expect(host.textContent).toContain("入府不等于得宝");
    expect(
      [...host.querySelectorAll<HTMLButtonElement>(".pact-actions button")]
        .filter(
          (x) =>
            x.textContent?.includes("入府") || x.textContent?.includes("退路"),
        )
        .every((x) => x.disabled),
    ).toBe(true);
  } finally {
    app.unmount();
  }
});
it("yield gives compensation and follow-up, never the exclusive method", async () => {
  const state = shallowRef(secretPactCheckpoint());
  const host = document.createElement("div");
  let serial = 0;
  const app = createApp({
    render: () =>
      h(SecretPactPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `pact-ui-${++serial}`,
          });
          expect(validState(state.value)).toBe(true);
        },
      }),
  });
  app.mount(host);
  const click = async (label: string) => {
    const button = [...host.querySelectorAll("button")].find((x) =>
      x.textContent?.includes(label),
    )!;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
    button.click();
    await nextTick();
  };
  try {
    expect(host.textContent).not.toContain("出资助他治伤");
    await click("封简石台");
    await click("让他受法");
    expect(host.textContent).not.toContain("已得照玄护脉法");
    expect(host.textContent).toContain("分取守约");
    const before = state.value.growth.medicines.healing;
    await click("护住阵脚");
    await click("辨明回流");
    await click("切开阵隙");
    await click("封简石台");
    await click("收取贺崇");
    expect(state.value.growth.medicines.healing).toBe(before + 2);
    expect(
      [...host.querySelectorAll("button")].some((x) =>
        x.textContent?.includes("收取贺崇"),
      ),
    ).toBe(false);
  } finally {
    app.unmount();
  }
});
it("the actual journey panel starts a named human battle and retreat returns the pursuit choice", async () => {
  const state = shallowRef(secretPactCheckpoint());
  const host = document.createElement("div");
  let serial = 0;
  const app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `pact-battle-ui-${++serial}`,
          });
          expect(validState(state.value)).toBe(true);
        },
      }),
  });
  app.mount(host);
  const click = async (label: string) => {
    const button = [...host.querySelectorAll("button")].find((x) =>
      x.textContent?.includes(label),
    )!;
    expect(button, label).toBeTruthy();
    expect(button.disabled).toBe(false);
    button.click();
    await nextTick();
  };
  try {
    await click("封简石台");
    await click("要求继续议价");
    expect(state.value.foundationJourney.duel).toBeNull();
    await click("封简石台");
    await click("与贺崇争夺玉简");
    expect(state.value.foundationJourney.duel?.id).toBe("pactRival");
    expect(
      host.querySelector('img[alt="贺崇"]')?.getAttribute("src"),
    ).toContain("he-chong-combat");
    await click("撤退");
    await click("封简石台");
    expect(host.textContent).toContain("追索玉简");
    expect(state.value.secretPact.outcome).toBe("retreated");
  } finally {
    app.unmount();
  }
});

it('shows the actual broken-stele location and closes an aggressor-specific dispute through the UI', async () => {
  let state=secretPactCheckpoint();let serial=0;
  const send=(intent:Intent)=>{state=dispatch(state,{...intent,id:`stele-ui-setup-${++serial}`});expect(validState(state)).toBe(true);};
  send({type:'secretPact',action:'seize'});send({type:'secretPact',action:'leave'});
  for(const action of ['guardFlow','readFlow','breakFlow'] as const)send({type:'secretPact',action});
  send({type:'foundationJourney',action:{kind:'travel',destination:'inn'}});
  send({type:'secretPact',action:'notice'});send({type:'wayfaring',action:{kind:'visit',site:'brokenStele'}});
  expect(state.secretPact.site).toBe('brokenStele');
  const current=shallowRef(state),host=document.createElement('div');
  const app=createApp({render:()=>h(FoundationPanel,{game:current.value,busy:false,onAct:(intent:Intent)=>{current.value=dispatch(current.value,{...intent,id:`stele-ui-${++serial}`});expect(validState(current.value)).toBe(true);}})});app.mount(host);
  try {
    expect(host.querySelector('.scene-landscape')?.getAttribute('style')).toContain('broken-stele-inn');
    expect(host.querySelector('.return-to-place')).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-hotspot="terms"]')!.click();await nextTick();
    const button=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('请见证人核对旧约'))!;
    expect(button.disabled).toBe(false);button.click();await nextTick();
    expect(current.value.secretPact.settled).toBe(true);expect(current.value.secretPact.pursuit).toBe('closed');
    expect(current.value.secretPact.last).toContain('仍拒绝同行');expect(current.value.secretPact.manual).toBe(false);
  } finally {app.unmount();}
});
