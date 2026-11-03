// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { afterEach, expect, it, vi } from "vitest";
import CombatField from "../src/scene2d/combat/CombatField.vue";
import type { CombatSnapshot } from "../src/scene2d/combat/sequence";
afterEach(() => vi.useRealTimers());
const baseline: CombatSnapshot = {
  id: "badger",
  turn: 0,
  player: 100,
  enemy: 76,
  enemyName: "赤背岩獾",
  enemyImage: "/art/qi-people-beasts/redback-badger.webp",
  effect: "none",
};
function setup() {
  const snapshot = shallowRef<CombatSnapshot | null>({ ...baseline }),
    host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(CombatField, {
        snapshot: snapshot.value,
        hero: "hero-male-qi",
        heroName: "行者",
      }),
  });
  app.mount(host);
  return { snapshot, host, close: () => app.unmount() };
}
it("mount is still; saved turn animates exact net damage; skip returns to still without mutating snapshot", async () => {
  vi.useFakeTimers();
  const x = setup();
  vi.runAllTimers(); // Drain Vue devtools bootstrap before measuring scene timers.
  try {
    expect(
      x.host.querySelector("[data-phase]")?.getAttribute("data-phase"),
    ).toBe("ready");
    const next = {
      ...baseline,
      turn: 1,
      player: 94,
      enemy: 60,
      effect: "strike",
    };
    x.snapshot.value = next;
    await nextTick();
    expect(
      x.host.querySelector("[data-phase]")?.getAttribute("data-phase"),
    ).toBe("approach");
    vi.advanceTimersByTime(180);
    await nextTick();
    expect(x.host.querySelector("[data-pose=attack]")).not.toBeNull();
    vi.advanceTimersByTime(240);
    await nextTick();
    expect(x.host.textContent).toContain("−16");
    expect(x.host.textContent).toContain("−6");
    expect(x.host.querySelector("[data-pose=hurt]")).not.toBeNull();
    x.host
      .querySelector<HTMLButtonElement>("button")!
      .dispatchEvent(new MouseEvent("click"));
    await nextTick();
    expect(
      x.host.querySelector("[data-phase]")?.getAttribute("data-phase"),
    ).toBe("ready");
    expect(x.snapshot.value).toEqual(next);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    x.close();
  }
});
it("missing enemy image retains identity and end/unmount removes all callbacks", async () => {
  vi.useFakeTimers();
  const x = setup();
  try {
    x.host
      .querySelector<HTMLImageElement>(".combat-enemy img")!
      .dispatchEvent(new Event("error"));
    await nextTick();
    expect(x.host.querySelector(".combat-enemy img")).toBeNull();
    expect(x.host.textContent).toContain("赤背岩獾");
    x.snapshot.value = { ...baseline, turn: 1, enemy: 60 };
    await nextTick();
    expect(vi.getTimerCount()).toBe(1);
    x.snapshot.value = null;
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    expect(x.host.querySelector(".combat-field")).toBeNull();
    x.snapshot.value = baseline;
    await nextTick();
    x.snapshot.value = { ...baseline, turn: 1, enemy: 60 };
    await nextTick();
  } finally {
    x.close();
  }
  expect(vi.getTimerCount()).toBe(0);
});
it("reduced motion never schedules an exchange", async () => {
  vi.useFakeTimers();
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  const x = setup();
  try {
    x.snapshot.value = { ...baseline, turn: 1, enemy: 60 };
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    expect(
      x.host.querySelector("[data-phase]")?.getAttribute("data-phase"),
    ).toBe("ready");
  } finally {
    x.close();
    window.matchMedia = original;
  }
});
it("supports matchMedia shims with matches only and cleans timers on unmount", async () => {
  vi.useFakeTimers();
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  const x = setup();
  try {
    x.snapshot.value = { ...baseline, turn: 1, enemy: 60 };
    await nextTick();
    expect(
      x.host.querySelector("[data-phase]")?.getAttribute("data-phase"),
    ).toBe("approach");
  } finally {
    x.close();
    window.matchMedia = original;
  }
  vi.runAllTimers();
  expect(vi.getTimerCount()).toBe(0);
});
