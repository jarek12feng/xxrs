import { createApp, h, ref, shallowRef } from "vue";
import CompanionshipPanel from "../src/companionship/CompanionshipPanel.vue";
import { dispatch, migrateSave, validState, type Intent } from "../src/core";
import { mistCheckpoint } from "./mist-checkpoint";
import "../src/style.css";
import "../src/readability.css";
const game = shallowRef(mistCheckpoint(42, "wood", "male"));
const narrow = ref(false);
let serial = 0;
const act = (intent: Intent) => {
  const next = dispatch(game.value, { ...intent, id: `preview-${++serial}` });
  if (!validState(next)) throw new Error("Invalid companion preview state");
  game.value = migrateSave(JSON.parse(JSON.stringify(next)));
};
createApp({
  setup: () => () =>
    h(
      "main",
      {
        style: {
          margin: "0 auto",
          padding: "12px",
          maxWidth: narrow.value ? "390px" : "900px",
        },
      },
      [
        h("h1", "筑基同行 · 开发验收"),
        h(
          "p",
          "独立阶段检查点，由既有公开命令生成。此页不读写玩家存档；每次操作经过序列化与校验。",
        ),
        h(
          "button",
          {
            onClick: () => {
              game.value = mistCheckpoint(42, "wood", "male");
            },
          },
          "沈听澜 · 重新验收",
        ),
        h(
          "button",
          {
            onClick: () => {
              game.value = mistCheckpoint(42, "wood", "female");
            },
          },
          "尹照川 · 重新验收",
        ),
        h(
          "button",
          {
            onClick: () => {
              narrow.value = !narrow.value;
            },
          },
          "切换 390px 内容宽度",
        ),
        h(
          "button",
          {
            onClick: () =>
              act({ type: "advance", activity: "rest", months: 1 }),
          },
          "免费静养一月",
        ),
        h(
          "p",
          `伤势 ${game.value.injury} · 灵草 ${game.value.herbs} · 护身诀${game.value.journey.support === "guard" ? "已装配" : "未装配"} · 好感 ${game.value.social.affection}`,
        ),
        h(CompanionshipPanel, {
          game: game.value,
          busy: false,
          onAct: act,
          onEquipment: () => act({ type: "equip", technique: "guard" }),
        }),
      ],
    ),
}).mount("#app");
