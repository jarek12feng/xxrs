import { mistCheckpoint } from "../tools/mist-checkpoint";
// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import {
  createGame,
  dispatch,
  type AdventureAction,
  type State,
} from "../src/core";
import { load, save } from "../src/save";
const audio = vi.hoisted(() => ({
  cue: vi.fn(),
  settings: vi.fn(),
  scene: vi.fn(),
  hidden: vi.fn(),
  dispose: vi.fn(),
  unlock: vi.fn(async () => true),
}));
vi.mock("../src/audio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/audio")>()),
  createSoundscape: () => audio,
}));
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
let app: VueApp;
const flush = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};
function button(label: string) {
  const b = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  if (!b) throw new Error(`Missing ${label}`);
  return b;
}
function home() {
  let s = createGame("回家", "wood", 42);
  for (const [i, action] of (
    [
      "inspect",
      "depart",
      "medicine",
      "prepare",
      "depart",
      "trail",
      "challenge",
    ] as AdventureAction[]
  ).entries())
    s = dispatch(s, { id: `home-${i}`, type: "adventure", action });
  return s;
}
async function mount(s: State) {
  vi.mocked(load).mockResolvedValue({ state: s, recovered: false });
  app = createApp(App).use(createPinia());
  app.mount(document.body.appendChild(document.createElement("div")));
  await flush();
  button("继续游戏").click();
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
it("shows both irreversible consequences before committing, and waits for persistence before sound and response", async () => {
  let finish!: () => void;
  vi.mocked(save).mockImplementation(
    () =>
      new Promise<void>((r) => {
        finish = r;
      }),
  );
  await mount(home());
  expect(button("留下成株").textContent).toContain("山下伤者需等下一队送药");
  expect(button("带回成株").textContent).toContain("灵草 4");
  button("带回成株").click();
  await flush();
  expect(audio.cue).not.toHaveBeenCalled();
  expect(vi.mocked(save).mock.calls[0]![0].adventure.rescueChoice).toBe(
    "supplies",
  );
  finish();
  await flush();
  expect(audio.cue).toHaveBeenCalledWith("choice");
  expect(document.querySelector(".feedback-layer")).toBeNull();
  expect(
    document.querySelector(".scene-response .reply-person")?.textContent,
  ).toContain("陆迟");
});
it("keeps the decision available with no success audio when saving fails", async () => {
  vi.mocked(save).mockRejectedValue(new Error("磁盘不可写"));
  await mount(home());
  button("留下成株").click();
  await flush();
  expect(document.body.textContent).toContain("磁盘不可写");
  expect(button("留下成株").disabled).toBe(false);
  expect(audio.cue).not.toHaveBeenCalled();
  expect(document.querySelector(".action-feedback")).toBeNull();
});
it("restores choice consequences and contextual guidance without replaying rewards or audio", async () => {
  const s = dispatch(home(), {
    id: "chosen",
    type: "adventure",
    action: "return",
  });
  await mount(s);
  expect(
    document.querySelector('[aria-label="初入仙途指引"]')?.textContent,
  ).toContain("护根");
  expect(
    document.querySelector('[aria-label="初入仙途指引"] > div > strong')
      ?.textContent === "第一段归路已完成",
  ).toBe(true);
  expect(save).not.toHaveBeenCalled();
  expect(audio.cue).not.toHaveBeenCalled();
});

it("exposes independent sound controls without touching game saves", async () => {
  await mount(home());
  button("菜单").click();
  await flush();
  button("显示与声音").click();
  await flush();
  const sliders = document.querySelectorAll<HTMLInputElement>(
    'input[type="range"]',
  );
  expect(sliders).toHaveLength(3);
  sliders[0]!.value = "0.2";
  sliders[0]!.dispatchEvent(new Event("input", { bubbles: true }));
  await flush();
  expect(localStorage.getItem("xxrs-local-music-volume")).toBe("0.2");
  sliders[1]!.value = "0";
  sliders[1]!.dispatchEvent(new Event("input", { bubbles: true }));
  await flush();
  expect(audio.settings).toHaveBeenLastCalledWith(
    expect.objectContaining({ ambience: 0 }),
  );
  expect(save).not.toHaveBeenCalled();
});
it("makes the first guidance action perform the promised revisit", async () => {
  const s = dispatch(home(), {
    id: "chosen",
    type: "adventure",
    action: "return",
  });
  await mount(s);
  button("回访药工，看看后来").click();
  await flush();
  expect(vi.mocked(save).mock.calls[0]![0].adventure.road.thanked).toBe(true);
});
it("travels from the map only after a successful save and exposes local scenery", async () => {
  const state = dispatch(createGame("行者", "wood", 42), {
    id: "clue",
    type: "adventure",
    action: "inspect",
  });
  await mount(state);
  button("地图").click();
  await flush();
  const pin = document.querySelector<HTMLButtonElement>(
    '[aria-label="山门药庐，可前往"]',
  )!;
  expect(pin).not.toBeNull();
  pin.click();
  await flush();
  expect(save).not.toHaveBeenCalled();
  vi.mocked(save).mockRejectedValueOnce(new Error("磁盘不可写"));
  button("沿路前往").click();
  await flush();
  expect(document.querySelector('[aria-label="主线地标详情"]')).not.toBeNull();
  expect(document.querySelector(".atlas-objective")?.textContent).toContain(
    "雨夜渡口",
  );
  vi.mocked(save).mockResolvedValueOnce(undefined);
  button("沿路前往").click();
  await flush();
  expect(document.querySelector('[aria-label="主线地标详情"]')).toBeNull();
  expect(document.querySelector(".landmark-presence")?.textContent).toContain(
    "瓷碗",
  );
  expect(audio.scene).toHaveBeenLastCalledWith("warm", null);
});
it("keeps legacy exploration available from the new route atlas", async () => {
  await mount(home());
  button("地图").click();
  await flush();
  button("道友寻亲").click();
  await flush();
  for (const title of ["回春谷", "雾岭古道", "雾海孤灯"]) {
    expect(
      document.querySelector(`[aria-label="${title}探索操作区"]`),
    ).not.toBeNull();
  }
});
it("applies a mute made in another same-origin game tab without writing a save", async () => {
  await mount(home());
  button("开启声音").click();
  await flush();
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "xxrs-sound-v1",
      newValue: JSON.stringify({
        enabled: false,
        ambience: 0.25,
        effects: 0.35,
      }),
    }),
  );
  await flush();
  expect(audio.settings).toHaveBeenLastCalledWith(
    expect.objectContaining({ enabled: false }),
  );
  expect(save).not.toHaveBeenCalled();
});
it("plays the corresponding cultivation figure only after persistence succeeds, and stops after its beat", async () => {
  const s = home();
  s.story.stage = "waiting";
  await mount(s);
  button("洞府修行").click();
  await flush();
  button("劳作").click();
  await flush();
  expect(
    document.querySelector(".practice-stage")?.getAttribute("data-activity"),
  ).toBe("work");
  expect(
    document.querySelector(".practice-stage")?.getAttribute("data-playing"),
  ).toBe("false");
  vi.mocked(save).mockRejectedValueOnce(new Error("磁盘不可写"));
  button("行动一月").click();
  await flush();
  expect(
    document.querySelector(".practice-stage")?.getAttribute("data-playing"),
  ).toBe("false");
  vi.mocked(save).mockResolvedValueOnce(undefined);
  button("行动一月").click();
  await flush();
  expect(
    document.querySelector(".practice-stage")?.getAttribute("data-playing"),
  ).toBe("true");
  expect(
    document
      .querySelector(".practice-stage .character-sprite img")
      ?.getAttribute("src"),
  ).toContain("/art/characters/hero-male.webp");
  expect(
    document
      .querySelector(".practice-stage .practice-prop img")
      ?.getAttribute("src"),
  ).toContain("/art/items/herbs.webp");
  await vi.advanceTimersByTimeAsync(3600);
  await flush();
  expect(
    document.querySelector(".practice-stage")?.getAttribute("data-playing"),
  ).toBe("false");
});
it("automatic work emits a single death cue rather than a routine work cue", async () => {
  const s = home();
  s.age = s.limit - 1;
  await mount(s);
  button("洞府修行").click();
  await flush();
  button("劳作").click();
  await flush();
  audio.cue.mockClear();
  button("自动行动").click();
  await flush();
  await vi.advanceTimersByTimeAsync(900);
  await flush();
  expect(audio.cue).toHaveBeenCalledWith("death");
  expect(audio.cue).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1600);
  expect(audio.cue).toHaveBeenCalledTimes(1);
});

