import { expect, it } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ExpeditionPanel from "../src/expedition/ExpeditionPanel.vue";
import { expeditionSession } from "../tools/expedition-simulation";
it("shows the real telegraph, costs and three response commands", async () => {
  const p = expeditionSession();
  p.prepare();
  p.send({ type: "expedition", action: "accept" });
  let html = await renderToString(
    createSSRApp(ExpeditionPanel, { game: p.state, busy: false }),
  );
  expect(html).toContain("行前回山下休整、筹备一月（若遇旧约先赴约），灵石 2");
  p.send({ type: "expedition", action: "enter" });
  html = await renderToString(
    createSSRApp(ExpeditionPanel, { game: p.state, busy: false }),
  );
  expect(html).toContain("长刀高举");
  expect(html).toContain("守势化劲");
  expect(html).toContain("破绽反击");
  expect(html).toContain("凝神辨影");
  expect(html).not.toContain("回洞府准备 ·");
});
