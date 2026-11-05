import { createApp, h, shallowRef } from "vue";
import {
  dispatch,
  validState,
  migrateSave,
  type Intent,
} from "../../../src/core";
import { nascentCrossingCheckpoint } from "../../../tools/nascent-crossing-checkpoint";
import NascentPanel from "../../../src/nascent-soul/NascentPanel.vue";
import "../../../src/style.css";
import "../../../src/scene.css";
import "../../../src/immersive.css";
import "../../../src/readability.css";
const key = "xxrs-crossing-isolated-preview";
const saved = sessionStorage.getItem(key),
  payload = saved ? JSON.parse(saved) : null;
const state = shallowRef(
  payload ? migrateSave(payload.state) : nascentCrossingCheckpoint(),
);
let serial = payload?.serial ?? 0;
function save() {
  sessionStorage.setItem(key, JSON.stringify({ state: state.value, serial }));
}
function act(i: Intent) {
  const next = dispatch(state.value, {
    ...i,
    id: `crossing-preview-${++serial}`,
  });
  if (!validState(next)) throw Error("Invalid crossing state");
  state.value = next;
  save();
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
          {
            style:
              "padding:8px;display:flex;gap:12px;background:#10291f;color:#f1e6ca;font-size:14px",
          },
          [
            h("span", "隔离检查点 · 仅保存此标签页验收进度"),
            h(
              "button",
              {
                onClick: () => {
                  state.value = nascentCrossingCheckpoint();
                  save();
                },
              },
              "重新检查",
            ),
            h(
              "button",
              {
                disabled: state.value.treasures.artifacts.includes("tideSeal"),
                onClick: () =>
                  act({
                    type: "treasure",
                    action: { kind: "deploy", item: "tideSeal" },
                  }),
              },
              "装配镇潮印",
            ),
            h("span", `第${state.value.month}月 · 灵草${state.value.herbs}`),
          ],
        ),
        h(
          "main",
          { style: "flex:1;min-height:0" },
          h(NascentPanel, {
            style: "height:100%",
            game: state.value,
            busy: false,
            onAct: act,
          }),
        ),
      ],
    ),
}).mount("#app");