it("returns from the cave to the unfinished expedition after breakthrough without spending resources", async () => {
  const { expeditionSession } = await import("../tools/expedition-simulation");
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.fight();
  p.send({ type: "expedition", action: "studyArray" });
  expect(p.state.expedition.cleared).toBe(2);
  await mount(p.state);
  button("洞府修行").click();
  await flush();
  const savesBefore = vi.mocked(save).mock.calls.length;
  const links = [...document.querySelectorAll("button")].filter((b) =>
    b.textContent?.includes("回到行路，重返旧阵"),
  );
  expect(links.length).toBe(2);
  links[1]!.click();
  await flush();
  expect(document.body.textContent).toContain("蚀阵傀儡");
  expect(vi.mocked(save).mock.calls.length).toBe(savesBefore);
});

it("first relic coaching opens equipment and equips the earned item through a saved command", async () => {
  const { expeditionSession } = await import("../tools/expedition-simulation");
  const p = expeditionSession();
  p.send({ type: "equip", technique: "spring" });
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.resolve();
  if (!p.state.expedition.duel) p.send({ type: "expedition", action: "enter" });
  p.fight();
  expect(p.state.expedition.cleared).toBe(1);
  expect(p.state.realm).toBe(0);
  await mount(p.state);
  button("查看并装配首件灵器").click();
  await flush();
  expect(
    document.querySelector('[role="dialog"]')?.getAttribute("data-panel"),
  ).toBe("gear");
  const equip = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((b) => b.textContent?.includes("装配灵器") && !b.disabled)!;
  expect(equip).toBeDefined();
  equip.click();
  await flush();
  expect(vi.mocked(save).mock.calls.at(-1)![0].journey.equipped).toBe("vial");
  expect(document.body.textContent).not.toContain("药队送来的灵器，还未装配");
});

