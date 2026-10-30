<script setup lang="ts">
import {
  ref,
  shallowRef,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import { defineStore } from "pinia";
import { presences } from "./landmarks";
import { actionSound } from "./action-sound";
import { createMusicPlayer, sceneMusic, musicNames } from "./local-music";
import PreparationValues from "./PreparationValues.vue";
import LifeReview from "./LifeReview.vue";
import { automaticPause, type PauseReason } from "./cultivation-feedback";
import { openingGuide } from "./opening-guide";
import { expeditionGoal } from "./expedition/progression";
import { createSoundscape, soundSettings, type SoundMood } from "./audio";
// User-authorized audio revision; gameplay freeze remains in force.
const localMusicEnabled = true;
let music:
  ReturnType<typeof import("./local-music").createMusicPlayer> | undefined;
const musicVolume = ref(0.45);
const musicNotice = ref("");
const musicTitle = ref("");
const musicPlaying = ref("");
import { createFileEffects } from "./file-effects";
const sound = createSoundscape(undefined, createFileEffects());
const soundPrefs = ref(soundSettings(null));
const soundNotice = ref("");
function blurSound() {
  sound.hidden(true);
  music?.hidden(true);
}
function syncSoundPreference(event: StorageEvent) {
  if (event.key !== "xxrs-sound-v1") return;
  soundPrefs.value = soundSettings(event.newValue);
  sound.settings(soundPrefs.value);
  music?.settings(soundPrefs.value.enabled, musicVolume.value);
}
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    music?.dispose();
    sound.dispose();
  });
function storeSound() {
  sound.settings(soundPrefs.value);
  music?.settings(soundPrefs.value.enabled, musicVolume.value);
  try {
    localStorage.setItem("xxrs-sound-v1", JSON.stringify(soundPrefs.value));
    localStorage.setItem("xxrs-local-music-volume", String(musicVolume.value));
  } catch {
    /* Preferences are optional. */
  }
}
async function unlockSound() {
  if (soundPrefs.value.enabled) music?.unlock();
  if (soundPrefs.value.enabled)
    soundNotice.value = (await sound.unlock())
      ? ""
      : "此设备暂不能播放声音，游戏仍可正常进行。";
}
async function toggleSound() {
  soundPrefs.value.enabled = !soundPrefs.value.enabled;
  storeSound();
  if (soundPrefs.value.enabled) await unlockSound();
}

