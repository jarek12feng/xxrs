// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import { createGame, dispatch, type State } from "../src/core";
import { load, save } from "../src/save";
import { mistCheckpoint } from "../tools/mist-checkpoint";
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
  await click("继续游戏");
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
it("keeps discoveries inside the scene and shows a named arrival without a blocking receipt", async () => {
  await mount(createGame("行者", "wood"));
  await click("当前冒险");
  await click("检查药篓");
  expect(document.querySelector(".scene-response")?.textContent).toContain(
    "发现青瘴粉与归路红绳",
  );
  expect(document.querySelector(".receipt-dock")).toBeNull();
  await click("带着线索前往药庐");
  expect(document.querySelector(".scene-arrival")?.textContent).toContain(
    "抵达 · 山门药庐",
  );
  expect(button("请温蘅").disabled).toBe(false);
  await vi.advanceTimersByTimeAsync(4200);
  expect(document.querySelector(".scene-arrival")).toBeNull();
});
it("NPC choices have a named response, affection and memory before returning to interactions", async () => {
  await mount(mistCheckpoint());
  await click("人物关系");
  await click("赴约 · 一月");
  await click("用研读所得标出安全通路");
  expect(document.querySelector(".action-feedback.playing")).toBeNull();
  const dialog = document.querySelector("[role=dialog]");
  expect(dialog?.textContent).toContain("沈听澜");
  expect(dialog?.textContent).toContain("共同记忆 · 共勘旧路");
  expect(dialog?.textContent).toContain("+16");
  expect(dialog?.querySelector(".reply-person")).not.toBeNull();
  expect(dialog?.textContent).not.toContain("山门暂掩");
  await click("知晓结果");
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "人物关系",
  );
  expect(document.querySelector(".social-content")).not.toBeNull();
});
it("NPC response is not fabricated on save failure", async () => {
  await mount(mistCheckpoint());
  await click("人物关系");
  await click("赴约 · 一月");
  vi.mocked(save).mockRejectedValueOnce(new Error("保存失败"));
  await click("用研读所得标出安全通路");
  expect(document.querySelector(".reply-person")).toBeNull();
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "同行 · 雨中的旧路",
  );
});
it("combat shows damage at the controls, gates rapid follow-up and keeps the final result", async () => {
  const s = dispatch(mistCheckpoint(), {
    type: "arenaScout",
    id: "scout-test",
  });
  await mount(s);
  await click("听松擂台");
  await click("登台挑战");
  await vi.advanceTimersByTimeAsync(650);
  await click("破势");
  expect(document.querySelector(".combat-receipt")?.textContent).toContain(
    "第1合破势",
  );
  expect(document.querySelector(".combat-intent")?.textContent).toContain(
    "对手",
  );
  expect(document.querySelector(".receipt-dock")).toBeNull();
  expect(button("破势").disabled).toBe(true);
  await click("破势");
  expect(save).toHaveBeenCalledTimes(2);
  for (let i = 0; i < 2 && !document.querySelector(".action-feedback"); i++) {
    await vi.advanceTimersByTimeAsync(650);
    await click(i === 0 ? "破势" : "守息");
  }
  expect(document.querySelector("[role=dialog]")).not.toBeNull();
  await click("跳过演出");
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "擂台获胜",
  );
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "归元息",
  );
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "赛后邀约",
  );
});
it("an expanded ordinary receipt stays readable beyond the toast timeout", async () => {
  await mount();
  await click("行动一月");
  await click("查看详情");
  await vi.advanceTimersByTimeAsync(10000);
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "吐纳完成",
  );
  expect(save).toHaveBeenCalledTimes(1);
});

it("cancels an appointment-crossing retreat without advancing time and explains the safe alternative", async () => {
  let s = state();
  let id = 0;
  while (s.month < 30) {
    s = dispatch(
      s,
      s.pending
        ? {
            type: "choose",
            instanceId: s.pending.id,
            option: s.pending.kind === "letter" ? "listen" : "herbs",
            id: `retreat-help-${id++}`,
          }
        : {
            type: "advance",
            activity: "work",
            months: Math.min(12, 30 - s.month),
            id: `retreat-help-${id++}`,
          },
    );
  }
  expect(s.story.stage).toBe("waiting");
  await mount(s);
  await click("闭关固本");
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog?.textContent).toContain("这次闭关将错过约期");
  expect(dialog?.textContent).toContain("普通行动遇到赴约剧情会自动暂停");
  await click("暂不闭关 · 保留约定");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(save).not.toHaveBeenCalled();
  expect(text()).toContain("第 30 月");
});
it("opens character and inventory overlays without advancing the world", async () => {
  await mount();
  const before = vi.mocked(save).mock.calls.length;
  document
    .querySelector<HTMLButtonElement>('[aria-label="人物属性 C"]')!
    .click();
  await flush();
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "年岁 / 寿元",
  );
  document.querySelector<HTMLButtonElement>('[aria-label="关闭面板"]')!.click();
  await flush();
  await click("储物袋");
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "当前灵器",
  );
  expect(vi.mocked(save).mock.calls.length).toBe(before);
});

it("shows routine sect work in place and offers equipment immediately after promotion", async () => {
  await mount(state());
  await click("拜访师门");
  await click("拜入丹堂");
  await click("整理旧卷");
  expect(
    document.querySelector(".world-panel .scene-response")?.textContent,
  ).toContain("师门事务完成");
  await click("整理旧卷");
  await click("整理旧卷");
  await click("为护住身边的人");
  await click("晋升外门");
  expect(document.querySelector(".feedback-layer")?.textContent).toContain(
    "晋升外门",
  );
  expect(document.querySelector(".feedback-layer")?.textContent).toContain(
    "长春诀",
  );
  await click("查看并装配新功法");
  expect(document.querySelector("[role=dialog]")?.textContent).toContain(
    "功法",
  );
  await click("装配长春诀");
  expect(vi.mocked(save).mock.lastCall?.[0].journey.main).toBe("spring");
});
it("returns to the selected exploration place after a modal result", async () => {
  const s = mistCheckpoint();
  s.journey.maps.valley = 3;
  s.journey.approach = "trace";
  s.journey.maps.peak = 3;
  s.journey.encounters.peak = {
    kind: "raider",
    aid: "none",
    passed: true,
    attempts: 1,
    lastRoll: 1,
    lastChance: 100,
    outcome: "win",
  };
  s.journey.maps.sea = 2;
  s.journey.encounters.sea = {
    kind: "raider",
    aid: "none",
    passed: true,
    attempts: 1,
    lastRoll: 1,
    lastChance: 100,
    outcome: "win",
  };
  await mount(s);
  await click("地图");
  await click("道友寻亲");
  await click("雾海孤灯");
  const explore = [
    ...document.querySelectorAll<HTMLButtonElement>(".map-card button"),
  ].find((b) => b.textContent?.includes("继续追寻") && !b.disabled)!;
  explore.click();
  await flush();
  expect(text()).toContain("一封终于到家的信");
  await click("知晓结果");
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    "此地故事已完成",
  );
  expect(
    document.querySelector('.map-card:not([style*="display: none"])')
      ?.textContent,
  ).toContain("雾海孤灯");
});
