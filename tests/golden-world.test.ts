// @vitest-environment happy-dom
import { createApp, h, shallowRef, nextTick } from "vue";
import { it, expect, vi } from "vitest";
import World from "../src/golden-scene/GoldenWorld.vue";
import Scenes from "../src/scene2d/StoryScenes.vue";
import Conclave from "../src/conclave/ConclavePanel.vue";
import { conclaveCheckpoint } from "../tools/conclave-checkpoint";
import {
  goldenSnapshot,
  goldenCue,
  goldenCombat,
  goldenPerformance,
  goldenGuardian,
} from "../src/golden-scene/presentation";
import { dispatch, type Intent } from "../src/core";
function checkpoint() {
  let s = conclaveCheckpoint();
  let n = 0;
  for (const action of [
    { kind: "wait" },
    { kind: "visit" },
    { kind: "meet" },
    { kind: "contest" },
  ] as const)
    s = dispatch(s, { type: "conclave", action, id: `world-${++n}` });
  return s;
}
it("金丹交锋采用真实人物与气势，识海阵枢不替换成人族或怪物", () => {
  const s = checkpoint();
  const before = JSON.stringify(s);
  const p = goldenCombat(s, "conclave")!;
  expect(p.enemyName).toBe("顾沧遥");
  expect(p.enemyImage).toContain("gu-cangyao");
  expect(p.player).toBe(s.conclave.duel!.hp);
  expect(p.enemyMax).toBe(300);
  expect(JSON.stringify(s)).toBe(before);
  s.conclave.duel = { ...s.conclave.duel!, kind: "vault", index: 1 };
  s.conclave.depth = 1;
  expect(goldenCombat(s, "conclave")!.array).toBe(true);
  expect(goldenCombat(s, "conclave")!.enemyImage).toBeUndefined();
});
it("取宝、温养、转修和突破只响应成功增加，撤离与跨角色不补造成功", () => {
  const s = conclaveCheckpoint();
  const before = goldenSnapshot(s, "conclave");
  expect(goldenCue(before, before)).toBeNull();
  expect(goldenCue(before, { ...before, depth: 1 })).toContain("定神珠");
  expect(goldenCue(before, { ...before, attuned: true })).toContain("护体");
  expect(goldenCue(before, { ...before, method: "inherit" })).toContain("新法");
  expect(goldenCue(before, { ...before, stage: 2 })).toContain("丹元");
  expect(
    goldenCue({ ...before, combat: true }, { ...before, combat: false }),
  ).toBeNull();
  expect(
    goldenCue(before, { ...before, life: before.life + 1, depth: 1 }),
  ).toBeNull();
  expect(goldenCue(before, { ...before, alive: false, depth: 1 })).toBeNull();
  expect(goldenCue(before, { ...before, pending: true, depth: 1 })).toBeNull();
});
it("读档不播旧结果；温养后收面板仍能看反馈，跳过和卸载清理", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const state = shallowRef(conclaveCheckpoint());
  state.value.conclave.depth = 1;
  const focus = shallowRef("treasure");
  let performed = 0;
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(World, {
        game: state.value,
        domain: "conclave",
        focus: focus.value,
        onPerformed: () => {
          performed++;
          focus.value = "";
        },
      }),
  });
  app.mount(host);
  const baselineTimers = vi.getTimerCount();
  try {
    expect(host.querySelector(".golden-caption")).toBeNull();
    const next = structuredClone(state.value);
    next.conclave.attuned = true;
    state.value = next;
    await nextTick();
    await nextTick();
    expect(performed).toBe(1);
    expect(vi.getTimerCount()).toBe(baselineTimers + 1);
    expect(host.textContent).toContain("定神珠融入");
    expect(host.querySelector(".pearl.attuned")).not.toBeNull();
    state.value = structuredClone(next);
    await nextTick();
    expect(performed).toBe(1);
    expect(host.querySelector(".golden-caption")).not.toBeNull();
    host.querySelector<HTMLButtonElement>(".golden-caption button")?.click();
    await nextTick();
    expect(host.querySelector(".golden-caption")).toBeNull();
  } finally {
    app.unmount();
    expect(vi.getTimerCount()).toBe(baselineTimers);
    vi.useRealTimers();
  }
});
it("交锋隐藏探索热点，只有一份可操作招式；未收到成功状态不播放命中", async () => {
  const s = checkpoint();
  const commands: Intent[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Conclave, {
        game: s,
        busy: false,
        onAct: (i: Intent) => commands.push(i),
      }),
  });
  app.mount(host);
  try {
    expect(host.querySelectorAll("[data-hotspot]")).toHaveLength(0);
    expect(host.querySelector(".combat-field")).not.toBeNull();
    expect(host.querySelectorAll(".combat-bar")).toHaveLength(1);
    const b = [
      ...host.querySelectorAll<HTMLButtonElement>(".combat-bar button"),
    ].find((b) => b.textContent?.includes("守势"))!;
    b.click();
    await nextTick();
    expect(commands).toEqual([
      { type: "conclave", action: { kind: "move", move: "guard" } },
    ]);
    expect(
      host.querySelector(".combat-field")?.getAttribute("data-phase"),
    ).toBe("ready");
    expect(s.conclave.duel!.turn).toBe(0);
  } finally {
    app.unmount();
  }
});
it("邀约经古渡对象进入，返回石道保留人物且不发规则命令", async () => {
  const s = conclaveCheckpoint();
  const before = JSON.stringify(s);
  const commands: Intent[] = [];
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(Scenes, {
        game: s,
        busy: false,
        showRoad: false,
        onAct: (i: Intent) => commands.push(i),
      }),
  });
  app.mount(host);
  try {
    expect(
      host.querySelector(".story-chapters")?.textContent ?? "",
    ).not.toContain("诸宗会");
    host.querySelector<HTMLButtonElement>("[data-hotspot=letter]")!.click();
    await nextTick();
    expect(
      host.querySelector(".story-scenes")?.getAttribute("data-chapter"),
    ).toBe("conclave");
    expect(host.querySelector('img[alt="顾沧遥在现场"]')).not.toBeNull();
    host.querySelector<HTMLButtonElement>("[data-hotspot=shore]")!.click();
    await nextTick();
    expect(
      host.querySelector(".story-scenes")?.getAttribute("data-chapter"),
    ).toBe("sea");
    expect(commands).toEqual([]);
    expect(JSON.stringify(s)).toBe(before);
  } finally {
    app.unmount();
  }
});
it("会谷走近可略过，忙碌时停止，局部移动不改规则状态", async () => {
  const s = checkpoint();
  s.conclave.duel = null;
  const before = JSON.stringify(s);
  const focus = shallowRef("");
  const busy = shallowRef(false);
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(World, {
        game: s,
        domain: "conclave",
        focus: focus.value,
        busy: busy.value,
      }),
  });
  app.mount(host);
  try {
    host
      .querySelector<HTMLImageElement>(".walk-crop img")!
      .dispatchEvent(new Event("load"));
    await nextTick();
    focus.value = "arena";
    await nextTick();
    expect(
      host.querySelector(".walking-actor")?.getAttribute("data-moving"),
    ).toBe("true");
    [...host.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.textContent === "略过走近")!
      .click();
    await nextTick();
    expect(
      host.querySelector(".walking-actor")?.getAttribute("data-moving"),
    ).toBe("false");
    expect(
      (host.querySelector(".walking-actor") as HTMLElement).style.left,
    ).toBe("58%");
    focus.value = "friends";
    await nextTick();
    busy.value = true;
    await nextTick();
    expect(
      host.querySelector(".walking-actor")?.getAttribute("data-moving"),
    ).toBe("false");
    expect(JSON.stringify(s)).toBe(before);
  } finally {
    app.unmount();
  }
});
it("后台中断成功反馈，回来与重新读取不重播", async () => {
  const state = shallowRef(conclaveCheckpoint());
  const host = document.createElement("div");
  const app = createApp({
    render: () => h(World, { game: state.value, domain: "conclave" }),
  });
  app.mount(host);
  const hidden = vi.spyOn(document, "hidden", "get");
  try {
    const next = structuredClone(state.value);
    next.conclave.wins = 1;
    state.value = next;
    await nextTick();
    expect(host.querySelector(".golden-caption")).not.toBeNull();
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(host.querySelector(".golden-caption")).toBeNull();
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    state.value = structuredClone(next);
    await nextTick();
    expect(host.querySelector(".golden-caption")).toBeNull();
  } finally {
    app.unmount();
    hidden.mockRestore();
  }
});

