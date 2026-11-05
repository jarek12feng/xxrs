// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { afterEach, expect, it, vi } from "vitest";
import { travelPlaybackDuration } from "../src/wayfaring/playback";
import TravelMap from "../src/wayfaring/TravelMap.vue";
import PathTraveler from "../src/presentation/movement/PathTraveler.vue";
import { journeyCheckpoint } from "../tools/foundation-journey-checkpoint";
import { dispatch, type Intent } from "../src/core";
let cleanup = () => {};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function frames() {
  const queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(++id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (n: number) => queue.delete(n));
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  return {
    queue,
    tick: (t: number) => {
      const jobs = [...queue.values()];
      queue.clear();
      jobs.forEach((cb) => cb(t));
    },
  };
}
it("preview and failed save leave state and actor unchanged; only settled arrival plays the itinerary", async () => {
  const raf = frames(),
    game = shallowRef(journeyCheckpoint("male", false, "wood", "spring")),
    before = structuredClone(game.value),
    commands: Intent[] = [];
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () =>
      h(TravelMap, {
        game: game.value,
        busy: false,
        destination: "ferry",
        onAct: (i: Intent) => commands.push(i),
      }),
  });
  app.mount(host);
  cleanup = () => {
    app.unmount();
    host.remove();
  };
  await nextTick();
  expect(host.textContent).toContain("3600 里");
  expect(host.textContent).toContain("3 月");
  const actor = () =>
    host.querySelector(".path-traveler")!.getAttribute("transform");
  const origin = actor();
  const button = [...host.querySelectorAll("button")].find(
    (b) => b.textContent === "动身前往",
  )!;
  button.click();
  await nextTick();
  expect(commands).toHaveLength(1);
  expect(game.value).toEqual(before);
  expect(raf.queue.size).toBe(0);
  expect(actor()).toBe(origin);
  game.value = dispatch(game.value, { ...commands[0], id: "saved" });
  await nextTick();
  await nextTick();
  expect(host.textContent).toContain("行程已抵达");
  expect(raf.queue.size).toBe(1);
  raf.tick(1);
  raf.tick(3000);
  expect(actor()).not.toContain("320 355");
  raf.tick(1 + travelPlaybackDuration(3600, "land", game.value.realm));
  await nextTick();
  await nextTick();
  expect(actor()).toContain("320 355");
  expect(raf.queue.size).toBe(0);
  expect(commands).toHaveLength(1);
});
it("generic playback pauses, resumes and releases its frame and visibility listener", async () => {
  const raf = frames(),
    finished = vi.fn(),
    remove = vi.spyOn(document, "removeEventListener");
  const host = document.body.appendChild(document.createElement("div"));
  const instance = shallowRef<InstanceType<typeof PathTraveler> | null>(null);
  const app = createApp({
    render: () =>
      h("svg", [
        h(PathTraveler, {
          ref: instance,
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
          mode: "flight",
          image: "/hero.webp",
          playing: true,
          duration: 1000,
          onFinished: finished,
        }),
      ]),
  });
  app.mount(host);
  cleanup = () => {
    host.remove();
  };
  await nextTick();
  raf.tick(1);
  raf.tick(501);
  expect(host.querySelector("g")!.getAttribute("transform")).not.toContain(
    "100",
  );
  instance.value!.pause();
  expect(raf.queue.size).toBe(0);
  instance.value!.pause();
  expect(raf.queue.size).toBe(1);
  instance.value!.finish();
  await nextTick();
  expect(finished).toHaveBeenCalledTimes(1);
  expect(raf.queue.size).toBe(0);
  app.unmount();
  expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  expect(raf.queue.size).toBe(0);
});
it("reduced motion arrives without scheduling an animation", async () => {
  const raf = frames();
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  const done = vi.fn(),
    host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () =>
      h("svg", [
        h(PathTraveler, {
          points: [
            { x: 0, y: 0 },
            { x: 20, y: 10 },
          ],
          mode: "walk",
          image: "/hero.webp",
          playing: true,
          onFinished: done,
        }),
      ]),
  });
  app.mount(host);
  cleanup = () => {
    app.unmount();
    host.remove();
  };
  await nextTick();
  expect(raf.queue.size).toBe(0);
  expect(done).toHaveBeenCalledTimes(1);
  expect(host.querySelector("g")!.getAttribute("transform")).toBe(
    "translate(20 10)",
  );
});
it("keyboard destination selection only previews; Escape closes without reaching global shortcuts", async () => {
  frames();
  const game = dispatch(journeyCheckpoint("male", false, "wood", "spring"), {id:"learn-inland",type:"foundationJourney",action:{kind:"travel",destination:"ferry"}});
  const act = vi.fn(),
    close = vi.fn(),
    globalKey = vi.fn();
  const host = document.body.appendChild(document.createElement("div"));
  const app = createApp({
    render: () =>
      h(TravelMap, { game, busy: false, onAct: act, onClose: close }),
  });
  app.mount(host);
  window.addEventListener("keydown", globalKey);
  cleanup = () => {
    app.unmount();
    host.remove();
    window.removeEventListener("keydown", globalKey);
  };
  const site = host.querySelector('[role="button"][aria-label="雪线旧门"]')!;
  site.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    }),
  );
  await nextTick();
  expect(site.getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelector("select")!.value).toBe("snow");
  expect(act).not.toHaveBeenCalled();
  site.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(close).toHaveBeenCalledOnce();
  expect(globalKey).not.toHaveBeenCalled();
});
it("the shared clock advances loaded walk frames and flight takes off and lands without another timer", async () => {
  const raf = frames(),
    host = document.body.appendChild(document.createElement("div"));
  const routePoints = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];
  const mode = shallowRef<"walk" | "flight">("walk"),
    instance = shallowRef<InstanceType<typeof PathTraveler> | null>(null);
  const app = createApp({
    render: () =>
      h("svg", [
        h(PathTraveler, {
          ref: instance,
          points: routePoints,
          image: "/still.webp",
          walkSheet: "/walk.png",
          mode: mode.value,
          playing: true,
          duration: 1000,
        }),
      ]),
  });
  app.mount(host);
  cleanup = () => {
    app.unmount();
    host.remove();
  };
  await nextTick();
  const sheet = host.querySelector("svg svg image")!;
  sheet.dispatchEvent(new Event("load"));
  await nextTick();
  const crop = host.querySelector("svg svg")!;
  const first = crop.getAttribute("viewBox");
  raf.tick(1);
  raf.tick(301);
  await nextTick();
  expect(crop.getAttribute("viewBox")).not.toBe(first);
  instance.value!.pause();
  expect(raf.queue.size).toBe(0);
  mode.value = "flight";
  await nextTick();
  expect(
    host.querySelector(".path-traveler > g")!.getAttribute("transform"),
  ).toBe("translate(0 -18)");
  instance.value!.finish();
  await nextTick();
  expect(
    host.querySelector(".path-traveler > g")!.getAttribute("transform"),
  ).toBe("translate(0 0)");
  expect(raf.queue.size).toBe(0);
});

