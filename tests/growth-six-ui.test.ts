// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import { load, save } from "../src/save";
import { expeditionSession } from "../tools/expedition-simulation";
import type { State } from "../src/core";
vi.mock("../src/audio", async (original) => ({
  ...(await original<typeof import("../src/audio")>()),
  createSoundscape: () => ({
    cue: vi.fn(),
    settings: vi.fn(),
    scene: vi.fn(),
    hidden: vi.fn(),
    dispose: vi.fn(),
    unlock: vi.fn(async () => true),
  }),
}));
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
let app: VueApp;
async function flush() {
  for (let i = 0; i < 10; i++) await nextTick();
}
function button(label: string) {
  const found = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  if (!found) throw new Error(`Missing ${label}`);
  return found;
}
async function mount(s: State) {
  vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
  app = createApp(App).use(createPinia());
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  button("继续游戏").click();
  await flush();
  button("洞府修行").click();
  await flush();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(save).mockResolvedValue();
});
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.useRealTimers();
});
it("stops at full qi, links to the actual breakthrough preview and resumes no hidden ticks", async () => {
  const s = expeditionSession().state;
  s.qi = 359;
  await mount(s);
  button("自动行动").click();
  await vi.advanceTimersByTimeAsync(800);
  await flush();
  expect(
    document.querySelector('[aria-label="修行暂停原因"]')?.textContent,
  ).toContain("修为已满");
  const calls = vi.mocked(save).mock.calls.length;
  await vi.advanceTimersByTimeAsync(2400);
  expect(vi.mocked(save).mock.calls.length).toBe(calls);
  button("查看突破把握").click();
  await flush();
  expect(document.querySelector('[aria-label="突破操作区"]')).not.toBeNull();
  expect(document.querySelector(".preparation-values")?.textContent).toContain(
    "各项单独对照",
  );
});
it("keeps ordinary work usable when qi was already full", async () => {
  const s = expeditionSession().state;
  s.qi = 360;
  await mount(s);
  button("劳作").click();
  await flush();
  button("自动行动").click();
  await vi.advanceTimersByTimeAsync(800);
  await flush();
  expect(document.querySelector('[aria-label="修行暂停原因"]')).toBeNull();
  expect(button("暂停")).toBeDefined();
});
it("pauses a queue on its next unavailable task without spending an extra month", async () => {
  const p = expeditionSession();
  p.prepare();
  const s = p.state;
  s.journey.queue = [
    { action: "work", remaining: 1 },
    { action: "refine", remaining: 1 },
  ];
  s.herbs = 0;
  await mount(s);
  button("修行安排").click();
  await flush();
  button("执行安排").click();
  await flush();
  await vi.advanceTimersByTimeAsync(800);
  await flush();
  expect(
    document.querySelector('[aria-label="修行暂停原因"]')?.textContent,
  ).toContain("需要灵草");
  const saved = vi.mocked(save).mock.calls.at(-1)![0];
  expect(saved.month).toBe(s.month + 1);
  const count = vi.mocked(save).mock.calls.length;
  await vi.advanceTimersByTimeAsync(2400);
  expect(vi.mocked(save).mock.calls.length).toBe(count);
  button("调整修行安排").click();
  await flush();
  expect(document.body.textContent).toContain("剩余 1 次");
});
it("does not announce a successful milestone if persistence fails", async () => {
  const s = expeditionSession().state;
  s.qi = 359;
  await mount(s);
  vi.mocked(save).mockRejectedValue(new Error("test storage unavailable"));
  button("自动行动").click();
  await vi.advanceTimersByTimeAsync(800);
  await flush();
  expect(document.querySelector('[aria-label="修行暂停原因"]')).toBeNull();
  expect(document.body.textContent).toContain("test storage unavailable");
});
