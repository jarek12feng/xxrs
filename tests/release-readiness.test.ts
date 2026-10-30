// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import RoadPanel from "../src/RoadPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import FeedbackPanel from "../src/feedback/FeedbackPanel.vue";
import { createGame, dispatch, type Intent } from "../src/core";
import { feedbackSummary } from "../src/feedback/feedback";
import { journeyPreparation } from "../src/foundation-journey/preparation";
import { load, save } from "../src/save";
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
let app: VueApp;
const host = () => document.body.appendChild(document.createElement("div"));
const flush = async () => {
  for (let i = 0; i < 10; i++) await nextTick();
};
async function click(label: string) {
  const b = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  if (!b) throw new Error(`Missing ${label}`);
  b.click();
  await flush();
}
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});
it("feedback is an allowlisted summary, not a serialized player state", () => {
  const s = createGame("private-name-unique", "wood", 123456789);
  s.log.push({ month: 0, text: "private-log-marker", kind: "test" });
  const before = structuredClone(s),
    result = feedbackSummary(s, "桌面版");
  expect(result).toContain("playtest-");
  expect(result).not.toContain(s.name);
  expect(result).not.toContain("123456789");
  expect(result).not.toContain("private-log-marker");
  expect(s).toEqual(before);
  expect(feedbackSummary(null, "网页版")).toContain("尚未建角");
});
it("copy failure leaves selectable text and does not falsely claim upload or success", async () => {
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  app = createApp(FeedbackPanel, { game: null });
  app.mount(host());
  await click("复制反馈信息");
  expect(document.body.textContent).toContain("无法自动复制");
  expect(document.activeElement?.tagName).toBe("TEXTAREA");
});
it("includes entered feedback in both clipboard and downloaded text", async () => {
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  let downloaded: Blob | undefined;
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    downloaded = blob as Blob;
    return "blob:feedback-test";
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  app = createApp(FeedbackPanel, { game: null });
  app.mount(host());
  for (const [id, value] of [
    ["problem", "修行队列提前结束"],
    ["steps", "筑基后安排十二个月\n只执行一月"],
    ["expected", "希望按计划继续"],
  ]) {
    const input = document.querySelector<HTMLTextAreaElement>(
      `#feedback-${id}`,
    )!;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  await flush();
  await click("复制反馈信息");
  const copied = clipboard.mock.calls[0][0];
  expect(copied).toContain("修行队列提前结束");
  expect(copied).toContain("筑基后安排十二个月\n只执行一月");
  expect(copied).toContain("希望按计划继续");
  expect(copied).toContain("jarek840713@gmail.com");
  expect(copied).toContain("playtest-");
  await click("导出反馈文本");
  expect(await downloaded!.text()).toBe(copied);
});
it("system help and feedback remain available during a pending story without changing the save", async () => {
  const s = dispatch(createGame("检查", "wood", 42), {
    id: "start",
    type: "advance",
    activity: "work",
    months: 3,
  });
  expect(s.pending).not.toBeNull();
  vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
  vi.mocked(save).mockReset();
  app = createApp(App).use(createPinia());
  app.mount(host());
  await flush();
  await click("设置与帮助");
  await click("玩法说明");
  expect(document.body.textContent).toContain("且持有一枚筑基丹");
  expect(document.body.textContent).toContain("失约后仍可独自重返");
  await click("✕");
  await click("设置与帮助");
  await click("版本与反馈");
  expect(
    document.querySelector<HTMLTextAreaElement>("#feedback-summary")?.value,
  ).toContain("存档格式：18");
  await click("打开本机记录工具");
  await flush();
  // Lazy observer must be opt-in; opening it must never persist game changes.
  expect(vi.mocked(save)).not.toHaveBeenCalled();
});
it("homecoming does not explain future pass rules; the actual pass does", async () => {
  const s = createGame("检查", "wood", 42);
  s.adventure.step = "done";
  const props = reactive({ game: s, busy: false });
  app = createApp({ render: () => h(RoadPanel, props) });
  app.mount(host());
  await flush();
  expect(document.body.textContent).not.toContain("三种解法满足条件后必定成功");
  expect(document.body.textContent).not.toContain("第二卷");
  props.game.adventure.road.stage = "pass";
  await flush();
  expect(document.body.textContent).toContain("三种解法满足条件后必定成功");
});
it("recovery button remains usable with more than twelve injuries and respects command limits", async () => {
  const s = createGame("检查", "wood", 42);
  s.realm = 1;
  s.injury = 14;
  const intents: Intent[] = [];
  app = createApp({
    render: () =>
      h(FoundationPanel, {
        game: s,
        busy: false,
        onAct: (i: Intent) => intents.push(i),
      }),
  });
  app.mount(host());
  await flush();
  await click("免费静养");
  expect(intents).toEqual([{ type: "advance", activity: "rest", months: 12 }]);
  const n = dispatch(s, { ...intents[0]!, id: "recover" });
  expect(n).not.toBe(s);
  expect(n.injury).toBeLessThan(s.injury);
  s.pending = { id: "blocked", kind: "meeting" } as typeof s.pending;
  expect(journeyPreparation(s)).toBeNull();
});
