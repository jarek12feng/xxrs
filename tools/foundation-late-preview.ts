import { createApp, h, shallowRef, ref, watch } from "vue";
import SocialPanel from "../src/SocialPanel.vue";
import {
  combatFeedback as projectCombatFeedback,
  type CombatFeedback,
} from "../src/foundation-journey/feedback";
import FoundationPanel from "../src/foundation-journey/FoundationPanel.vue";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "./foundation-journey-checkpoint";
import { dispatch, migrateSave, validState, type Intent } from "../src/core";
import { actionReceipt, type ActionReceipt } from "../src/action-feedback";
import "../src/style.css";
import "../src/scene.css";
import "../src/immersive.css";
import "../src/readability.css";
import { createMusicPlayer, musicNames } from "../src/local-music";
import { createSoundscape } from "../src/audio";
import { createFileEffects } from "../src/file-effects";
import { foundationAudioScene } from "../src/audio-scene";
import { actionSound } from "../src/action-sound";
const enabled = ref(false),
  playing = ref("静音"),
  lastCue = ref("尚无事件"),
  audioErrors = ref("");
const sound = createSoundscape(undefined, createFileEffects());
const music = createMusicPlayer(
  undefined,
  (text) => (audioErrors.value = text),
  (cue) => (playing.value = cue ? musicNames[cue] : "静音"),
);
function syncAudio() {
  const scene = foundationAudioScene(
    game.value,
    mode.value === "journey" ? "world" : "arena",
  )!;
  music.scene(scene.music);
  sound.scene("moon", scene.ambient);
}
async function toggleAudio() {
  enabled.value = !enabled.value;
  sound.settings({ enabled: enabled.value, ambience: 0.25, effects: 0.35 });
  music.settings(enabled.value, 0.45);
  music.unlock();
  await sound.unlock();
}
const visibility = () => {
  sound.hidden(document.hidden);
  music.hidden(document.hidden);
};
document.addEventListener("visibilitychange", visibility);
window.addEventListener(
  "pagehide",
  () => {
    sound.dispose();
    music.dispose();
    document.removeEventListener("visibilitychange", visibility);
  },
  { once: true },
);
const combatFeedback = shallowRef<CombatFeedback | null>(null);
const game = shallowRef(journeyCheckpoint()),
  receipt = shallowRef<ActionReceipt | null>(null),
  narrow = ref(false),
  mode = ref("board");
watch([game, mode], syncAudio, { immediate: true });
let serial = 0;
function act(intent: Intent) {
  const next = dispatch(game.value, {
    ...intent,
    id: `manual-late-${++serial}`,
  });
  if (!validState(next)) throw new Error("Invalid state");
  lastCue.value = actionSound(game.value, next, intent);
  receipt.value = actionReceipt(game.value, next, intent);
  combatFeedback.value = projectCombatFeedback(game.value, next, intent);
  game.value = migrateSave(JSON.parse(JSON.stringify(next)));
  sound.cue(lastCue.value as ReturnType<typeof actionSound>);
}
createApp({
  setup: () => () =>
    h(
      "main",
      {
        style: {
          margin: "0 auto",
          padding: "12px",
          maxWidth: narrow.value ? "390px" : "980px",
        },
      },
      [
        h(
          "button",
          { onClick: toggleAudio },
          enabled.value ? "关闭声音" : "开启声音",
        ),
        h(
          "p",
          { role: "status" },
          `配乐：${playing.value} · 事件音：${lastCue.value} ${audioErrors.value}`,
        ),
        h("h1", "筑基行旅与试剑 · 独立验收"),
        h("p", "检查点由公开命令生成，每步序列化校验，不读写玩家存档。"),
        h(
          "button",
          { onClick: () => (narrow.value = !narrow.value) },
          "切换 390px 内容宽度",
        ),
        h(
          "button",
          {
            onClick: () =>
              (mode.value = mode.value === "board" ? "journey" : "board"),
          },
          "切换行旅 / 榜单",
        ),
        h(
          "button",
          {
            onClick: () => {
              const p = journeyPlayer(journeyCheckpoint("male", true));
              for (const id of ["rank1", "rank2", "rank3", "rank4"] as const)
                p.fight(id);
              game.value = p.state;
              receipt.value = null;
              combatFeedback.value = null;
            },
          },
          "载入公开命令生成的争魁检查点",
        ),
        h(
          "button",
          {
            onClick: () => {
              game.value = journeyCheckpoint("male", true);
              mode.value = "journey";
              receipt.value = null;
              combatFeedback.value = null;
            },
          },
          "载入圆满试炼检查点",
        ),
        h(
          "button",
          {
            onClick: () => {
              const p = journeyPlayer(journeyCheckpoint("male", true));
              p.act({ kind: "travel", destination: "estate" });
              p.act({ kind: "sideInvestigate", side: "estate" });
              p.fight("estate");
              p.act({ kind: "sideResolve", side: "estate", outcome: "shared" });
              game.value = p.state;
              mode.value = "journey";
              receipt.value = null;
              combatFeedback.value = null;
            },
          },
          "载入药庄共同契约回访",
        ),
        h(
          "button",
          {
            onClick: () => {
              const p = journeyPlayer(journeyCheckpoint("male", true));
              p.fight("culmination");
              p.act({ kind: "travel", destination: "home" });
              p.act({ kind: "epilogue" });
              game.value = p.state;
              mode.value = "journey";
              receipt.value = null;
              combatFeedback.value = null;
            },
          },
          "载入归山尾声检查点",
        ),
        h(
          "button",
          {
            onClick: () =>
              act({ type: "advance", activity: "cultivate", months: 3 }),
          },
          "吐纳三月",
        ),
        receipt.value
          ? h(
              "aside",
              {
                role: "status",
                style: {
                  background: "#294238",
                  color: "#fff7df",
                  padding: "16px",
                  margin: "12px 0",
                  border: "1px solid #d6b675",
                },
              },
              [
                h(
                  "button",
                  { onClick: () => (receipt.value = null) },
                  "关闭验收回执",
                ),
                h("h2", receipt.value.title),
                h("p", receipt.value.notes.join(" ")),
                h(
                  "p",
                  receipt.value.changes
                    .map((c) => `${c.label} ${c.before} → ${c.after}`)
                    .join(" / "),
                ),
                h("p", receipt.value.next),
              ],
            )
          : null,
        mode.value === "board"
          ? h(SocialPanel, {
              game: game.value,
              combatFeedback: combatFeedback.value,
              busy: false,
              running: false,
              mode: "arena",
              onAct: act,
            })
          : h(FoundationPanel, {
              game: game.value,
              combatFeedback: combatFeedback.value,
              busy: false,
              onAct: act,
              onEquipment: () => act({ type: "equip", technique: "spring" }),
            }),
      ],
    ),
}).mount("#app");
