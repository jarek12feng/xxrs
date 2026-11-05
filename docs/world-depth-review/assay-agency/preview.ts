import { createApp, h, shallowRef } from "vue";
import {
  dispatch,
  validState,
  migrateSave,
  type Intent,
} from "../../../src/core";
import { lizhaoDepthCheckpoint } from "../../../tools/lizhao-depth-checkpoint";
import LizhaoPanel from "../../../src/lizhao/LizhaoPanel.vue";
import "../../../src/style.css";
import "../../../src/scene.css";
import "../../../src/immersive.css";
import "../../../src/readability.css";
const state = shallowRef(lizhaoDepthCheckpoint());
let serial = 0;
function act(i: Intent) {
  const next = dispatch(state.value, { ...i, id: `assay-preview-${++serial}` });
  if (!validState(next)) throw Error("Invalid assay state");
  state.value = next;
}
createApp({
  setup: () => () =>
    h(
      "div",
      {
        style:
          "height:100vh;display:flex;flex-direction:column;overflow:hidden",
      },
      [
        h(
          "nav",
          { style: "padding:8px;display:flex;gap:12px;background:#10291f" },
          [
            h("span", "隔离检查点 · 不读写玩家存档"),
            h(
              "button",
              { onClick: () => (state.value = lizhaoDepthCheckpoint()) },
              "重新检查",
            ),
            h(
              "button",
              {
                onClick: () =>
                  (state.value = migrateSave(
                    JSON.parse(JSON.stringify(state.value)),
                  )),
              },
              "模拟读档",
            ),
            h("span", `第${state.value.month}月 · 灵草${state.value.herbs}`),
          ],
        ),
        h(
          "main",
          { style: "flex:1;min-height:0" },
          h(LizhaoPanel, {
            style: "height:100%",
            game: state.value,
            busy: false,
            onAct: act,
          }),
        ),
      ],
    ),
}).mount("#app");
