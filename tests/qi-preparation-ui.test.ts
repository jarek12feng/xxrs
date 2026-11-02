// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { existsSync } from "node:fs";
import { createGame, dispatch, type Intent } from "../src/core";
import Panel from "../src/qi-journey/QiJourneyPanel.vue";
import { qiSites } from "../src/qi-journey/content";
import { qiPeople } from "../src/qi-journey/people";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("shows three routes, keeps entry blocked and makes the first choices clickable", async () => {
  const s = createGame("界面", "wood");
  s.qi = 120;
  s.herbs = 10;
  s.stones = 40;
  s.study = 2;
  s.sense = 8;
  s.adventure.step = "done";
  s.story.stage = "resolved";
  const game = shallowRef(s);
  let id = 0;
  app = createApp({
    render: () =>
      h(Panel, {
        game: game.value,
        busy: false,
        onAct: (c: Intent) =>
          (game.value = dispatch(game.value, { ...c, id: `ui${++id}` })),
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.body.textContent).toContain("三条路线择一");
  const buttons = () => Array.from(document.querySelectorAll("button"));
  expect(
    buttons().find((b) => b.textContent?.startsWith("药理护身"))?.disabled,
  ).toBe(true);
  const section = document.querySelector('[aria-label="晋升成长路线"]')!;
  const medicine = Array.from(section.querySelectorAll("details")).find((d) =>
    d.querySelector("summary")?.textContent?.includes("药谷修行"),
  )!;
  (
    Array.from(medicine.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("认识许照岚"),
    ) as HTMLButtonElement
  ).click();
  await nextTick();
  expect(game.value.qiJourney.people.scout).toBe(true);
  (
    Array.from(medicine.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("开始整备"),
    ) as HTMLButtonElement
  ).click();
  await nextTick();
  expect(game.value.qiJourney.preparations[0]!.medicine).toBe(1);
  expect(medicine.textContent).toContain("1 / 3");
  (
    Array.from(medicine.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("辨兽踪"),
    ) as HTMLButtonElement
  ).click();
  await nextTick();
  expect(game.value.qiJourney.preparations[0]!.medicine).toBe(2);
  expect(medicine.textContent).toContain("护药实战");
  expect(
    buttons().find((b) => b.textContent?.startsWith("药理护身"))?.disabled,
  ).toBe(true);
});
it("all NPC portraits and distinct enemies reference shipped assets", () => {
  const paths = [
    ...Object.values(qiPeople).map((n) => n.image),
    ...qiSites.flatMap((s) => s.enemies.map((e) => e.image)),
  ];
  expect(new Set(paths).size).toBe(6);
  for (const path of paths)
    expect(existsSync(`public${path}`), path).toBe(true);
});
