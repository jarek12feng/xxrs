// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect, vi } from "vitest";
const renderer = vi.hoisted(() => ({
  move: vi.fn(),
  walkTo: vi.fn(),
  nudge: vi.fn(),
  stop: vi.fn(),
  skipWalk: vi.fn(),
  skipPerformance: vi.fn(),
  destroy: vi.fn(),
  settle: vi.fn(),
  sync: vi.fn(),
  mount: vi.fn(),
}));
vi.mock("../src/scene2d/renderer", () => ({
  mountStage: (...args: unknown[]) => {
    renderer.mount(...args);
    return renderer;
  },
}));
import OpeningScene from "../src/scene2d/OpeningScene.vue";
import { createGame, dispatch, type Intent } from "../src/core";
const flush = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};
it("observation is read-only, persistence failure leaves the gate unchanged, locks stop commands, and unmount releases renderer", async () => {
  let s = createGame("现场", "wood", 42);
  for (const action of [
    "inspect",
    "depart",
    "medicine",
    "prepare",
    "depart",
    "trail",
  ] as const)
    s = dispatch(s, { type: "adventure", action, id: action + s.seen.length });
  const state = shallowRef(s),
    busy = shallowRef(false),
    host = document.createElement("div");
  let intent: Intent | undefined;
  const app = createApp({
    render: () =>
      h(OpeningScene, {
        game: state.value,
        busy: busy.value,
        onAct: (x: Intent) => {
          intent = x;
        },
      }),
  });
  app.mount(host);
  await flush();
  const click = (text: string) => {
    const b = [...host.querySelectorAll("button")].find(
      (b) =>
        b.textContent?.includes(text) ||
        b.getAttribute("aria-label")?.includes(text),
    );
    expect(b).toBeDefined();
    b!.click();
  };
  try {
    expect(host.querySelector(".scene-notes")).toBeNull();
    click("沿途见闻与现场详情");
    await flush();
    expect(host.querySelector(".scene-notes")).not.toBeNull();
    click("收起见闻");
    await flush();
    expect(host.querySelector(".scene-notes")).toBeNull();
    click("崩裂的阵门");
    await flush();
    expect(intent).toBeUndefined();
    expect(state.value).toBe(s);
    click("以药草安抚");
    await flush();
    expect(intent).toEqual({ type: "adventure", action: "challenge" });
    // Parent deliberately withholds the new state as on save rejection.
    expect(host.textContent).toContain("崩裂的阵门");
    expect(host.textContent).not.toContain("药工已脱险");
    expect(renderer.mount).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ prepared: true, rescued: false, method: "medicine" }), expect.any(Function));
    expect(renderer.sync).not.toHaveBeenCalledWith(expect.objectContaining({ rescued: true }));
    busy.value = true;
    await flush();
    expect(
      [...host.querySelectorAll(".object-actions button")].every(
        (b) => (b as HTMLButtonElement).disabled,
      ),
    ).toBe(true);
    busy.value = false;
    state.value = dispatch(s, { ...intent!, id: "saved" });
    await flush();
    expect(host.textContent).toContain("药工已脱险");
    expect(renderer.sync).toHaveBeenLastCalledWith({ prepared: true, rescued: true, method: "medicine" });
    expect(host.textContent).toContain("山下伤者需等下一队送药");
    expect(state.value.month).toBe(0);
    const result = host.querySelector<HTMLElement>(".settled-response")!;
    expect(result.style.display).toBe("none");
    click("刚才发生的事");
    await flush();
    expect(result.style.display).not.toBe("none");
    expect(result.textContent).toBe(state.value.adventure.result);
    // Escape also closes scene UI after focus has left the scene (e.g. a closed inventory).
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", cancelable: true }),
    );
    await flush();
    expect(host.querySelector(".object-actions")).toBeNull();
  } finally {
    app.unmount();
  }
  expect(renderer.destroy).toHaveBeenCalled();
});

it("ground and keyboard movement never dispatch rules, locked input stops movement, and field controls remain usable", async () => {
  vi.clearAllMocks();
  const state=createGame("走路", "wood",42), before=JSON.stringify(state);
  const busy=shallowRef(false), act=vi.fn();
  const host=document.body.appendChild(document.createElement('div'));
  const app=createApp({render:()=>h(OpeningScene,{game:state,busy:busy.value,onAct:act})});
  app.mount(host);await flush();await new Promise(resolve=>setTimeout(resolve,0));await flush();
  try {
    const ground=host.querySelector<HTMLElement>('.stage-world')!;
    vi.spyOn(ground,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:1000,height:700,right:1000,bottom:700,x:0,y:0,toJSON:()=>({})});
    ground.dispatchEvent(new PointerEvent('pointerdown',{clientX:700,clientY:560,button:0,bubbles:true}));
    expect(renderer.walkTo).toHaveBeenCalledWith(70,80);
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',cancelable:true}));
    expect(renderer.nudge).toHaveBeenCalledWith(5,0);
    expect(act).not.toHaveBeenCalled();expect(JSON.stringify(state)).toBe(before);
    busy.value=true;await flush();expect(renderer.stop).toHaveBeenCalled();
    renderer.walkTo.mockClear();renderer.nudge.mockClear();
    ground.dispatchEvent(new PointerEvent('pointerdown',{clientX:400,clientY:550,button:0,bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',cancelable:true}));
    expect(renderer.walkTo).not.toHaveBeenCalled();expect(renderer.nudge).not.toHaveBeenCalled();
  } finally {app.unmount();host.remove();}
});

it("skipping a scene performance restores controls without emitting another game command", async () => {
  vi.clearAllMocks();
  const state=createGame("演出", "wood",42), act=vi.fn();
  const host=document.createElement('div');
  const app=createApp({render:()=>h(OpeningScene,{game:state,busy:false,onAct:act})});
  app.mount(host);await flush();await new Promise(resolve=>setTimeout(resolve,0));await flush();
  try {
    const config=renderer.mount.mock.calls.at(-1)![1] as {onPerformance:(caption:string)=>void};
    config.onPerformance('接应药工');await flush();
    expect((host.querySelector('.stage-interaction') as HTMLElement).style.display).toBe('none');
    renderer.skipPerformance.mockImplementationOnce(()=>config.onPerformance(''));
    const skip=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('跳过演出'))!;
    expect(skip).toBeDefined();skip.click();await flush();
    expect(renderer.skipPerformance).toHaveBeenCalledOnce();
    expect(host.querySelector('.performance-caption')).toBeNull();
    expect((host.querySelector('.stage-interaction') as HTMLElement).style.display).not.toBe('none');
    expect(act).not.toHaveBeenCalled();
  } finally {app.unmount();}
});
