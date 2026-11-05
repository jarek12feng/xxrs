import { createApp, h, shallowRef } from "vue";
import { dispatch, validState, migrateSave, type Intent } from "../../src/core";
import { goldenAuctionFixture } from "../../tools/golden-auction-checkpoint";
import { outerSeaCheckpoint } from "../../tools/outer-sea-checkpoint";
import OuterSeaPanel from "../../src/outer-sea/OuterSeaPanel.vue";
import StoryTravelMap from "../../src/wayfaring/StoryTravelMap.vue";
import { useStoryTravel } from "../../src/wayfaring/useStoryTravel";
import "../../src/style.css";
import "../../src/scene.css";
import "../../src/immersive.css";
import "../../src/readability.css";
createApp({
  setup() {
    const normal = new URLSearchParams(location.search).has("normal");
    const game = shallowRef(
      normal ? outerSeaCheckpoint() : goldenAuctionFixture(),
    );
    let serial = 0;
    function send(i: Intent) {
      const n = dispatch(game.value, { ...i, id: `gold-preview-${++serial}` });
      if (!validState(n)) throw Error("Invalid golden preview");
      game.value = n;
    }
    const travel = useStoryTravel(
      () => game.value,
      () => false,
      send,
    );
    return () =>
      h(
        "div",
        {
          style:
            "height:100vh;display:flex;flex-direction:column;background:#10291f;color:#eee",
        },
        [
          h("nav", { style: "padding:8px;display:flex;gap:12px" }, [
            h(
              "span",
              normal
                ? "公开命令成长档 · 无改年月/资金 · 不写玩家存档"
                : "隔离检查点 · 不读写玩家存档",
            ),
            ...(normal
              ? [
                  h(
                    "button",
                    {
                      onClick: () =>
                        send({ type: "advance", activity: "work", months: 12 }),
                    },
                    "劳作一年",
                  ),
                  h(
                    "button",
                    {
                      onClick: () =>
                        send({
                          type: "advance",
                          activity: "cultivate",
                          months: 12,
                        }),
                    },
                    "修行一年",
                  ),
                ]
              : []),
            h(
              "button",
              {
                onClick: () =>
                  (game.value = migrateSave(
                    JSON.parse(JSON.stringify(game.value)),
                  )),
              },
              "模拟读档",
            ),
            h(
              "span",
              `第 ${game.value.month} 月 · 灵石 ${game.value.stones} · 灵草 ${game.value.herbs} · 玄铁 ${game.value.workshop.iron}`,
            ),
          ]),
          h(
            "main",
            { style: "flex:1;min-height:0" },
            h(OuterSeaPanel, {
              style: "height:100%",
              game: game.value,
              busy: false,
              onAct: travel.act,
            }),
          ),
          travel.route.value
            ? h(StoryTravelMap, {
                game: game.value,
                busy: false,
                route: travel.route.value,
                arrived: travel.arrived.value,
                onDepart: travel.depart,
                onClose: travel.close,
                onCancel: travel.cancel,
              })
            : null,
        ],
      );
  },
}).mount("#app");
