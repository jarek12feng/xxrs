import { createApp, h, shallowRef } from "vue";
import CorrespondencePanel from "../../src/correspondence/CorrespondencePanel.vue";
import { dispatch, validState, type Intent } from "../../src/core";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../../tools/foundation-journey-checkpoint";
const p = journeyPlayer(journeyCheckpoint());
p.act({ kind: "travel", destination: "ferry" });
const state = shallowRef(p.state),
  navigation = shallowRef("");
let serial = 0;
createApp({
  render: () =>
    h("div", [
      h(CorrespondencePanel, {
        game: state.value,
        busy: false,
        onAct: (intent: Intent) => {
          state.value = dispatch(state.value, {
            ...intent,
            id: `preview-mail-${++serial}`,
          });
          if (!validState(state.value))
            throw new Error("Invalid correspondence state");
        },
        onNavigate: (to: string) => {
          navigation.value = `已请求打开 ${to}；隔离页不导航到主存档。`;
        },
      }),
      h("p", navigation.value),
      h(
        "p",
        `公共状态：${state.value.secretPact.stage}；第${state.value.month}月；${validState(state.value) ? "存档校验通过" : "存档校验失败"}`,
      ),
    ]),
}).mount("#app");