it.each([0, 1])('saved chapter trip with %i months closes automatically only for a free nearby journey', async (months) => {
  const { default: StoryTravelMap } = await import('../src/wayfaring/StoryTravelMap.vue');
  const raf = frames(), closed = vi.fn(), depart = vi.fn();
  const game = journeyCheckpoint('male', false, 'wood', 'spring');
  const route = { domain: 'opening' as const, intent: {type:'adventure' as const, action:'depart' as const}, from:'a',to:'b',title:'近郊',sites:[{id:'a',name:'起点',x:0,y:0},{id:'b',name:'终点',x:100,y:100}],path:['a','b'],distance:15,months,stones:0,herbs:0,error:'',note:'',mode:'walk' as const,startProgress:0 };
  const host=document.body.appendChild(document.createElement('div'));
  const app=createApp(StoryTravelMap,{game,route,busy:false,arrived:true,onClose:closed,onDepart:depart});
  app.mount(host);cleanup=()=>{app.unmount();host.remove()};
  await nextTick();raf.tick(1);raf.tick(1+travelPlaybackDuration(route.distance,route.mode,game.realm));await nextTick();await nextTick();
  expect(closed).toHaveBeenCalledTimes(months===0?1:0);
  expect(depart).not.toHaveBeenCalled();
});
