// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef, type App } from "vue";
import { afterEach, expect, it } from "vitest";
import OriginNotes from "../src/OriginNotes.vue";
import SocialPanel from "../src/SocialPanel.vue";
import { createGame, dispatch, type Intent } from "../src/core";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("reads an optional note through a command, updates journal and never marks the pair acquainted", async () => {
  let s = createGame("路过", "wood", 42);
  s = dispatch(s, { id: "inspect", type: "adventure", action: "inspect" });
  s = dispatch(s, { id: "depart", type: "adventure", action: "depart" });
  const game = shallowRef(s);
  let count = 0;
  app = createApp({
    render: () =>
      h(OriginNotes, {
        game: game.value,
        busy: false,
        onAct: (c: Intent) => {
          game.value = dispatch(game.value, { ...c, id: `read-${++count}` });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.body.textContent).not.toContain("芝麻饼");
  document.querySelector("button")!.click();
  await nextTick();
  expect(game.value.social.origins).toEqual(["route-map"]);
  expect(game.value.social.met).toBe(false);
  expect(document.querySelector("summary")!.textContent).toContain("已读");
  expect(document.body.textContent).toContain("芝麻饼");
  expect(document.querySelector("button")).toBeNull();
  expect(count).toBe(1);
});
it("existing acquaintances can open background dialogue without restarting the meeting", async () => {
  let s = createGame("旧友", "wood", 42, "insightful", "female");
  Object.assign(s, { age: 240, month: 48, realm: 1 });
  Object.assign(s.story, {
    stage: "resolved",
    choice: "missed",
    luchi: "distant",
  });
  s = dispatch(s, { id: "visit", type: "visit" });
  s = dispatch(s, {
    id: "meet",
    type: "choose",
    instanceId: s.social.scene!.id,
    option: "listen",
  });
  const commands: Intent[] = [];
  app = createApp(SocialPanel, {
    game: s,
    busy: false,
    running: false,
    mode: "relationship",
    onAct: (c: Intent) => commands.push(c),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("聊聊家人"),
  )!;
  btn.click();
  await nextTick();
  expect(commands).toEqual([{ type: "background" }]);
  expect(document.body.textContent).not.toContain("去山门外相识");
});
