/** Isolated component preview. Does not read or write browser saves. */
import { createApp, h, shallowRef } from "vue";
import { createGame, type State, type Intent } from "../src/core";
import Panel from "../src/nascent-soul/NascentPanel.vue";
import {
  nascentQuote,
  runNascent,
  type NascentAction,
} from "../src/nascent-soul/rules";
let serial = 0;
const tick = (s: State) => ({ ...s, month: s.month + 1, age: s.age + 1 });
function send(s: State, a: NascentAction) {
  const q = nascentQuote(s, a);
  if (q.error) throw Error(q.error);
  return runNascent(s, a, "preview" + serial++, tick);
}
function base() {
  const s = createGame("闻舟", "wood", 17, "insightful", "male");
  s.pending = null;
  s.story.stage = "resolved";
  s.story.choice = "self";
  s.adventure.step = "done";
  s.realm = 2;
  s.limit = 6000;
  s.age = 1600;
  s.month = 1408;
  s.stones = 500;
  s.herbs = 100;
  s.study = 4;
  s.foundation = 24;
  s.sense = 36;
  s.mastery = 16;
  s.foundationJourney.cultivation = 600;
  s.nascentSoul.thunder.discovered = true;
  s.nascentSoul.thunder.method = "stillness";
  s.nascentSoul.thunder.practiced = true;
  s.outerSea.location = "ferry";
  s.outerSea.cultivation = 899;
  s.conclave.stage = 2;
  s.conclave.depth = 2;
  s.conclave.attuned = true;
  s.conclave.method = "inherit";
  s.lizhao = {
    ...s.lizhao,
    cleared: true,
    outerCleared: true,
    recipeVerified: true,
    reagent: 4,
    route: "independent",
  };
  return s;
}
let s = base();
const trial = send(s, { kind: "trial" });
s = trial;
for (const move of ["body", "mind", "break", "body", "mind", "break"] as const)
  s = send(s, { kind: "trialMove", move });
s = send(s, { kind: "complete" });
s.social.met = true;
s.social.metMonth = s.month - 120;
s.social.bonded = true;
s.foundationJourney.bond = "promised";
s = send(s, { kind: "ceremony", choice: "discuss" });
const ceremony = s;
for (const [topic, choice] of [
  ["duty", "decline"],
  ["home", "letter"],
  ["promise", "carry"],
  ["companion", "explain"],
] as const)
  s = send(s, { kind: "commit", topic, choice });
s.outerSea.cultivation = 1200;
for (const a of [
  { kind: "claimMarrow" },
  { kind: "brew", method: "self", fire: "steady" },
  { kind: "land", choice: "independent" },
  { kind: "protection", choice: "array" },
  { kind: "begin" },
] as NascentAction[])
  s = send(s, a);
const attempt = s;
for (const move of ["channel", "observe", "unite"] as const)
  s = send(s, { kind: "step", move });
const thunder = structuredClone(s);
// Outcome composition fixture only, never exported as a gameplay save.
s.nascentSoul.thunder.battle = null;
s.nascentSoul.thunder.cleared = true;
s.realm = 3;
const cleared = structuredClone(s);
s = send(s, { kind: "emerge" });
const celebration = s;
const states = { trial, ceremony, attempt, thunder, cleared, celebration };
const game = shallowRef(thunder);
const mode = shallowRef("thunder");
createApp({
  render: () =>
    h("main", [
      h("nav", [
        h("strong", "独立组件预览 · 隔离样例，非连续新档试玩"),
        ...Object.entries({
          trial: "圆满试炼",
          ceremony: "结契商议",
          attempt: "凝婴三段",
          thunder: "三重天劫",
          cleared: "劫后场景",
          celebration: "出关大典",
        }).map(([key, label]) =>
          h(
            "button",
            {
              onClick: () => {
                game.value = structuredClone(
                  states[key as keyof typeof states],
                );
                mode.value = key;
              },
            },
            label,
          ),
        ),
      ]),
      h(Panel, {
        key: mode.value,
        game: game.value,
        busy: false,
        onAct: (intent: Intent) => {
          if (intent.type === "nascentSoul")
            game.value = send(game.value, intent.action);
        },
      }),
    ]),
}).mount("#app");
