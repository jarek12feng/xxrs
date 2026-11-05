// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from "vue";
import { it, expect } from "vitest";
import { dispatch, validState, migrateSave, type Intent } from "../src/core";
import { auctionFixture } from "../tools/auction-checkpoint";
import AuctionScene from "../src/auction/AuctionScene.vue";
import TreasurePanel from "../src/treasures/TreasurePanel.vue";
import RoadPanel from "../src/RoadPanel.vue";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
it.each(["market", "foundation"] as const)(
  "实际%s会场按钮、预算、落槌、关闭重开与读档保持",
  async (venue) => {
    const state = shallowRef(
        auctionFixture(venue, venue === "market" ? 12 : 60),
      ),
      host = document.createElement("div");
    let serial = 0;
    const app = createApp({
      render: () =>
        h(AuctionScene, {
          venue,
          game: state.value,
          busy: false,
          onAct: (i: Intent) => {
            state.value = dispatch(state.value, { ...i, id: `ui-${++serial}` });
            expect(validState(state.value)).toBe(true);
          },
        }),
    });
    app.mount(host);
    const click = async (label: string) => {
      const matches = [...host.querySelectorAll("button")].filter((x) =>
        x.textContent?.includes(label),
      );
      const b = matches.at(-1)!;
      expect(b, label).toBeTruthy();
      expect(b.disabled, label).toBe(false);
      b.click();
      await nextTick();
    };
    try {
      await click("领取目录");
      const saved = structuredClone(state.value.treasures.auction);
      const beforeReopen = structuredClone(state.value);
      await click("管事与会讯");
      await click("展开本届目录");
      expect(host.textContent).toContain("拍品目录");
      expect(state.value).toEqual(beforeReopen);
      await click("拍品陈列");
      expect(host.textContent).toContain("常规来源参考价");
      await click("入席参拍");
      const input = host.querySelector("input")!;
      input.value = "100";
      input.dispatchEvent(new Event("input"));
      await nextTick();
      await click("设定预算");
      await click("入席参拍");
      state.value = migrateSave(JSON.parse(JSON.stringify(state.value)));
      await nextTick();
      expect(state.value.treasures.auction!.lots).toEqual(saved!.lots);
      for (let i = 0; i < 40 && state.value.treasures.auction!.index === 0; i++)
        await click("出价 ");
      expect(state.value.treasures.auction!.lots[0].result).toBe("won");
      await click("厅门");
      await click("正式退出本届");
      expect(state.value.treasures.auction!.closed).toBe(true);
    } finally {
      app.unmount();
    }
  },
);
it("随身宝物只显示已知目录，没有远程参拍按钮", () => {
  const s = dispatch(auctionFixture(), {
      type: "treasure",
      action: { kind: "catalog", venue: "market" },
      id: "cat",
    }),
    host = document.createElement("div");
  const app = createApp({
    render: () => h(TreasurePanel, { game: s, busy: false }),
  });
  app.mount(host);
  expect(host.textContent).toContain("已收下的拍卖目录");
  expect(host.textContent).toContain("前往当地拍卖行");
  expect(
    [...host.querySelectorAll("button")].some((b) =>
      /参拍|目录|出价|赴会/.test(b.textContent || ""),
    ),
  ).toBe(false);
  app.unmount();
});
it.each(["market", "foundation"] as const)(
  "%s当地场景热点进入不同会场，打开场景不推进规则",
  async (venue) => {
    const s = auctionFixture(venue, venue === "market" ? 12 : 60),
      before = structuredClone(s),
      host = document.createElement("div");
    const app = createApp({
      render: () =>
        venue === "market"
          ? h(RoadPanel, { game: s, busy: false })
          : h(FoundationPanel, { game: s, busy: false }),
    });
    app.mount(host);
    try {
      const button = [...host.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("拍卖行"),
      )!;
      expect(button).toBeTruthy();
      button.click();
      await nextTick();
      expect(host.querySelector(`[data-venue="${venue}"]`)).toBeTruthy();
      expect(s).toEqual(before);
    } finally {
      app.unmount();
    }
  },
);