it("器物反馈只展示实际取得的物品，外府首胜不提前解封两件宝物", () => {
  const s = conclaveCheckpoint();
  const before = {
    ...goldenSnapshot(s, "sea"),
    depth: 0,
    seal: false,
    manual: false,
  };
  const first = goldenPerformance(before, { ...before, depth: 1 })!;
  expect(first.kind).toBe("return");
  expect(first.seal).toBe(false);
  expect(first.book).toBe(false);
  const claim = goldenPerformance(before, { ...before, seal: true })!;
  expect(claim.seal).toBe(true);
  expect(claim.book).toBe(false);
  const inner = goldenPerformance(
    { ...before, depth: 1 },
    { ...before, depth: 2, seal: true, manual: true },
  )!;
  expect(inner.seal).toBe(true);
  expect(inner.book).toBe(true);
});
it("守关者只在当前未通关的秘境现场出现，离境、战斗、通关后不重影", () => {
  const s = conclaveCheckpoint();
  s.conclave.location = "vault";
  s.conclave.depth = 0;
  expect(goldenGuardian(s, "conclave")?.name).toBe("归潮守珠傀儡");
  s.conclave.depth = 1;
  expect(goldenGuardian(s, "conclave")).toEqual({
    name: "照神阵枢",
    array: true,
  });
  s.conclave.depth = 2;
  expect(goldenGuardian(s, "conclave")).toBeNull();
  s.conclave.depth = 0;
  s.conclave.location = "court";
  expect(goldenGuardian(s, "conclave")).toBeNull();
  expect(goldenGuardian(checkpoint(), "conclave")).toBeNull();
  s.outerSea.location = "ruins";
  s.outerSea.cleared = 0;
  expect(goldenGuardian(s, "sea")?.name).toBe("镇潮石卫");
  s.outerSea.cleared = 1;
  expect(goldenGuardian(s, "sea")?.name).toBe("内府守枢石卫");
});
it("转修合卷后仍展示已得功法，分段收势后清理，演出不提交命令或推进年月", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const state = shallowRef(conclaveCheckpoint());
  state.value.conclave.depth = 2;
  const host = document.createElement("div");
  const app = createApp({
    render: () => h(World, { game: state.value, domain: "conclave" }),
  });
  app.mount(host);
  const baseline = vi.getTimerCount();
  try {
    const next = structuredClone(state.value);
    next.conclave.method = "inherit";
    const expected = JSON.stringify(next);
    state.value = next;
    await nextTick();
    expect(host.querySelector('img[alt="抱元凝神录"]')).not.toBeNull();
    expect(
      host.querySelector(".golden-world")?.getAttribute("data-phase"),
    ).toBe("gather");
    await vi.advanceTimersByTimeAsync(650);
    expect(
      host.querySelector(".golden-world")?.getAttribute("data-phase"),
    ).toBe("settle");
    await vi.advanceTimersByTimeAsync(800);
    expect(
      host.querySelector(".golden-world")?.getAttribute("data-phase"),
    ).toBe("rest");
    await vi.advanceTimersByTimeAsync(600);
    expect(host.querySelector(".held-artifacts")).toBeNull();
    expect(host.querySelector(".ritual-light")).toBeNull();
    expect(JSON.stringify(state.value)).toBe(expected);
    expect(vi.getTimerCount()).toBe(baseline);
  } finally {
    app.unmount();
    vi.useRealTimers();
  }
});
it("减少动态效果保留静态器物和结果，不播放分段动作", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const original = window.matchMedia.bind(window);
  const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const result = original(query);
    Object.defineProperty(result, "matches", { value: true });
    return result;
  });
  const state = shallowRef(conclaveCheckpoint());
  state.value.conclave.depth = 1;
  const host = document.createElement("div");
  const app = createApp({
    render: () => h(World, { game: state.value, domain: "conclave" }),
  });
  app.mount(host);
  try {
    const next = structuredClone(state.value);
    next.conclave.attuned = true;
    state.value = next;
    await nextTick();
    expect(
      host.querySelector(".golden-world")?.getAttribute("data-phase"),
    ).toBe("rest");
    expect(host.textContent).toContain("定神珠融入");
    expect(host.querySelector(".pearl")).not.toBeNull();
    await vi.advanceTimersByTimeAsync(1800);
    expect(host.querySelector(".golden-caption")).toBeNull();
  } finally {
    app.unmount();
    media.mockRestore();
    vi.useRealTimers();
  }
});

