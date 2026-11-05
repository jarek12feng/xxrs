import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { afterEach, expect, it } from "vitest";
import { createApp, h, nextTick, reactive, type App } from "vue";

import CultivationStatus from "../src/CultivationStatus.vue";
let app: App;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
});
it("shows current qi and the next stage, then switches to foundation cultivation", async () => {
  const game = reactive(createGame("修为可见", "wood"));
  game.qi = 130;
  app = createApp({ render: () => h(CultivationStatus, { game }) });
  app.mount(document.body.appendChild(document.createElement("div")));
  expect(document.body.textContent).toContain("修为 130 / 360");
  expect(document.body.textContent).toContain("距后期 110");
  game.qiJourney.gates = 2;
  game.qi = 360;
  await nextTick();
  expect(document.body.textContent).toContain("圆满，待叩关");
  game.realm = 1;
  game.qi = 0;
  game.foundationJourney.won.push("application");
  game.foundationJourney.cultivation = 215;
  await nextTick();
  expect(document.body.textContent).toContain("修为 215 / 600");
  expect(document.body.textContent).toContain("距后期 185");
  game.foundationJourney.cultivation = 600;
  await nextTick();
  expect(document.body.textContent).toContain("本境圆满");
});
