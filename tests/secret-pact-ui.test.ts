// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { expect, it } from "vitest";
import { dispatch, validState, type Intent } from "../src/core";
import SecretPactPanel from "../src/secret-pact/SecretPactPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import { secretPactCheckpoint } from "../tools/secret-pact-checkpoint";
it("shows the early promise and real disabled realm gate", () => {
  const s = secretPactCheckpoint(false),
    host = document.createElement("div");
  const app = createApp({
    render: () => h(SecretPactPanel, { game: s, busy: false }),
  });
  app.mount(host);
  try {
    expect(host.textContent).toContain("筑基中期");
    expect(
      [...host.querySelectorAll("button")]
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
it("negotiation updates the same panel and pays the follow-up only once", async () => {
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
    await click("出资助他治伤");
    expect(host.textContent).toContain("已得照玄护脉法");
    expect(host.textContent).toContain("分取守约");
    const before = state.value.growth.medicines.healing;
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
    await click("要求继续议价");
    expect(state.value.foundationJourney.duel).toBeNull();
    await click("与贺崇争夺玉简");
    expect(state.value.foundationJourney.duel?.id).toBe("pactRival");
    expect(
      host.querySelector('img[alt="贺崇"]')?.getAttribute("src"),
    ).toContain("he-chong-combat");
    await click("撤退");
    expect(host.textContent).toContain("追索玉简");
    expect(state.value.secretPact.outcome).toBe("retreated");
  } finally {
    app.unmount();
  }
});
