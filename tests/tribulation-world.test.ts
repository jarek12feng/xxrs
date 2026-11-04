// @vitest-environment happy-dom
import { createApp, h, shallowRef, nextTick } from "vue";
import { it, expect, vi } from "vitest";
import World from "../src/scene2d/tribulation/TribulationWorld.vue";
import type { TribulationPresentation } from "../src/scene2d/tribulation/presentation";
it("不同境界只提供演出投影，重载不重播，新增结算可略过且卸载清理计时器", async () => {
  vi.useFakeTimers();
  const events: boolean[] = [];
  const scene = shallowRef<TribulationPresentation>({
    hero: "/hero.webp",
    cleared: false,
    victoryTitle: "界门开启",
    victoryText: "跨界结果由领域提供",
    assets: {
      strike: "/strike.webp",
      impact: "/impact.webp",
      ward: "/ward.webp",
    },
    phase: {
      title: "第九重 · 界壁雷潮",
      turn: 2,
      signal: "界隙收拢",
      tell: "自定义雷兆",
      hp: 80,
      maxHp: 100,
      pressure: 200,
      maxPressure: 300,
      color: "#abc",
    },
    result: {
      serial: 40,
      label: "自定义破劫",
      damage: 20,
      incoming: 5,
      ward: true,
      hero: "/guard.webp",
      color: "#def",
    },
  });
  const host = document.createElement("div"),
    app = createApp({
      render: () =>
        h(World, {
          scene: scene.value,
          onPerforming: (v: boolean) => events.push(v),
        }),
    });
  app.mount(host);
  try {
    expect(host.textContent).toContain("第九重");
    expect(host.querySelector(".bolt")).toBeNull();
    const before = JSON.stringify(scene.value);
    scene.value = {
      ...scene.value,
      result: { ...scene.value.result!, serial: 41 },
    };
    await nextTick();
    expect(host.querySelector(".bolt")?.getAttribute("src")).toBe(
      "/strike.webp",
    );
    expect(events.at(-1)).toBe(true);
    host.querySelector<HTMLButtonElement>(".skip")!.click();
    await nextTick();
    expect(host.querySelector(".bolt")).toBeNull();
    expect(events.at(-1)).toBe(false);
    expect(scene.value.result!.serial).toBe(41);
    expect(JSON.parse(before).result.serial).toBe(40);
    scene.value = {
      ...scene.value,
      result: { ...scene.value.result!, serial: 42 },
    };
    await nextTick();
    expect(events.at(-1)).toBe(true);
  } finally {
    app.unmount();
    const afterUnmount=events.length;
    vi.runAllTimers();
    expect(events.length).toBe(afterUnmount);
    vi.useRealTimers();
  }
});
