import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import RoadEpilogue from "../src/RoadEpilogue.vue";
import RoadPanel from "../src/RoadPanel.vue";
import { mistCheckpoint } from "../tools/mist-checkpoint";
import { dispatch, passSolutions, type State } from "../src/core";
const render = (game: State) =>
  renderToString(createSSRApp(RoadPanel, { game, busy: false }));
it("shows the epilogue only after recording the return route", async () => {
  let s = mistCheckpoint(42, "wood", "male", true);
  expect(await render(s)).not.toContain("Demo 篇章完成");
  let supply = 0;
  while (s.herbs < 6)
    s = dispatch(s, { type: "supplies", id: `ep-supply-${supply++}` });
  s = dispatch(s, { type: "road", action: "diagnoseRoots", id: "ep1" });
  s = dispatch(s, { type: "road", action: "healPass", id: "ep2" });
  expect(s.adventure.road.passed).toBe(true);
  expect(await render(s)).not.toContain("Demo 篇章完成");
  s = dispatch(s, { type: "road", action: "lookout", id: "ep3" });
  s = dispatch(s, { type: "road", action: "survey", id: "ep4" });
  const before = JSON.stringify(s);
  expect(await render(s)).toContain("草木之间，有人歇脚");
  expect(JSON.stringify(s)).toBe(before);
});
it.each(["medicine", "sword", "array", "legacy"] as const)(
  "summarizes %s without attributing another route's benefits",
  async (solution) => {
    const s = mistCheckpoint(42, "wood", "male", true);
    s.adventure.road.solution = solution;
    const html = await renderToString(
      createSSRApp(RoadEpilogue, { game: s, locked: true }),
    );
    expect(html).toContain(
      solution === "legacy" ? "沿旧路过关" : passSolutions[solution].name,
    );
    if (solution === "legacy")
      expect(html).toContain("没有获得医道、剑道或识阵的专属后续解法");
    else expect(html).toContain(passSolutions[solution].consequence);
    expect(html.match(/disabled/g)).toHaveLength(2);
  },
);

it("explains why breakthrough is locked and points a prepared player back to the pass", async () => {
  const s = mistCheckpoint(42, "wood", "male", true);
  s.adventure.road.stage = "camp";
  let html = await render(s);
  expect(html).toContain("筑基已成 · 可返回山口");
  expect(html).toContain("不必练满神识");
  s.realm = 0;
  s.qi = 120;
  html = await render(s);
  expect(html).toContain("修为 120/360；先修炼至 360");
  s.qi = 360;
  expect(await render(s)).toContain("修为已足，可以查看突破风险");
  s.adventure.road.passed = true;
  expect(await render(s)).not.toContain("camp-guidance");
});
