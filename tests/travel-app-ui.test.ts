// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import { load, save } from "../src/save";
import { foundationMapCheckpoint } from "../tools/foundation-sites-checkpoint";
import { outerSeaCheckpoint } from "../tools/outer-sea-checkpoint";
import { validState, type State } from "../src/core";
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("../src/scene2d/renderer", () => ({
  mountStage: () => ({ destroy() {}, stop() {}, sync() {} }),
}));
let app: VueApp;
const flush = async () => {
  for (let i = 0; i < 12; i++) await nextTick();
};
const button = (label: string) => {
  const found = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find(
    (b) =>
      b.textContent?.includes(label) || b.getAttribute("aria-label") === label,
  );
  if (!found) throw Error("Missing " + label);
  return found;
};
const click = async (label: string) => {
  button(label).click();
  await flush();
};
async function mount(s: State) {
  vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
  app = createApp(App).use(createPinia());
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  await click("继续游戏");
  await click("当前冒险");
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(save).mockReset().mockResolvedValue();
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
});
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("real App saves departure once, withholds arrival on failed storage, and Esc never opens system menu", async () => {
  await mount(foundationMapCheckpoint());
  document.querySelector<HTMLButtonElement>('[data-hotspot="road"]')!.click();
  await flush();
  const destination = [
    ...document.querySelectorAll<HTMLButtonElement>(".destination-list button"),
  ].find((b) => b.textContent?.includes("晴川药庄"))!;
  destination.click();
  await flush();
  expect(document.querySelector(".travel-map")).not.toBeNull();
  expect(save).not.toHaveBeenCalled();
  vi.mocked(save).mockRejectedValueOnce(Error("旅行存储故障"));
  await click("动身前往");
  expect(document.body.textContent).toContain("旅行存储故障");
  expect(document.querySelector(".travel-map h2")!.textContent).not.toContain(
    "已抵达",
  );
  let resolve!: () => void;
  vi.mocked(save).mockImplementationOnce(
    () => new Promise<void>((r) => (resolve = r)),
  );
  button("动身前往").click();
  button("动身前往").click();
  await flush();
  expect(save).toHaveBeenCalledTimes(2);
  resolve();
  await flush();
  expect(document.querySelector(".travel-map h2")!.textContent).toContain(
    "已抵达",
  );
  const saved = vi.mocked(save).mock.calls.at(-1)![0];
  expect(validState(saved)).toBe(true);
  expect(saved.foundationJourney.location).toBe("estate");
  document
    .querySelector(".travel-map")!
    .dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  await flush();
  expect(document.querySelector(".travel-map")).toBeNull();
  expect(document.querySelector("[role=dialog]")).toBeNull();
  expect(document.body.textContent).toContain("晴川药庄");
});
it("real App sea exit opens a quote, persists through its public command and returns to the destination scene", async () => {
  const s = outerSeaCheckpoint();
  await mount(s);
  document.querySelector<HTMLButtonElement>('[data-hotspot="path"]')!.click();
  await flush();
  await click("循海路前往外海古渡");
  expect(save).not.toHaveBeenCalled();
  expect(document.querySelector(".story-travel")!.textContent).toContain(
    "54,000",
  );
  await click("动身前往");
  expect(save).toHaveBeenCalledOnce();
  const saved = vi.mocked(save).mock.calls[0]![0];
  expect(saved.outerSea.location).toBe("ferry");
  expect(saved.month - s.month).toBe(6);
  expect(validState(saved)).toBe(true);
  await click("进入外海古渡");
  expect(document.querySelector(".story-travel")).toBeNull();
  expect(document.querySelector(".outer-sea")!.textContent).toContain(
    "外海古渡",
  );
});
