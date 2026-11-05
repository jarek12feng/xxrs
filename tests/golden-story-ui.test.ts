import {clickPractice} from './helpers/practice-scene';
import {teachingSolution} from '../src/golden-story/teaching';
import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, it, expect } from "vitest";
import { createApp, h, shallowRef, nextTick, type App } from "vue";
import { dispatch, type Intent } from "../src/core";
import SeaPanel from "../src/outer-sea/OuterSeaPanel.vue";
import GoldenPanel from "../src/golden-core/GoldenCorePanel.vue";
import ConclavePanel from "../src/conclave/ConclavePanel.vue";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
async function click(label: string) {
  const b = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label),
  );
  expect(b, label).toBeTruthy();
  expect(b!.disabled, label).toBe(false);
  b!.click();
  await nextTick();
  await nextTick();
}
function fixture() {
  const s = createGame("现场校验", "wood", 42, "insightful");
  s.realm = 2;
  s.limit = 6000;
  s.foundationJourney.cultivation = 800;
  s.goldenCore.farShore = true;
  s.outerSea.location = "ferry";
  s.outerSea.met = true;
  s.stones = 100;
  s.herbs = 20;
  return s;
}
it("古渡热点正常命令完成观潮、保存重挂载并返回单一主场景", async () => {
  const game = shallowRef(fixture());
  let id = 0;
  const mount = () => {
    app = createApp({
      render: () =>
        h(SeaPanel, {
          game: game.value,
          busy: false,
          onAct: (a: Intent) => {
            game.value = dispatch(game.value, { ...a, id: `gs-ui-${++id}` });
          },
        }),
    });
    app.mount(document.body.appendChild(document.createElement("div")));
  };
  mount();
  await click("潮堤与公开问法");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  await click("潮尺");
  await click("刻下今日满潮线");
  await click("堤缘阵石");
  await click("测读堤后回流");
  await click("图台");
  await click("我来护堤");
  await click("按分工复测");
  expect(game.value.goldenStory.tideComplete).toBe(true);
  expect(game.value.herbs).toBe(18);
  const saved = JSON.stringify(game.value);
  app.unmount();
  document.body.innerHTML = "";
  game.value = JSON.parse(saved);
  mount();
  await click("潮堤与公开问法");
  await click("论法实录");
  await click("画出灵流缺口");
  expect(game.value.goldenStory.teachings).not.toContain("ground");
  for(const move of teachingSolution('ground')) await clickPractice('ground',move);
  expect(game.value.goldenStory.teachings).toContain("ground");
  await click("回古渡");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  expect(document.querySelector(".outer-sea")).toBeTruthy();
});
it("凝丹问路不叠加旧主场景，也不修改宗籍", async () => {
  const game = shallowRef(fixture());
  game.value.outerSea.location = "home";
  game.value.goldenCore.farShore = false;
  app = createApp({
    render: () =>
      h(GoldenPanel, {
        game: game.value,
        busy: false,
        onAct: (a: Intent) => {
          game.value = dispatch(game.value, { ...a, id: "direction-ui" });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await click("问路与旧友来信");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  await click("远行引荐");
  await click("以散修身份");
  expect(game.value.goldenStory.direction).toBe("independent");
  await click("回凝丹旧居");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
});
it("会谷非冠军可问法，选择拓本保留原领域资源", async () => {
  const game = shallowRef(fixture());
  game.value.outerSea.notice = 0;
  game.value.conclave.location = "court";
  game.value.conclave.introduced = true;
  game.value.conclave.depth = 2;
  let id = 0;
  const before = structuredClone(game.value.conclave);
  app = createApp({
    render: () =>
      h(ConclavePanel, {
        game: game.value,
        busy: false,
        onAct: (a: Intent) => {
          game.value = dispatch(game.value, { ...a, id: `court-ui-${++id}` });
        },
      }),
  });
  app.mount(document.body.appendChild(document.createElement("div")));
  await click("问法席与拓本交接");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
  await click("归潮拓本");
  await click("交照霜原卷拓页");
  await click("沈观微");
  await click("演示旧法滞涩");
  for(const move of teachingSolution('method')) await clickPractice('method',move);
  expect(game.value.goldenStory.teachings).toContain("method");
  expect(game.value.conclave).toEqual(before);
  await click("回会谷");
  expect(document.querySelectorAll(".narrative-stage")).toHaveLength(1);
});