it("completes the companion field test through persisted UI commands and the actual skill panel", async () => {
  await mount(mistCheckpoint(42, "wood", "male"));
  const relation = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find(
    (b) =>
      b.getAttribute("aria-label") === "人物关系" ||
      b.textContent?.includes("人物关系"),
  );
  expect(relation).toBeDefined();
  relation!.click();
  await flush();
  button("商量这次同行").click();
  await flush();
  button("辨清稳固节点").click();
  await flush();
  button("先刻公共干道").click();
  await flush();
  button("打开功法，装配护身诀").click();
  await flush();
  expect(document.querySelector('[data-panel="skills"]')).not.toBeNull();
  const guard = [...document.querySelectorAll("article")].find(
    (a) => a.textContent?.includes("护身诀") && a.querySelector("button"),
  );
  const equip = [...(guard?.querySelectorAll("button") || [])].find((b) =>
    b.textContent?.includes("装配"),
  );
  expect(equip).toBeDefined();
  equip!.click();
  await flush();
  expect(vi.mocked(save).mock.calls.at(-1)![0].journey.support).toBe("guard");
  document
    .querySelector<HTMLButtonElement>('button[aria-label="关闭面板"]')!
    .click();
  await flush();
  const reopen = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find(
    (b) =>
      b.getAttribute("aria-label") === "人物关系" ||
      b.textContent?.includes("人物关系"),
  );
  reopen!.click();
  await flush();
  button("亲自校验归路").click();
  await flush();
  expect(vi.mocked(save).mock.calls.at(-1)![0].companionship.stage).toBe(
    "done",
  );
  expect(document.body.textContent).toContain("岔路引导");
});