import {
  aptitudes,
  activeEventId,
  companion,
  type Gender,
  cultivationGain,
  refineCost,
  growthGoals,
  mainTraining,
  replayHints,
  type Aptitude,
  createGame,
  dispatch,
  paths,
  inheritances,
  eventView,
  breakthroughDetails,
  nextGoal,
  actionError,
  preparationError,
  migrateSave,
  MAX_QI,
  type State,
  type Path,
  type Activity,
  type Inheritance,
  type Intent,
} from "./core";
import { luchiView } from "./characters";
import WorldPanel from "./WorldPanel.vue";
import SavePanel from "./SavePanel.vue";
import InventoryPanel from "./InventoryPanel.vue";
import { writeSlot } from "./save-slots";
import { adventureScenes, adventureGoal } from "./adventure";
import { roadScenes, roadGoal } from "./road";
import { mistScenes, mistGoal } from "./mist";
import AdventurePanel from "./AdventurePanel.vue";
import RoadPanel from "./RoadPanel.vue";
import MistPanel from "./MistPanel.vue";
import SceneBackdrop from "./SceneBackdrop.vue";
import ItemArt from "./presentation/ItemArt.vue";
import PracticeStage from "./PracticeStage.vue";
import ActionFeedback from "./ActionFeedback.vue";
import SceneArrival from "./SceneArrival.vue";
import { actionReceipt, type ActionReceipt } from "./action-feedback";
const receipt = shallowRef<ActionReceipt | null>(null);
const receiptExpanded = ref(false);
const receiptSerial = ref(0);
const arrivalFinished = ref(false);
const practice = ref<Activity | null>(null);
const practiceSerial = ref(0);
let practiceTimer: ReturnType<typeof setTimeout> | undefined;
let receiptTimer: ReturnType<typeof setTimeout> | undefined;
let actionOrigin: HTMLElement | null = null;
async function closeReceipt() {
  const returnPanel = receipt.value?.returnTo;
  const returnToPerson = !!returnPanel || receipt.value?.ritual === "duel";
  receiptExpanded.value = false;
  receipt.value = null;
  clearTimeout(receiptTimer);
  if (
    returnPanel &&
    (returnPanel !== "relationship" || game.value?.social.met) &&
    !game.value?.pending &&
    !game.value?.social.scene
  )
    dialog.value = returnPanel;
  await nextTick();
  if (modal.value)
    document.querySelector<HTMLElement>("[role=dialog] h2")?.focus();
  else if (actionOrigin?.isConnected) actionOrigin.focus();
  else if (returnToPerson) {
    const heading =
      document.querySelector<HTMLElement>(
        ".social-content .controls-heading",
      ) || document.querySelector<HTMLElement>(".journey .scene-controls h3");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
}
function inspectReceipt() {
  clearTimeout(receiptTimer);
  ui.running = false;
  receiptExpanded.value = true;
  receiptSerial.value++;
}
const atlasMode = ref<"story" | "explore">("story");
const selectedPlace = ref<"valley" | "peak" | "sea">("valley");
const view = ref<"story" | "cultivation">("story");
const showRoad = ref(false);
const titleScreen = ref(true);
const creating = ref(false);
const targetVisible = ref(false);
const panelTitles: Record<string, string> = {
  character: "人物",
  inventory: "储物袋",
  skills: "功法",
  world: "山河地图",
  relationship: "人物关系",
  sect: "宗门师承",
  arena: "听松擂台",
  gear: "炼器与购药",
  queue: "修行安排",
  journal: "任务与见闻",
  system: "系统菜单",
  saves: "保存与读取",
  backup: "备份与迁移",
  settings: "显示与声音",
  new: "开始新的旅程",
};
const worldTabs = [
  "skills",
  "world",
  "relationship",
  "sect",
  "arena",
  "gear",
  "queue",
] as const;
const worldTab = computed(() => worldTabs.find((t) => t === dialog.value));
const currentScene = computed(() => {
  const g = game.value;
  if (!g || titleScreen.value || view.value === "cultivation")
    return { image: "/scenes/moon-terrace.png", name: "听松山居" };
  if (!showRoad.value && g.adventure.mist.stage !== "dormant") {
    const x = mistScenes[g.adventure.mist.stage];
    return { image: x.image, name: x.title };
  }
  if (g.adventure.step === "done") return roadScenes[g.adventure.road.stage];
  return adventureScenes[g.adventure.step];
});
const currentGoal = computed(() => {
  const g = game.value;
  if (!g) return "";
  if (view.value === "cultivation") return nextGoal(g);
  if (!showRoad.value && g.adventure.mist.stage !== "dormant")
    return mistGoal(g);
  if (g.adventure.step === "done") return roadGoal(g);
  return adventureGoal(g.adventure);
});
const opening = computed(() => (game.value ? openingGuide(game.value) : null));
async function followOpening() {
  if (!opening.value || ui.busy || receiptExpanded.value) return;
  ui.running = false;
  switch (opening.value.action) {
    case "road":
      view.value = "story";
      showRoad.value = true;
      if (game.value?.adventure.road.stage === "home")
        await worldAct({
          type: "road",
          action: game.value.adventure.road.thanked ? "market" : "thanks",
        });
      break;
    case "cultivate":
      view.value = "cultivation";
      activity.value = "cultivate";
      break;
    case "skills":
      openPanel("skills");
      break;
    case "sect":
      openPanel("sect");
      break;
    case "break":
      pill.value = !!game.value?.pills;
      openPanel("break");
      break;
  }
}
function openPanel(id: string) {
  if (ui.busy || receiptExpanded.value) return;
  if (
    game.value?.expedition.duel &&
    !["system", "saves", "settings", "backup"].includes(id)
  )
    return;
  ui.running = false;
  dialog.value = id;
}
async function restoreGame(state: State) {
  if (await persist(state)) {
    titleScreen.value = false;
    creating.value = false;
    pauseReason.value = null;
    dialog.value = "";
    receipt.value = null;
    receiptExpanded.value = false;
    showRoad.value = false;
    view.value = "story";
    ui.history = false;
  }
}
async function beginNew() {
  if (ui.busy) return;
  ui.busy = true;
  try {
    if (game.value)
      await writeSlot("archive-" + crypto.randomUUID(), game.value);
    creating.value = true;
    titleScreen.value = true;
    dialog.value = "";
  } catch (e) {
    notice.value = "未能备份原旅程，已取消新建：" + String(e);
  } finally {
    ui.busy = false;
  }
}
function setTextSize(large: boolean) {
  document.documentElement.classList.toggle("large-reading", large);
}
function resumeGame() {
  titleScreen.value = false;
  creating.value = false;
}

import { load, save } from "./save";
const useSession = defineStore("session", {
  state: () => ({ running: false, busy: false, history: false }),
});
const ui = useSession(),
  game = shallowRef<State | null>(null);
const ready = ref(false),
  loadError = ref(false),
  name = ref("沈青禾"),
  path = ref<Path>("wood"),
  aptitude = ref<Aptitude>("insightful"),
  gender = ref<Gender>("male"),
  inheritance = ref<Inheritance>("none"),
  activity = ref<Activity>("cultivate"),
  notice = ref(""),
  saved = ref(""),
  dialog = ref(""),
  pill = ref(false);
watch(
  () => !!game.value?.social.arena.duel,
  (active) => {
    if (active) view.value = "cultivation";
  },
);
watch(view, () => {
  ui.running = false;
});
const queueMode = ref(false);
const pauseReason = ref<PauseReason | null>(null);
function startAutomatic() {
  queueMode.value = false;
  pauseReason.value = null;
  ui.running = !ui.running;
}
function followPause() {
  const target = pauseReason.value?.target;
  if (!target || ui.busy || receiptExpanded.value) return;
  pauseReason.value = null;
  if (target === "story") {
    view.value = "story";
    ui.history = false;
  } else if (target === "cultivate") view.value = "cultivation";
  else {
    if (target === "break") pill.value = !!game.value?.pills;
    openPanel(target);
  }
}
const npc = computed(() => (game.value ? luchiView(game.value) : null));
const heart = computed(() =>
  game.value && !game.value.pending && game.value.social.scene
    ? companion(game.value)
    : null,
);
const eventMood = computed(() =>
  game.value?.social.scene?.kind === "watch"
    ? "arena"
    : ["night", "pledge"].includes(game.value?.social.scene?.kind ?? "")
      ? "moon"
      : "day",
);
const eventScene = computed(() =>
  heart.value
    ? eventMood.value === "moon"
      ? "/scenes/moon-terrace.png"
      : eventMood.value === "arena"
        ? "/scenes/sect-arena.png"
        : "/scenes/mist-path.jpg"
    : npc.value?.scene,
);
const costs = computed(() => (game.value ? refineCost(game.value) : null));
const fileInput = ref<HTMLInputElement>();
const event = computed(() => (game.value ? eventView(game.value) : null));
const systemOverlay = computed(() =>
  ["system", "saves", "settings", "backup"].includes(dialog.value),
);
const desktopRuntime = window.location.protocol === "xxrs:";
function quitGame() {
  if (!ui.busy && desktopRuntime) window.close();
}
const modal = computed(() =>
  titleScreen.value || systemOverlay.value
    ? dialog.value
    : receiptExpanded.value
      ? "action-feedback"
      : event.value
        ? activeEventId(game.value!)
        : game.value?.status !== "alive" && game.value
          ? game.value.status
          : dialog.value,
);
const details = computed(() =>
  game.value ? breakthroughDetails(game.value, pill.value) : null,
);
const activities: { id: Activity; name: string; hint: string }[] = [
  { id: "cultivate", name: "吐纳", hint: "根骨影响吐纳速度" },
  {
    id: "meditate",
    name: "凝神",
    hint: "神识 +1 · 修为 +2；神识 8 可识阵、省炼丹灵石",
  },
  {
    id: "study",
    name: "研读",
    hint: "心得 +1，高悟性 +2；悟性 8 与心得 2 可解阵、省灵草",
  },
  { id: "gather", name: "采药", hint: "灵草 +2 · 修为 +3" },
  { id: "train", name: "历练", hint: "剑意 +1 · 修为 +10；每四重受伤" },
  { id: "work", name: "劳作", hint: "每月共得 5 灵石" },
  { id: "rest", name: "养伤", hint: "每月伤势 −1" },
];
async function persist(s: State) {
  ui.busy = true;
  try {
    await save(s);
    game.value = s;
    saved.value = "已自动保存";
    notice.value = "";
    return true;
  } catch (e) {
    notice.value = String(e);
    ui.running = false;
    return false;
  } finally {
    ui.busy = false;
  }
}
async function act(intent: Intent) {
  if (!game.value || ui.busy || receiptExpanded.value) return false;
  const automatic = ui.running;
  actionOrigin = document.activeElement as HTMLElement | null;
  const old = game.value,
    n = dispatch(old, { ...intent, id: crypto.randomUUID() });
  if (n === old) {
    if (automatic) {
      ui.running = false;
      pauseReason.value = automaticPause(
        old,
        activity.value,
        queueMode.value,
        old,
      );
      notice.value = pauseReason.value
        ? ""
        : "本次行动未执行，自动修行已暂停，没有新增消耗。";
    } else
      notice.value =
        "本次行动未执行：请检查材料、修为或当前待处理剧情。没有新增消耗。";
    return false;
  }
  const ok = await persist(n);
  if (ok) {
    if (!automatic) pauseReason.value = null;
    const changedScene =
      old.adventure.step !== n.adventure.step ||
      old.adventure.road.stage !== n.adventure.road.stage ||
      old.adventure.mist.stage !== n.adventure.mist.stage;
    if (changedScene && !dialog.value) {
      await nextTick();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    const performed =
      intent.type === "advance"
        ? intent.activity
        : intent.type === "queueTick"
          ? old.journey.queue[0]?.action
          : undefined;
    if (
      performed &&
      [
        "cultivate",
        "meditate",
        "study",
        "work",
        "gather",
        "train",
        "rest",
      ].includes(performed)
    ) {
      clearTimeout(practiceTimer);
      practice.value = performed as Activity;
      practiceSerial.value++;
      practiceTimer = setTimeout(() => {
        practice.value = null;
      }, 3600);
    }
    if (
      !automatic ||
      (old.status !== n.status && ["dead", "complete"].includes(n.status))
    )
      sound.cue(actionSound(old, n, intent));
    clearTimeout(receiptTimer);
    receipt.value = actionReceipt(old, n, intent);
    arrivalFinished.value = false;
    receiptSerial.value++;
    receiptExpanded.value =
      (!!receipt.value?.ritual || !!receipt.value?.spotlight) && !automatic;
    if (receiptExpanded.value) {
      ui.running = false;
      dialog.value = "";
    }
    // Ordinary actions stay non-blocking; the full details remain in the log.
    else if (!receipt.value?.scene)
      receiptTimer = setTimeout(() => {
        receipt.value = null;
      }, 6500);
  }
  if (ok && automatic) {
    const reason = automaticPause(n, activity.value, queueMode.value, old);
    if (reason) {
      ui.running = false;
      pauseReason.value = reason;
    }
  }
  return ok;
}
async function start() {
  if (!ui.busy && !loadError.value)
    if (
      await persist(
        createGame(
          name.value,
          path.value,
          crypto.getRandomValues(new Uint32Array(1))[0],
          aptitude.value,
          gender.value,
        ),
      )
    ) {
      titleScreen.value = false;
      creating.value = false;
    }
}
async function advance(months: number) {
  queueMode.value = false;
  await act({ type: "advance", activity: activity.value, months });
}
function resumeStory() {
  dialog.value = "";
  view.value = "story";
  ui.history = false;
  showRoad.value = false;
}
async function travelFromMap(intent: Intent) {
  ui.running = false;
  if (await act(intent)) resumeStory();
}
async function worldAct(intent: Intent) {
  ui.running = false;
  if (intent.type === "prepare") {
    await prepare(intent.kind);
    return;
  }
  await act(intent);
}
async function openMist() {
  if (game.value?.adventure.mist.stage === "dormant")
    await worldAct({ type: "mist", action: "receive" });
  showRoad.value = false;
}
function runQueue() {
  dialog.value = "";
  view.value = "cultivation";
  queueMode.value = true;
  pauseReason.value = null;
  ui.running = true;
}
async function prepare(kind: "refine" | "retreat") {
  ui.running = false;
  if (
    kind === "retreat" &&
    game.value?.story.stage === "waiting" &&
    game.value.month + 6 >= 36
  ) {
    dialog.value = "retreat";
    return;
  }
  await act({ type: "prepare", kind });
}
async function commitBreak() {
  if (await act({ type: "break", pill: pill.value })) dialog.value = "";
}
async function nextLife() {
  if (
    await act({
      type: "next",
      path: path.value,
      inheritance: inheritance.value,
      aptitude: aptitude.value,
    })
  ) {
    activity.value = "cultivate";
    pauseReason.value = null;
    inheritance.value = "none";
  }
}
function download(value: unknown, suffix = "") {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "问道听松" + suffix + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importSave(e: Event) {
  ui.running = false;
  const el = e.target as HTMLInputElement,
    file = el.files?.[0];
  try {
    if (ui.busy || receiptExpanded.value) return;
    if (!file) return;
    if (file.size > 2e6) throw new Error("存档不得超过 2 MB");
    const s = migrateSave(JSON.parse(await file.text()));
    if (ui.busy || receiptExpanded.value) return;
    if (
      confirm("以此存档替换当前进度？建议先导出备份。") &&
      (await persist(s))
    ) {
      loadError.value = false;
      dialog.value = "";
      receipt.value = null;
      clearTimeout(receiptTimer);
    }
  } catch (e) {
    notice.value = String(e);
  } finally {
    el.value = "";
  }
}
function keyboard(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (
    e.key === "Escape" &&
    !receiptExpanded.value &&
    (event.value || (game.value && game.value.status !== "alive"))
  ) {
    e.preventDefault();
    dialog.value = systemOverlay.value ? "" : "system";
    return;
  }
  if (!modal.value) {
    if (e.key === "Escape") {
      e.preventDefault();
      openPanel("system");
    } else if (
      !titleScreen.value &&
      !target?.closest("input, textarea, select, [contenteditable=true]")
    ) {
      const id = (
        {
          c: "character",
          b: "inventory",
          m: "world",
          j: "journal",
          k: "skills",
        } as Record<string, string>
      )[e.key.toLowerCase()];
      if (id) {
        e.preventDefault();
        openPanel(id);
      }
    }
    return;
  }
  if (
    e.key === "Escape" &&
    (titleScreen.value || (!event.value && game.value?.status === "alive"))
  )
    dialog.value = "";
  if (e.key === "Tab") {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[role=dialog] button:not(:disabled),[role=dialog] input:not(:disabled),[role=dialog] select,[role=dialog] summary",
      ),
    );
    const first = nodes[0],
      last = nodes.at(-1);
    if (!first) return;
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        !nodes.includes(document.activeElement as HTMLElement))
    ) {
      e.preventDefault();
      last?.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last ||
        !nodes.includes(document.activeElement as HTMLElement))
    ) {
      e.preventDefault();
      first.focus();
    }
  }
}
watch(modal, async (value) => {
  if (value) {
    ui.running = false;
    await nextTick();
    document.querySelector<HTMLElement>("[role=dialog] h2")?.focus();
  }
});
function hidden() {
  sound.hidden(document.hidden);
  music?.hidden(document.hidden);
  if (document.hidden && ui.running) {
    ui.running = false;
    pauseReason.value = {
      text: "离开页面后自动修行已暂停，没有离线收益。回来后可自行继续。",
      target: queueMode.value ? "queue" : "cultivate",
      label: "查看修行",
    };
  }
}
let timer: ReturnType<typeof setInterval>;
let unmounted = false;
const stopAudioWatches: (() => void)[] = [];
onMounted(async () => {
  if (localMusicEnabled) {
    if (unmounted) return;
    music = createMusicPlayer(
      undefined,
      (message) => {
        musicNotice.value = message;
      },
      (cue) => {
        musicPlaying.value = cue ? musicNames[cue] : "";
      },
    );
    stopAudioWatches.push(
      watch(
        () => ({
          scene: currentScene.value,
          shrineRelit: game.value?.adventure.mist.revisited ?? false,
          fighting: Boolean(
            game.value?.social.arena.duel || game.value?.expedition.duel,
          ),
        }),
        ({ scene, fighting, shrineRelit }) => {
          const cue = fighting ? "trial" : sceneMusic(scene.name, shrineRelit);
          musicTitle.value = musicNames[cue];
          music?.scene(cue);
        },
        { immediate: true },
      ),
    );
    stopAudioWatches.push(
      watch(
        () =>
          Boolean(
            !titleScreen.value &&
            (event.value ||
              heart.value ||
              dialog.value === "npc" ||
              (receiptExpanded.value && receipt.value?.person)),
          ),
        (value) => music?.duck(value),
        { immediate: true },
      ),
    );
    try {
      const raw = localStorage.getItem("xxrs-local-music-volume");
      const value = raw === null ? 0.45 : Number(raw);
      musicVolume.value = Number.isFinite(value)
        ? Math.max(0, Math.min(1, value))
        : 0.45;
    } catch {
      /* Optional local preference. */
    }
  }
  stopAudioWatches.push(
    watch(currentScene, (scene) => {
      const mood =
        presences[scene.name]?.weather ??
        ("mood" in scene ? scene.mood : "moon");
      sound.scene(mood as SoundMood);
    }),
  );

  try {
    soundPrefs.value = soundSettings(localStorage.getItem("xxrs-sound-v1"));
  } catch {
    /* Optional settings. */
  }
  sound.settings(soundPrefs.value);
  music?.settings(soundPrefs.value.enabled, musicVolume.value);
  sound.hidden(document.hidden);
  music?.hidden(document.hidden);
  window.addEventListener("storage", syncSoundPreference);
  window.addEventListener("blur", blurSound);
  window.addEventListener("focus", hidden);
  document.addEventListener("pointerdown", unlockSound);
  document.addEventListener("keydown", unlockSound);
  document.addEventListener("visibilitychange", hidden);
  document.addEventListener("keydown", keyboard);
  try {
    const result = await load();
    game.value = result.state;
    saved.value = result.recovered ? "已恢复上一份备份" : "存档已读取";
  } catch (e) {
    loadError.value = true;
    notice.value = String(e);
  }
  ready.value = true;
  timer = setInterval(() => {
    if (ui.running && !ui.busy && !modal.value && !document.hidden)
      void (queueMode.value ? act({ type: "queueTick" }) : advance(1));
  }, 800);
});
onUnmounted(() => {
  unmounted = true;
  stopAudioWatches.forEach((stop) => stop());
  sound.dispose();
  music?.dispose();
  clearTimeout(practiceTimer);
  window.removeEventListener("storage", syncSoundPreference);
  window.removeEventListener("blur", blurSound);
  window.removeEventListener("focus", hidden);
  document.removeEventListener("pointerdown", unlockSound);
  document.removeEventListener("keydown", unlockSound);
  clearTimeout(receiptTimer);
  clearInterval(timer);
  document.removeEventListener("visibilitychange", hidden);
  document.removeEventListener("keydown", keyboard);
});
</script>
<template>
  <div v-if="ui.busy" class="saving-pulse" role="status">正在结算并保存……</div>
  <div v-if="notice" class="notice" role="alert">{{ notice }}</div>
  <div
    class="shell immersive-shell"
    :class="{ playing: game && !titleScreen }"
    :inert="!!modal"
  >
    <div
      class="world-wallpaper"
      :style="{ backgroundImage: `url(${currentScene.image})` }"
      aria-hidden="true"
    ></div>
    <header class="game-hud">
      <button
        v-if="game && !titleScreen"
        class="avatar-entry"
        aria-label="人物属性 C"
        @click="openPanel('character')"
      >
        <span class="avatar-seal">{{ game.name.slice(0, 1) }}</span
        ><span
          >{{ game.name
          }}<small
            >{{ game.realm ? "筑基" : "炼气" }} · {{ paths[game.path].name }} ·
            伤势 {{ game.injury }}</small
          ></span
        >
      </button>
      <span v-else class="brand">问道听松</span>
      <button
        class="sound-toggle"
        :aria-pressed="soundPrefs.enabled"
        @click="toggleSound"
      >
        {{ soundPrefs.enabled ? "声音已开" : "开启声音" }}
      </button>
      <div class="location-entry" v-if="game && !titleScreen">
        <button @click="openPanel('world')">{{ currentScene.name }}</button
        ><small>第 {{ game.life }} 世 · 第 {{ game.month }} 月</small>
      </div>
      <button
        class="system-entry"
        aria-label="系统菜单 Esc"
        @click="openPanel('system')"
      >
        ☰ 菜单
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        hidden
        @change="importSave"
      />
    </header>
    <main v-if="ready && titleScreen && !creating" class="title-screen">
      <p class="eyebrow">一卷山海 · 几世修行</p>
      <h1>问道听松</h1>
      <p>山关风起，故人待归。</p>
      <button v-if="game" class="primary" @click="resumeGame">
        继续游戏<small
          >{{ game.name }} · {{ game.realm ? "筑基" : "炼气" }} · 第
          {{ game.month }} 月</small
        >
      </button>
      <button
        :disabled="loadError"
        @click="game ? openPanel('new') : (creating = true)"
      >
        新的旅程
      </button>
      <button @click="openPanel('saves')">读取进度</button
      ><button @click="openPanel('system')">设置与帮助</button>
    </main>
    <main v-else-if="ready && (creating || !game)" class="creation">
      <div class="creation-art">
        <img src="/mountains.svg" alt="云海中的听松山" />
        <div class="art-copy">
          <span class="eyebrow">筑基篇 / 初入仙途</span>
          <h1>初入听松山</h1>
          <p>
            练成自己的法门，走出第一段仙途。<br />途中相遇的人，会记住你的选择。
          </p>
        </div>
      </div>
      <section class="creation-form">
        <button class="quiet" @click="creating = false">返回标题</button>
        <span class="eyebrow">十六岁 · 初入仙途</span>
        <h2>写下这一世的名字</h2>
        <label for="name">道号</label
        ><input id="name" v-model="name" maxlength="16" class="name-input" />
        <h3>选择先天资质</h3>
        <label class="field-label"
          >角色性别<select v-model="gender">
            <option value="male">男修 · 成年后可结识沈听澜</option>
            <option value="female">女修 · 成年后可结识尹照川</option>
          </select></label
        >
        <div class="aptitude-list">
          <button
            v-for="(a, id) in aptitudes"
            :key="id"
            :class="{ selected: aptitude === id }"
            :aria-pressed="aptitude === id"
            @click="aptitude = id"
          >
            <strong>{{ a.name }}</strong
            ><small>{{ a.description }}</small>
          </button>
        </div>
        <p class="fineprint">
          三组初始属性总和均为
          15。根骨、悟性先天固定；神识可通过凝神成长。资质不锁定路线。
        </p>
        <h3>选择修行之路</h3>
        <button
          v-for="(p, id) in paths"
          :key="id"
          class="path-card"
          :class="{ selected: path === id }"
          @click="path = id"
        >
          <span class="path-symbol">{{ id === "wood" ? "药" : "剑" }}</span
          ><span
            ><strong>{{ p.name }}</strong
            ><small>{{ p.description }}</small></span
          ></button
        ><button
          class="primary start"
          :disabled="ui.busy || loadError"
          @click="start"
        >
          踏入仙途 →
        </button>
        <p class="fineprint">
          本地单机 · 自动存档 · 无离线收益<br />旧版人生先封存，确认后进入新篇。
        </p>
      </section>
    </main>
    <main
      v-else-if="game && !titleScreen"
      class="game-layout"
      :class="{
        'story-mode': view === 'story' && !ui.history,
      }"
    >
      <section class="journey">
        <aside
          v-if="opening && !ui.history"
          class="opening-guide"
          aria-label="初入仙途指引"
        >
          <details :open="!game.adventure.road.thanked">
            <summary>{{ opening.title }}</summary>
            <p>{{ opening.body }}</p>
            <button
              :disabled="ui.busy || receiptExpanded"
              @click="followOpening"
            >
              {{ opening.label }}
            </button>
          </details>
        </aside>
        <aside
          v-if="pauseReason && !ui.running"
          class="opening-guide"
          role="status"
          aria-label="修行暂停原因"
        >
          <p>{{ pauseReason.text }}</p>
          <button :disabled="ui.busy || receiptExpanded" @click="followPause">
            {{ pauseReason.label }}
          </button>
          <button class="quiet" @click="pauseReason = null">收起</button>
        </aside>
        <nav>
          <button
            :class="{ active: !ui.history && view === 'story' }"
            @click="
              ui.history = false;
              view = 'story';
            "
          >
            当前冒险
          </button>
          <button
            :class="{ active: !ui.history && view === 'cultivation' }"
            @click="
              ui.history = false;
              view = 'cultivation';
            "
          >
            洞府修行</button
          ><button :class="{ active: ui.history }" @click="ui.history = true">
            人生卷宗
          </button>
        </nav>
        <MistPanel
          v-if="
            !ui.history &&
            view === 'story' &&
            !showRoad &&
            game.adventure.mist.stage !== 'dormant'
          "
          :game="game"
          :receipt="receipt"
          :busy="ui.busy || ui.running"
          @act="worldAct"
          @cultivate="view = 'cultivation'"
          @road="showRoad = true"
        />
        <RoadPanel
          v-else-if="
            !ui.history && view === 'story' && game.adventure.step === 'done'
          "
          :game="game"
          :receipt="receipt"
          :busy="ui.busy || ui.running"
          @act="worldAct"
          @cultivate="view = 'cultivation'"
          @mist="openMist"
          @map="openPanel('world')"
          @breakthrough="
            pill = game.pills > 0;
            dialog = 'break';
          "
        />
        <AdventurePanel
          v-else-if="!ui.history && view === 'story'"
          :game="game"
          :receipt="receipt"
          :busy="ui.busy || ui.running"
          @act="worldAct"
          @cultivate="view = 'cultivation'"
        />
        <template v-if="!ui.history && view === 'cultivation'"
          ><section
            class="cultivation-room desktop-scene"
            aria-label="洞府场景与修行"
          >
            <SceneBackdrop
              image="/scenes/moon-terrace.png"
              title="听松山居"
              eyebrow="一念长生 · 一诺千金"
              :body="
                game.realm
                  ? '云路已经向你展开。今夜在洞府整理行装，明日带着更稳的气息，再赴山外。'
                  : '山风穿过石台，灯火照着未读完的丹经。你知道山外有人在等，也知道每一次凝神，都是为了走得更远。'
              "
              compact
            />
            <PracticeStage
              :key="practiceSerial"
              :gender="game.social.gender"
              :activity="practice ?? activity"
              :playing="!!practice && !modal"
            />
            <fieldset
              class="cultivation-panel scene-controls"
              :disabled="!!game.social.arena.duel"
              aria-label="洞府修行"
            >
              <h3 class="controls-heading">洞府修行 · 操作区</h3>
              <div class="progress-label">
                <h2>
                  {{ game.realm ? "筑基已成 · 构筑与历练" : "炼气 → 筑基" }}
                </h2>
                <strong v-if="game.realm === 0"
                  >{{ game.qi }} / {{ MAX_QI }}</strong
                >
                <strong v-else
                  >探索
                  {{
                    game.journey.maps.valley +
                    game.journey.maps.peak +
                    game.journey.maps.sea
                  }}
                  / 9</strong
                >
              </div>
              <div v-if="game.realm === 0" class="qi-track">
                <i :style="{ width: (game.qi / MAX_QI) * 100 + '%' }"></i>
              </div>
              <p class="next-goal">{{ nextGoal(game) }}</p>
              <button
                v-if="game.realm === 1 && opening?.action === 'road'"
                :disabled="ui.busy || receiptExpanded"
                @click="followOpening"
              >
                {{ opening.label }}
              </button>
              <p v-if="game.realm === 0" class="fineprint">
                {{
                  game.qi < MAX_QI
                    ? `还差 ${MAX_QI - game.qi} 修为可尝试筑基。`
                    : "修为已满，可查看把握后决定是否突破。"
                }}
                炼丹、固本和护法可提高把握，不要求全部完成。伤势会降低成功率，可先静养。
              </p>
              <div class="activity-grid">
                <button
                  v-for="a in activities"
                  :key="a.id"
                  :class="{ selected: activity === a.id }"
                  :disabled="!!actionError(game, a.id) || ui.busy || ui.running"
                  :title="actionError(game, a.id)"
                  @click="activity = a.id"
                >
                  <strong>{{ a.name }}</strong
                  ><small>{{
                    actionError(game, a.id) ||
                    (a.id === "cultivate"
                      ? `每月修为 +${cultivationGain(game)}（含根骨加成）`
                      : a.id === "train"
                        ? `剑意 +1 · 修为 +${game.realm ? 0 : 10 + (game.journey.main === "blade" ? 4 : 0) + mainTraining(game) * 2}；${game.journey.support === "guard" ? "护身诀免历练伤势" : "每四重受伤"}`
                        : a.id === "work"
                          ? `每月灵石 +5${!game.realm && game.journey.main ? " · 修为 +" + ((game.journey.main === "breath" ? 4 : 0) + mainTraining(game) * 2) : ""}`
                          : a.id === "gather"
                            ? `灵草 +${2 + (game.journey.support === "herb" ? 1 + game.growth.training.herb : 0)} · 修为 +${game.realm ? 0 : 3}`
                            : a.id === "meditate"
                              ? `神识 +1${game.realm ? "" : " · 修为 +2"}；神识 8 可识阵、省炼丹灵石`
                              : a.hint)
                  }}</small>
                </button>
              </div>
              <div class="cultivation-actions">
                <button
                  class="primary"
                  :disabled="
                    ui.busy || (!ui.running && !!actionError(game, activity))
                  "
                  @click="startAutomatic"
                >
                  {{ ui.running ? "暂停" : "自动行动" }}</button
                ><button
                  class="secondary"
                  :disabled="
                    ui.busy || ui.running || !!actionError(game, activity)
                  "
                  @click="advance(1)"
                >
                  行动一月</button
                ><button
                  class="secondary"
                  :disabled="
                    ui.busy || ui.running || !!actionError(game, activity)
                  "
                  @click="advance(3)"
                >
                  行动三月
                </button>
              </div>
              <p class="fineprint">
                每月收入 1 灵石。自动每 0.8
                秒推进一月，遇关键剧情、修为满或切后台暂停。
              </p>
              <div class="preparations">
                <button
                  class="secondary"
                  :disabled="ui.busy || !!preparationError(game, 'refine')"
                  @click="prepare('refine')"
                >
                  炼筑基丹 · 三月<small>{{
                    preparationError(game, "refine") ||
                    `灵草 −${costs?.herbs} / 灵石 −${costs?.stones} / 筑基丹 +1`
                  }}</small></button
                ><button
                  class="secondary"
                  :disabled="ui.busy || !!preparationError(game, 'retreat')"
                  @click="prepare('retreat')"
                >
                  闭关固本 · 六月<small>{{
                    preparationError(game, "retreat") ||
                    `灵石 −8 / 根基 +${Math.min(6, 24 - game.foundation)}${game.realm ? "" : " / 修为 +" + Math.min(30, 360 - game.qi)}`
                  }}</small>
                </button>
              </div>
              <button
                class="break-button full"
                :disabled="ui.busy || game.realm === 1 || game.qi < MAX_QI"
                @click="
                  pill = game.pills > 0;
                  dialog = 'break';
                "
              >
                叩问天关 · 尝试筑基 ↗
              </button>
              <p v-if="game.result" class="last-result">{{ game.result }}</p>
            </fieldset>
          </section>
          <nav class="facility-actions" aria-label="山居设施">
            <button @click="openPanel('sect')">拜访师门</button
            ><button @click="openPanel('gear')">炼器与购药</button
            ><button @click="openPanel('arena')">听松擂台</button
            ><button @click="openPanel('queue')">修行安排</button>
          </nav>
        </template>
        <div
          v-if="ui.history"
          :class="{ 'desktop-scene history-room': ui.history }"
        >
          <SceneBackdrop
            v-if="ui.history"
            image="/scenes/moon-terrace.png"
            title="这一世的卷宗"
            eyebrow="灯下回望"
            body="摊开旧卷，走过的山路、赴过的约定与没说完的话，都还留在这里。"
            compact
          />
          <section class="timeline" :class="{ 'scene-controls': ui.history }">
            <div class="panel-heading">
              <h2>人生卷宗</h2>
              <span class="muted">{{
                ui.history ? "本世最近 180 条" : "近事三则"
              }}</span>
            </div>
            <article
              v-for="(entry, i) in game.log.slice(0, ui.history ? 180 : 3)"
              :key="i"
              :class="entry.kind"
            >
              <span class="timeline-dot"></span
              ><time>第 {{ entry.month }} 月</time>
              <p>{{ entry.text }}</p>
            </article>
          </section>
        </div>
      </section>
    </main>
    <p v-else class="loading">正在展开绘卷……</p>
    <template v-if="game && !titleScreen">
      <aside class="quest-tracker">
        <button
          :aria-expanded="targetVisible"
          @click="targetVisible = !targetVisible"
        >
          当前目标 {{ targetVisible ? "−" : "+" }}
        </button>
        <p v-if="targetVisible">{{ currentGoal }}</p>
        <button v-if="targetVisible" @click="openPanel('journal')">
          任务与见闻
        </button>
      </aside>
      <nav class="quick-dock" aria-label="随身功能">
        <button @click="openPanel('inventory')">储物袋 <kbd>B</kbd></button
        ><button @click="openPanel('skills')">功法 <kbd>K</kbd></button
        ><button @click="openPanel('world')">地图 <kbd>M</kbd></button
        ><button @click="openPanel('journal')">见闻 <kbd>J</kbd></button
        ><button @click="openPanel('relationship')">人物关系</button>
      </nav>
      <span class="hud-save" role="status">{{ saved }}</span>
    </template>
  </div>
  <div v-if="receipt && receiptExpanded" class="feedback-layer">
    <ActionFeedback
      :key="receiptSerial"
      :receipt="receipt"
      expanded
      @equip="closeReceipt().then(() => openPanel('skills'))"
      @close="closeReceipt"
    />
  </div>
  <SceneArrival
    v-else-if="
      receipt?.scene &&
      receipt.scene.from !== receipt.scene.to &&
      !modal &&
      !arrivalFinished
    "
    :key="receiptSerial"
    :from="receipt.scene.from"
    :to="receipt.scene.to"
    @finish="arrivalFinished = true"
  />
  <div v-else-if="receipt && !receipt.scene && !modal" class="receipt-dock">
    <ActionFeedback
      :key="receiptSerial"
      :receipt="receipt"
      @close="closeReceipt"
      @inspect="inspectReceipt"
    />
  </div>
  <div
    v-if="modal && !receiptExpanded"
    class="overlay"
    :data-mood="heart ? eventMood : 'day'"
  >
    <section
      :key="game ? activeEventId(game) || game.status : 'loading'"
      class="modal"
      :data-panel="dialog"
      :class="{
        'story-dialog':
          !!event ||
          dialog === 'break' ||
          (game && ['complete', 'dead'].includes(game.status)),
      }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <template
        v-if="
          dialog &&
          (titleScreen ||
            systemOverlay ||
            (!event && game?.status === 'alive') ||
            !game) &&
          panelTitles[dialog]
        "
      >
        <div class="panel-heading">
          <h2 id="modal-title" tabindex="-1">{{ panelTitles[dialog] }}</h2>
          <button aria-label="关闭面板" @click="dialog = ''">✕</button>
        </div>
        <template v-if="dialog === 'character' && game">
          <div class="character-sheet">
            <div class="life-label">
              第 {{ game.life }} 世 · 修行第 {{ game.month }} 月
            </div>
            <div class="portrait">
              <span>{{ game.name.slice(0, 1) }}</span
              ><i>道</i>
            </div>
            <h1>{{ game.name }}</h1>
            <p class="realm-label">
              {{ game.realm ? "筑基" : "炼气" }}
              <span>{{ paths[game.path].name }}</span>
            </p>
            <div class="character-line"></div>
            <div class="stat">
              <span>年岁 / 寿元</span
              ><strong
                >{{ Math.floor(game.age / 12) }} 岁 {{ game.age % 12 }} 月 /
                {{ Math.floor(game.limit / 12) }} 载</strong
              >
            </div>
            <div
              v-for="(value, label) in {
                灵石: game.stones,
                灵草: game.herbs,
                筑基丹: game.pills,
                根基: game.foundation,
                剑意: game.mastery,
                伤势: game.injury,
              }"
              :key="label"
              class="stat"
            >
              <span>{{ label }}</span
              ><strong>{{ value }}</strong>
            </div>
            <div class="character-line"></div>
            <span class="eyebrow"
              >资质 · {{ aptitudes[game.aptitude].name }}</span
            >
            <div class="aptitude-stats">
              <div>
                <strong>{{ game.root }}</strong
                ><span>根骨</span
                ><small>吐纳 +{{ cultivationGain(game) }} / 月</small>
              </div>
              <div>
                <strong>{{ game.wisdom }}</strong
                ><span>悟性</span
                ><small>研读 +{{ game.wisdom >= 8 ? 2 : 1 }} 心得</small>
              </div>
              <div>
                <strong>{{ game.sense }}</strong
                ><span>神识</span><small>可修炼至 12</small>
              </div>
            </div>
            <p class="fineprint">
              研读心得 {{ game.study }} / 4 · 根基是后天积累，不是根骨。{{
                game.ward
                  ? "护脉丹纹：可抵消一次失败的减寿，保留九成修为。"
                  : ""
              }}
            </p>
            <span class="eyebrow">今世传承</span>
            <h3>{{ inheritances[game.inherited].name }}</h3>
            <p class="muted">{{ inheritances[game.inherited].description }}</p>
            <p class="save-status">{{ saved }}</p>
            <button
              v-if="game.archive"
              class="quiet"
              @click="download(game.archive, '-旧版原档')"
            >
              导出旧版原档
            </button>
          </div>
          <button @click="dialog = 'inventory'">查看储物袋与装备</button
          ><button @click="dialog = 'skills'">查看功法</button></template
        >
        <InventoryPanel
          v-else-if="dialog === 'inventory' && game"
          :receipt="receipt"
          :game="game"
          :busy="ui.busy"
          @act="worldAct"
          @forge="dialog = 'gear'"
          @breakthrough="dialog = 'break'"
        />
        <WorldPanel
          v-else-if="worldTab && game"
          :key="worldTab"
          :initial-tab="worldTab"
          v-model:atlas-mode="atlasMode"
          v-model:selected-place="selectedPlace"
          embedded
          :game="game"
          :receipt="receipt"
          :busy="ui.busy"
          :running="ui.running"
          @act="worldAct"
          @run-queue="runQueue"
          @travel="travelFromMap"
          @resume-story="resumeStory"
        />
        <template v-else-if="dialog === 'journal' && game"
          ><h3>当前目标</h3>
          <p>{{ currentGoal }}</p>
          <h3>我的成长</h3>
          <ul>
            <li v-for="goal in growthGoals(game)" :key="goal">{{ goal }}</li>
          </ul>
          <button @click="dialog = 'skills'">功法研修</button
          ><button @click="dialog = 'inventory'">装备与丹药</button>
          <h3>尚待核实的线索</h3>
          <ul>
            <li
              v-if="
                game.expedition.cleared === 3 && !game.adventure.mist.station
              "
            >
              郁青姐姐：雾海废驿交接簿尚未核对。
            </li>
            <li v-if="game.adventure.mist.station">
              郁青姐姐：已证实随队救治，平安与归期仍未确认。
            </li>
            <li v-if="game.journey.maps.sea < 3">
              <ItemArt id="letter" :size="48" />
              陆迟家书：可在地图的「道友寻亲」继续；这不是突破的必选条件。
            </li>
            <li v-else>陆迟家书已送达；父亲仍在守引航阵，尚未团聚。</li>
          </ul>
          <h3>与陆迟的约定</h3>
          <p>
            {{
              game.story.stage === "resolved"
                ? "这场三年之约已有结局。"
                : "第三十六个月，回渡口见陆迟。"
            }}
          </p>
          <button @click="dialog = 'npc'">查看陆迟往事</button>
          <h3>行路记录</h3>
          <article
            v-for="(entry, i) in game.log"
            :key="i"
            class="journal-entry"
          >
            <small>第 {{ entry.month }} 月</small>
            <p>{{ entry.text }}</p>
          </article></template
        >
        <SavePanel
          v-else-if="dialog === 'saves'"
          :game="game"
          :busy="ui.busy"
          @restore="restoreGame"
        />
        <template v-else-if="dialog === 'new'"
          ><p>
            当前旅程将先保存为独立备份，可从“读取进度”找回。新旅程从新角色开始。
          </p>
          <button :disabled="ui.busy" @click="beginNew">
            保留旧旅程，创建角色</button
          ><button @click="dialog = ''">取消</button></template
        >
        <template v-else-if="dialog === 'backup'"
          ><p>用于迁移设备或保留额外备份。日常进度由游戏自动保存。</p>
          <button :disabled="!game" @click="game && download(game)">
            导出备份</button
          ><button @click="fileInput?.click()">导入备份</button></template
        >
        <template v-else-if="dialog === 'settings'"
          ><p>阅读字号</p>
          <button @click="setTextSize(false)">标准</button
          ><button @click="setTextSize(true)">大字</button>
          <p>演出可按 Esc 跳过；尊重系统的减少动态效果设置。</p>
          <h3>山间声音</h3>
          <template v-if="localMusicEnabled">
            <p>场景配乐 · {{ musicTitle }}</p>
            <p role="status">
              {{
                musicPlaying
                  ? "正在播放 · " + musicPlaying
                  : "音乐尚未播放，开启声音后随场景进入"
              }}
            </p>
            <label class="sound-volume"
              >剧情配乐 {{ Math.round(musicVolume * 100) }}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                v-model.number="musicVolume"
                @input="storeSound"
              />
            </label>
            <p>仅供本地试玩；对话时自动压低，离开对话后恢复。</p>
            <p v-if="musicNotice" role="status">{{ musicNotice }}</p>
          </template>
          <button :aria-pressed="soundPrefs.enabled" @click="toggleSound">
            {{ soundPrefs.enabled ? "静音" : "开启声音" }}
          </button>
          <label class="sound-volume"
            >环境声 {{ Math.round(soundPrefs.ambience * 100) }}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              v-model.number="soundPrefs.ambience"
              @input="storeSound"
            />
          </label>
          <label class="sound-volume"
            >行动音效 {{ Math.round(soundPrefs.effects * 100) }}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              v-model.number="soundPrefs.effects"
              @input="storeSound"
            />
          </label>
          <p>
            声音默认关闭，开启后记住偏好。切到后台时暂停；所有线索都有文字提示。
          </p>
          <p v-if="soundNotice" role="status">{{ soundNotice }}</p></template
        >
        <div v-else class="system-options">
          <button v-if="game" @click="dialog = 'saves'">
            保存游戏 / 读取进度</button
          ><button v-else @click="dialog = 'saves'">读取进度</button
          ><button v-if="desktopRuntime" :disabled="ui.busy" @click="quitGame">
            退出游戏</button
          ><button @click="dialog = 'settings'">显示与声音</button
          ><button @click="dialog = 'help'">玩法说明</button
          ><button @click="dialog = 'backup'">备份与迁移</button
          ><button
            v-if="!titleScreen"
            @click="
              ui.running = false;
              titleScreen = true;
              creating = false;
              dialog = '';
            "
          >
            返回标题</button
          ><button
            @click="
              dialog = '';
              game && resumeGame();
            "
          >
            返回游戏
          </button>
        </div>
      </template>
      <template v-else-if="event && game && !titleScreen">
        <SceneBackdrop
          :image="eventScene || '/scenes/mist-path.jpg'"
          :title="event.title"
          eyebrow="前缘 · 时光暂驻"
          :body="event.body"
          :portrait="heart?.portrait ?? npc?.portrait"
          :speaker="heart?.name ?? '陆迟'"
          :quote="heart?.title ?? npc?.quote.replace(/[“”]/g, '')"
          heading-id="modal-title"
          compact
        />
        <section class="scene-controls" aria-label="剧情选择操作区">
          <h3 class="controls-heading">此刻，如何回应</h3>
          <button
            v-for="o in event.options"
            :key="o.id"
            class="choice"
            :disabled="ui.busy || !!o.disabled"
            @click="
              act({
                type: 'choose',
                instanceId: activeEventId(game),
                option: o.id,
              })
            "
          >
            <span
              >{{ o.label }}<small>{{ o.disabled || o.hint }}</small></span
            ><b>→</b>
          </button>
        </section></template
      >
      <template v-else-if="game?.status === 'legacy'"
        ><h2 id="modal-title" tabindex="-1">旧卷珍藏，新篇启程</h2>
        <p class="event-body">{{ game.result }}</p>
        <p>
          旧档：{{ game.archive?.name }} · 第 {{ game.archive?.life }} 世 ·
          原境界序号 {{ game.archive?.realm }}
        </p>
        <button
          class="secondary full"
          @click="download(game.archive, '-旧版原档')"
        >
          导出完整旧版原档</button
        ><label class="field-label"
          >新篇路线<select v-model="path">
            <option v-for="(p, id) in paths" :key="id" :value="id">
              {{ p.name }}
            </option>
          </select></label
        ><button
          class="primary full"
          :disabled="ui.busy"
          @click="act({ type: 'beginChapter', path, aptitude })"
        >
          保留旧档，以十六岁重新开篇（明心善悟）
        </button></template
      >
      <template v-else-if="game && ['complete', 'dead'].includes(game.status)">
        <SceneBackdrop
          :image="
            game.status === 'complete'
              ? '/scenes/cloud-frontier.jpg'
              : '/scenes/moon-terrace.png'
          "
          :title="game.status === 'complete' ? '筑基篇完成' : '灯尽，前缘未尽'"
          :eyebrow="'第 ' + game.life + ' 世 · 此篇落笔'"
          :body="game.result"
          heading-id="modal-title"
          compact
        />
        <section class="scene-controls" aria-label="传承与轮回操作区">
          <h3 class="controls-heading">留下此世，选择来路</h3>
          <LifeReview :game="game" />
          <p class="muted">
            {{
              game.status === "complete"
                ? "此篇已记入传承。可以继续此世探索山外，也可以选择另一种人生。"
                : "寿元耗尽，已获得的传承仍可带走。"
            }}
          </p>
          <button
            v-if="game.status === 'complete' && game.age < game.limit"
            class="primary full"
            :disabled="ui.busy"
            @click="act({ type: 'continue' })"
          >
            继续此世 · 追寻山外故事
          </button>
          <p>
            本篇所得 {{ game.earned }} · 累计阅历
            {{ game.legacy }}（纪念分，不消耗）
          </p>
          <details class="life-review">
            <summary>回看此世卷宗</summary>
            <p v-for="(entry, i) in game.log" :key="i">
              第 {{ entry.month }} 月 · {{ entry.text }}
            </p>
          </details>
          <label class="field-label"
            >下一世路线<select v-model="path">
              <option v-for="(p, id) in paths" :key="id" :value="id">
                {{ p.name }}
              </option>
            </select></label
          >
          <label class="field-label"
            >下一世资质<select v-model="aptitude">
              <option v-for="(a, id) in aptitudes" :key="id" :value="id">
                {{ a.name }} · 根骨 {{ a.root }} / 悟性 {{ a.wisdom }} / 神识
                {{ a.sense }}
              </option>
            </select></label
          >
          <section class="next-life">
            <h3>下一世，你可以试试</h3>
            <p v-for="hint in replayHints(game)" :key="hint">{{ hint }}</p>
          </section>
          <div class="inheritance-list">
            <button
              v-for="(item, id) in inheritances"
              :key="id"
              :class="{ selected: inheritance === id }"
              :disabled="id !== 'none' && !game.unlocked.includes(id)"
              @click="inheritance = id"
            >
              <strong>{{ item.name }}</strong
              ><small>{{ item.description }}</small>
            </button>
          </div>
          <button class="primary full" :disabled="ui.busy" @click="nextLife">
            携一份传承，再入轮回 →</button
          ><button class="quiet full" @click="download(game)">
            导出本世存档
          </button>
        </section></template
      >
      <template v-else-if="dialog === 'break' && game">
        <SceneBackdrop
          image="/scenes/moon-terrace.png"
          title="炼气 → 筑基"
          eyebrow="屏息 · 叩问天关"
          body="风声仿佛停在洞府之外。你将一路积累的灵气收束于丹田，这一步可以现在迈出，也可以再等准备周全。"
          heading-id="modal-title"
          compact
        />
        <section class="scene-controls" aria-label="突破操作区">
          <h3 class="controls-heading">确认丹药与突破风险</h3>
          <p v-if="game.expedition.accepted && game.expedition.cleared === 2">
            {{ expeditionGoal(game) }}
          </p>
          <p v-else class="muted">
            筑基后开放功法通达与灵器精炼，可继续已有的行路与探索。
          </p>
          <div class="probability">{{ details?.chance }}<small>%</small></div>
          <p class="muted">本次成功率 · 下限 10%，上限 95%</p>
          <div class="break-details">
            <span v-for="p in details?.parts" :key="p.label"
              >{{ p.label }} {{ p.value > 0 ? "+" : "" }}{{ p.value }}%　</span
            >
          </div>
          <label class="pill-option"
            ><input
              v-model="pill"
              type="checkbox"
              :disabled="game.pills < 1"
            />使用筑基丹（持有 {{ game.pills }} 枚）</label
          >
          <PreparationValues :game="game" :pill="pill" />
          <p class="warning-text">
            成功延寿十八年。{{
              game.ward
                ? "护脉丹纹生效：首次失败保留九成修为、不减寿，随后消耗；伤势仍 +2。"
                : "失败保留七成修为、伤势 +2、寿元上限 −1 年。"
            }}可养伤、炼丹、固本后再试。
          </p>
          <button class="primary full" :disabled="ui.busy" @click="commitBreak">
            凝神，突破</button
          ><button class="quiet full" :disabled="ui.busy" @click="dialog = ''">
            尚需准备
          </button>
        </section></template
      >
      <template v-else-if="dialog === 'retreat'"
        ><h2 id="modal-title" tabindex="-1">这次闭关将错过约期</h2>
        <p class="event-body">
          闭关六个月无法中途出关。陆迟会独行，本世遗府、孤丹和护法机会将关闭。确定仍要闭关吗？
        </p>
        <p class="event-body">
          若想守约，先取消闭关，再用劳作或凝神推进到第三十六个月；普通行动遇到赴约剧情会自动暂停。
        </p>
        <button
          class="primary full"
          :disabled="ui.busy"
          @click="
            async () => {
              if (await act({ type: 'prepare', kind: 'retreat' })) dialog = '';
            }
          "
        >
          仍然闭关，接受失约</button
        ><button class="quiet full" @click="dialog = ''">
          暂不闭关 · 保留约定
        </button></template
      >
      <template v-else-if="dialog === 'npc' && game && npc">
        <h2 id="modal-title" tabindex="-1">陆迟 · 人物档案</h2>
        <img class="dossier-art" :src="npc.portrait" alt="陆迟人物立绘" />
        <p class="npc-quote">{{ npc.quote }}</p>
        <p class="eyebrow">{{ npc.whereabouts }}</p>
        <p class="event-body">{{ npc.known }}</p>
        <h3>与你的往事</h3>
        <p>
          {{
            game.story.stage === "unmet"
              ? "你们尚未相识。"
              : "你们在渡口相识，定下第三十六个月之约。"
          }}
        </p>
        <p v-if="game.memories.confided">
          你听他说起家人与那盏灯。他终于把心事告诉了你。
        </p>
        <p v-if="game.memories.support !== 'none'">
          风雪回访：{{
            {
              herbs: "他为你带来炼丹的灵草。",
              heal: "他为你温养经脉，稳固根基。",
              lesson: "你们共读残诀，彼此印证。",
            }[game.memories.support as "herbs" | "heal" | "lesson"]
          }}
        </p>
        <p v-if="game.memories.crossing !== 'none'">
          青石遗府，你们曾共同穿过石阵。
        </p>
        <button class="primary full" @click="dialog = ''">合上档案</button>
      </template>
      <template v-else
        ><h2 id="modal-title" tabindex="-1">如何写下这一世</h2>
        <p class="event-body">
          根骨提高吐纳速度，悟性影响研读和替代丹方，神识通过凝神成长并影响识阵与控火。三项资质不是简单的突破率加点。医道采药炼丹，剑道历练争先。伤势可通过养伤消除；闭关固本提高突破把握，却可能错过第三十六个月的约定。陆迟事件链只在关键节点暂停，不会反复打断行动。
        </p>
        <p class="event-body">
          修为达到 360
          后主动突破。完成陆迟故事并筑基会记入传承，仍可继续山外寻人，或主动封存再轮回。宗门与散修都可获得功法；遇妖修或邪修挑战，可准备灵器、提升实力或请人护持。正常刷新会保留存档，清理浏览器数据、换设备或地址则可能丢失或不可见。每次行动先保存再显示；后台暂停，无离线收益。请定期导出备份，只使用一个标签页。
        </p>
        <button class="primary full" @click="dialog = ''">
          我已知晓
        </button></template
      >
    </section>
  </div>
</template>
