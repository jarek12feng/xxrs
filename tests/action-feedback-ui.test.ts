// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import { createGame, dispatch, type State } from "../src/core";
import { load, save } from "../src/save";
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
let app: VueApp;
const text = () => document.body.textContent || "";
const flush = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};
function button(label: string) {
  const b = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  if (!b) throw new Error(`Missing button ${label}`);
  return b;
}
async function click(label: string) {
  button(label).click();
  await flush();
}
function state() {
  let s = dispatch(createGame("验丹", "wood", 42), {
    type: "advance",
    activity: "gather",
    months: 3,
    id: "a",
  });
  return dispatch(s, {
    type: "choose",
    instanceId: s.pending!.id,
    option: "promise",
    id: "b",
  });
}
async function mount(s = state()) {
  vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
  app = createApp(App).use(createPinia());
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  await click("洞府修行");
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(save).mockReset().mockResolvedValue();
});
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.useRealTimers();
});
it("shows an alchemy transition, then actual costs and reward without opening the log", async () => {
  await mount();
  await click("炼筑基丹");
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "丹火初燃",
  );
  expect(document.querySelector(".shell")?.hasAttribute("inert")).toBe(true);
  await vi.advanceTimersByTimeAsync(1400);
  const result = document.querySelector('[role="dialog"]')?.textContent;
  expect(result).toContain("丹成");
  expect(result).toContain("灵石 −12");
  expect(result).toContain("28 → 19");
  expect(result).toContain("0 → 1");
  await click("知晓结果");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
});
it("blocks duplicate clicks while saving and while the result is open", async () => {
  let finish!: () => void;
  vi.mocked(save).mockImplementation(
    () => new Promise<void>((resolve) => (finish = resolve)),
  );
  await mount();
  const refine = button("炼筑基丹");
  refine.click();
  refine.click();
  await flush();
  expect(save).toHaveBeenCalledTimes(1);
  expect(text()).toContain("正在结算并保存");
  finish();
  await flush();
  refine.click();
  await flush();
  expect(save).toHaveBeenCalledTimes(1);
  await click("跳过演出");
  expect(text()).toContain("丹成");
});
it("never shows a successful receipt or applies resources on save failure", async () => {
  vi.mocked(save).mockRejectedValue(new Error("存储不可用"));
  await mount();
  await click("炼筑基丹");
  expect(text()).toContain("存储不可用");
  expect(document.querySelector(".action-feedback")).toBeNull();
  expect(button("炼筑基丹").disabled).toBe(false);
});
it.each([1, 123456])(
  "makes seed %s breakthrough outcome visible after confirmation closes",
  async (seed) => {
    const s = state();
    s.seed = seed;
    s.qi = 360;
    s.pills = 1;
    const expected = dispatch(s, { type: "break", pill: true, id: "expected" });
    await mount(s);
    await click("叩问天关");
    await click("凝神，突破");
    expect(text()).toContain("气聚丹田");
    await click("跳过演出");
    const result = document.querySelector('[role="dialog"]')?.textContent;
    expect(result).toContain(expected.realm ? "筑基已成" : "突破未成");
    expect(result).toContain("1 → 0");
    expect(save).toHaveBeenCalledTimes(1);
  },
);
it("shows alchemy results before the pending letter and never advances that story automatically", async () => {
  const s = state();
  s.month = 10;
  s.age = 202;
  await mount(s);
  await click("炼筑基丹");
  await click("跳过演出");
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "丹成",
  );
  await click("知晓结果");
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "未寄",
  );
  expect((vi.mocked(save).mock.calls[0][0] as State).pending?.kind).toBe(
    "letter",
  );
});
it("ordinary actions show immediate deltas without blocking the next action", async () => {
  await mount();
  await click("行动一月");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.querySelector(".receipt-dock")?.textContent).toContain(
    "修为",
  );
  await click("行动一月");
  expect(save).toHaveBeenCalledTimes(2);
});
it("Escape skips the animation first, then dismisses the result without another transaction", async () => {
  await mount();
  await click("炼筑基丹");
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await flush();
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "丹成",
  );
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await flush();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
});
it("reduced-motion preference skips the ceremonial delay", async () => {
  const match = vi
    .spyOn(window, "matchMedia")
    .mockReturnValue({ matches: true } as MediaQueryList);
  try {
    await mount();
    await click("炼筑基丹");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "丹成",
    );
  } finally {
    match.mockRestore();
  }
});
it("refresh during the animation loads the committed pill instead of replaying the action", async () => {
  await mount();
  await click("炼筑基丹");
  const committed = vi.mocked(save).mock.calls[0][0];
  app.unmount();
  document.body.innerHTML = "";
  await mount(committed);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
  expect(text()).toContain("筑基丹");
  expect(committed.pills).toBe(1);
});
it("automatic queued alchemy does not require dismissing a modal every tick", async () => {
  const s = state();
  s.journey.queue = [{ action: "refine", remaining: 1 }];
  await mount(s);
  await click("修行安排");
  const labels = [...document.querySelectorAll("button")].map(
    (b) => b.textContent,
  );
  const run = labels.find((label) => label?.includes("执行安排"));
  expect(run).toBeTruthy();
  await click(run!);
  await vi.advanceTimersByTimeAsync(800);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.querySelector(".receipt-dock")?.textContent).toContain(
    "丹成",
  );
});