it("打坐图未就绪时保留站姿，载入后切换；快速连续出招正确取消浏览器计时器", async () => {
  const state = shallowRef(checkpoint());
  const host = document.createElement("div");
  const original = globalThis.clearTimeout;
  const cancel = vi
    .spyOn(globalThis, "clearTimeout")
    .mockImplementation(function (this: unknown, id) {
      // Browsers reject calling clearTimeout with the sequence options object as receiver.
      if (this !== undefined && this !== globalThis && this !== window)
        throw new TypeError("Illegal invocation");
      original(id);
    });
  const app = createApp({
    render: () => h(World, { game: state.value, domain: "conclave" }),
  });
  app.mount(host);
  try {
    for (const move of ["guard", "strike"] as const) {
      state.value = dispatch(state.value, {
        type: "conclave",
        action: { kind: "move", move },
        id: "quick-" + move,
      });
      await nextTick();
    }
    expect(
      host.querySelector(".combat-field")?.getAttribute("data-phase"),
    ).toBe("approach");
    expect(cancel).toHaveBeenCalled();
    const next = structuredClone(state.value);
    next.conclave.duel = null;
    next.conclave.depth = 1;
    state.value = next;
    await nextTick();
    const attuned = structuredClone(next);
    attuned.conclave.attuned = true;
    state.value = attuned;
    await nextTick();
    expect(
      (host.querySelector(".walking-actor") as HTMLElement).style.display,
    ).not.toBe("none");
    host
      .querySelector(".meditating-actor img")!
      .dispatchEvent(new Event("load"));
    await nextTick();
    expect(
      (host.querySelector(".walking-actor") as HTMLElement).style.display,
    ).toBe("none");
    expect(
      (host.querySelector(".meditating-actor") as HTMLElement).style.display,
    ).not.toBe("none");
  } finally {
    app.unmount();
    cancel.mockRestore();
  }
});

