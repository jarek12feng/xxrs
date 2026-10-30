// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import { createGame } from "../src/core";
import { load, save } from "../src/save";
import { writeSlot } from "../src/save-slots";
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("../src/save-slots", () => ({
  writeSlot: vi.fn(),
  listSlots: vi.fn(async () => []),
  readSlot: vi.fn(),
  deleteSlot: vi.fn(),
}));
let app: VueApp;
const flush = async () => {
  for (let i = 0; i < 12; i++) await nextTick();
};
async function click(label: string) {
  const btn = [...document.querySelectorAll("button")].find(
    (b) =>
      b.textContent?.includes(label) ||
      b.getAttribute("aria-label")?.includes(label),
  );
  expect(btn).toBeDefined();
  btn!.click();
  await flush();
}
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.clearAllMocks();
});
it.each([true, false])(
  "a concluded life can open a fresh character only after archival succeeds: %s",
  async (archiveSucceeds) => {
    const s = createGame("旧旅人", "wood", 42, "insightful", "female");
    s.age = s.limit;
    s.month = s.age - 192;
    s.status = "dead";
    vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
    vi.mocked(save).mockResolvedValue();
    if (archiveSucceeds) vi.mocked(writeSlot).mockResolvedValue(true);
    else vi.mocked(writeSlot).mockRejectedValue(new Error("写入失败"));
    app = createApp(App).use(createPinia());
    app.mount(document.body.appendChild(document.createElement("div")));
    await flush();
    await click("继续游戏");
    expect(document.body.textContent).toContain("修行履历");
    expect(document.body.textContent).not.toMatch(
      /再入轮回|下一世|第 1 世|累计阅历/,
    );
    expect(document.body.textContent).toContain("读取存档");
    await click("另启新程");
    expect(writeSlot).toHaveBeenCalledWith(
      expect.stringMatching(/^archive-/),
      s,
    );
    expect(save).not.toHaveBeenCalled();
    expect(!!document.querySelector(".creation")).toBe(archiveSucceeds);
    if (archiveSucceeds) {
      await click("踏入仙途");
      expect(save).toHaveBeenCalledTimes(1);
      const created = vi.mocked(save).mock.calls[0]![0];
      expect(created.month).toBe(0);
      expect(created.age).toBe(192);
      expect(created.inherited).toBe("none");
      expect(created.unlocked).toEqual([]);
      expect(created.social.met).toBe(false);
      expect(document.body.textContent).toContain("修行 0 年 0 月");
    }
    if (!archiveSucceeds)
      expect(document.body.textContent).toContain("未能备份原旅程");
  },
);

it.each(["洞府修行", "人生卷宗"])(
  "new characters start at the ferry after leaving %s",
  async (screen) => {
    const s = createGame("前一角色", "wood", 42);
    vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
    vi.mocked(save).mockResolvedValue();
    vi.mocked(writeSlot).mockResolvedValue(true);
    app = createApp(App).use(createPinia());
    app.mount(document.body.appendChild(document.createElement("div")));
    await flush();
    await click("继续游戏");
    await click(screen);
    await click("系统菜单");
    await click("返回标题");
    await click("新的旅程");
    await click("保留旧旅程");
    await click("踏入仙途");
    expect(vi.mocked(save).mock.calls.at(-1)![0].adventure.step).toBe("ferry");
    expect(document.querySelector('[aria-label="洞府场景与修行"]')).toBeNull();
    expect(
      document.querySelector('[aria-label="寻人主线"]')?.textContent,
    ).toContain("雨夜渡口");
    expect(document.querySelector('[aria-label="修行暂停原因"]')).toBeNull();
  },
);