it("主动撤回和实战失利有不同反馈，保留胜绩与秘境进度，不冒充取宝", () => {
  const start = checkpoint();
  const withdrawn = dispatch(start, {
    type: "conclave",
    action: { kind: "withdraw" },
    id: "retreat-check",
  });
  const before = goldenSnapshot(start, "conclave");
  const retreat = goldenPerformance(
    before,
    goldenSnapshot(withdrawn, "conclave"),
  )!;
  expect(retreat.kind).toBe("retreat");
  expect(retreat.label).not.toContain("养伤");
  expect(retreat.pearl).toBe(false);
  expect(retreat.book).toBe(false);
  // Boundary fixture: a combatant already on the brink of defeat, settled by a real move.
  let losing = structuredClone(start);
  losing.conclave.duel!.hp = 1;
  for (let i = 0; i < 18 && losing.conclave.duel; i++)
    losing = dispatch(losing, {
      type: "conclave",
      action: { kind: "move", move: "strike" },
      id: "lose-" + i,
    });
  expect(losing.injury).toBeGreaterThan(start.injury);
  const defeat = goldenPerformance(before, goldenSnapshot(losing, "conclave"))!;
  expect(defeat.kind).toBe("defeat");
  expect(defeat.label).toContain("半年");
  expect(losing.conclave.wins).toBe(start.conclave.wins);
  expect(losing.conclave.depth).toBe(start.conclave.depth);
});
it("进出秘境与整备只响应新状态，不把重读行装当成新准备", () => {
  const s = conclaveCheckpoint();
  const before = {
    ...goldenSnapshot(s, "sea"),
    place: "ferry" as const,
    depth: 0,
    prepared: false,
  };
  expect(goldenPerformance(before, { ...before, prepared: true })?.kind).toBe(
    "prepare",
  );
  expect(
    goldenPerformance(
      { ...before, prepared: true },
      { ...before, prepared: true },
    ),
  ).toBeNull();
  expect(goldenPerformance(before, { ...before, place: "ruins" })?.kind).toBe(
    "arrival",
  );
  expect(goldenPerformance({ ...before, place: "ruins" }, before)?.kind).toBe(
    "retreat",
  );
  expect(
    goldenPerformance(before, { ...before, place: "ruins", pending: true }),
  ).toBeNull();
});
it("入境走近与收起面板相容，可跳过，准备行装在现场可见且不改状态", async () => {
  const state = shallowRef(conclaveCheckpoint());
  state.value.conclave.location = "court";
  state.value.conclave.supplies = true;
  const focus = shallowRef("path");
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(World, {
        game: state.value,
        domain: "conclave",
        focus: focus.value,
        onPerformed: () => (focus.value = ""),
      }),
  });
  app.mount(host);
  try {
    host.querySelector(".walk-crop img")!.dispatchEvent(new Event("load"));
    await nextTick();
    expect(host.querySelector('[aria-label="备好的避潮行装"]')).not.toBeNull();
    const next = structuredClone(state.value);
    next.conclave.location = "vault";
    const unchanged = JSON.stringify(next);
    state.value = next;
    await nextTick();
    await nextTick();
    expect(
      host.querySelector(".walking-actor")?.getAttribute("data-moving"),
    ).toBe("true");
    expect(host.querySelectorAll(".golden-caption")).toHaveLength(1);
    host.querySelector<HTMLButtonElement>(".golden-caption button")!.click();
    await nextTick();
    expect(
      host.querySelector(".walking-actor")?.getAttribute("data-moving"),
    ).toBe("false");
    expect(host.querySelector(".golden-caption")).toBeNull();
    expect(JSON.stringify(state.value)).toBe(unchanged);
  } finally {
    app.unmount();
  }
});
