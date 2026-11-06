<script setup lang="ts">
import {useActorPlayback} from "./presentation/actor-action/use-actor-playback";
import { monthlyWorkIncome, monthlyGatherIncome } from "./preparation-rates";
import {cultivationQuote} from "./qi-cultivation/rules";
import CultivationScene from "./qi-cultivation/CultivationScene.vue";
import CultivationPanel from "./qi-cultivation/CultivationPanel.vue";
import { hasCultivationKit } from "./initiation/rules";
import SpiritSummary from "./spirit/SpiritSummary.vue";
import AscensionPanel from "./ascension/AscensionPanel.vue";
import { senseLimit, controlCapacity } from "./spirit";
import { combatOwner } from "./scene-activity";
import type { PreparationSelection } from "./workshop/preparation";
import { rejectedActionReason } from "./action-diagnostics";
import StoryTravelMap from "./wayfaring/StoryTravelMap.vue";
import { useStoryTravel } from "./wayfaring/useStoryTravel";
import { additionalStoryRoute } from "./wayfaring/additional-story";
import StoryScenes from "./scene2d/StoryScenes.vue";
import { advanceStoryPreference } from './scene2d/story-preference';
import EventScene from "./scene2d/EventScene.vue";
import {goldenCap} from "./conclave/state";
import { goldenGoal } from "./golden-core/rules";
import LearningChoices from "./LearningChoices.vue";
import FirstPractice from "./scene2d/FirstPractice.vue";
import { techniques } from "./core";
import GrowthPreview from "./GrowthPreview.vue";
import InjuryImpact from "./InjuryImpact.vue";
import { incidentalQiGain } from "./progression";
import {
  ref,
  toRef,
  defineAsyncComponent,
  shallowRef,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
const preparationSelection = ref<PreparationSelection | null>(null);
const playtestEnabled = ref(
  new URLSearchParams(window.location.search).get("playtest") === "1",
);
import FeedbackPanel from "./feedback/FeedbackPanel.vue";
import GameHelp from "./feedback/GameHelp.vue";
import { build, playableScope } from "./feedback/build";
const PlaytestRecorder = defineAsyncComponent(
  () => import("./playtest/PlaytestRecorder.vue"),
);
import { defineStore } from "pinia";
import { presences } from "./landmarks";
import { actionSound, breakthroughMusic } from "./action-sound";
import { gameAudioScene } from "./audio-scene";
import { createMusicPlayer, musicNames } from "./local-music";
import FoundationJourney from "./FoundationJourney.vue";
import { breakthroughError } from "./foundation";
import PreparationValues from "./PreparationValues.vue";
import LifeReview from "./LifeReview.vue";
import DeathScene from "./mortality/DeathScene.vue";
import { automaticPause, type PauseReason } from "./cultivation-feedback";
import { journeyHorizon } from "./world-ambition";
import { sisterNote } from "./foundation-journey/narrative";
import { openingGuide } from "./opening-guide";
import { expeditionGoal } from "./expedition/progression";
import { createSoundscape, soundSettings, type SoundMood } from "./audio";
// Audio is presentation only; successful persisted outcomes trigger effects.
const localMusicEnabled = true;
let music:
  ReturnType<typeof import("./local-music").createMusicPlayer> | undefined;
const musicVolume = ref(0.45);
const musicNotice = ref("");
const musicTitle = ref("");
const musicPlaying = ref("");
const breakthroughScore = ref<ReturnType<typeof breakthroughMusic>>(null);
let breakthroughTimer: ReturnType<typeof setTimeout> | undefined;
function stopBreakthroughScore() {
  clearTimeout(breakthroughTimer);
  breakthroughScore.value = null;
}
import { createFileEffects } from "./file-effects";
const sound = createSoundscape(undefined, createFileEffects());
const soundPrefs = ref(soundSettings(null));
const soundNotice = ref("");
function blurSound() {
  stopBreakthroughScore();
  sound.hidden(true);
  music?.hidden(true);
}
function syncSoundPreference(event: StorageEvent) {
  if (event.key !== "xxrs-sound-v1") return;
  soundPrefs.value = soundSettings(event.newValue);
  if (!soundPrefs.value.enabled) stopBreakthroughScore();
  sound.settings(soundPrefs.value);
  music?.settings(soundPrefs.value.enabled, musicVolume.value);
}
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    stopBreakthroughScore();
    music?.dispose();
    sound.dispose();
  });
function storeSound() {
  if (!soundPrefs.value.enabled) stopBreakthroughScore();
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
  refineCost,
  growthGoals,
  type Aptitude,
  createGame,
  dispatch,
  eventView,
  breakthroughDetails,
  nextGoal,
  actionError,
  preparationError,
  migrateSave,
  MAX_QI,
  type State,
  type Activity,
  type Intent,
} from "./core";
import { luchiView } from "./characters";
import WorldPanel from "./WorldPanel.vue";
import CorrespondencePanel from "./correspondence/CorrespondencePanel.vue";
const unreadLetters = computed(() => game.value?.correspondence.letters.filter(l => !l.read).length ?? 0);
import SavePanel from "./SavePanel.vue";
import InventoryPanel from "./InventoryPanel.vue";
import { writeSlot } from "./save-slots";
import { adventureScenes, adventureGoal } from "./adventure";
import { roadScenes, roadGoal } from "./road";
import { mistScenes, mistGoal } from "./mist";
import SceneBackdrop from "./SceneBackdrop.vue";
import ItemArt from "./presentation/ItemArt.vue";
import PracticeStage from "./PracticeStage.vue";
import CultivationOutlook from "./CultivationOutlook.vue";
import { retreatPlan } from "./retreat";
import CultivationStatus from "./CultivationStatus.vue";
import {
  realmStageLabel,
  remainingLifeMonths,
  formatLifeMonths,
  cultivationMonthlyGain,
} from "./progression";
import ActionFeedback from "./ActionFeedback.vue";
import CombatFeedbackView from "./foundation-journey/CombatFeedback.vue";
import {
  combatFeedback as projectCombatFeedback,
  type CombatFeedback,
} from "./foundation-journey/feedback";
const combatFeedback = shallowRef<CombatFeedback | null>(null);
import SceneArrival from "./SceneArrival.vue";
import { actionReceipt, type ActionReceipt } from "./action-feedback";
const receipt = shallowRef<ActionReceipt | null>(null);
const receiptExpanded = ref(false);
const receiptSerial = ref(0);
const arrivalFinished = ref(false);
const practicePlayback=useActorPlayback<Activity>();
const practice=practicePlayback.frame;
const practiceSerial = ref(0);
let receiptTimer: ReturnType<typeof setTimeout> | undefined;
let actionOrigin: HTMLElement | null = null;
async function closeReceipt() {
  combatFeedback.value = null;
  const returnPanel = receipt.value?.returnTo;
  const returnToPerson = !!returnPanel || receipt.value?.ritual === "duel";
  receiptExpanded.value = false;
  receipt.value = null;
  clearTimeout(receiptTimer);
  if (
    returnPanel &&
    !(returnPanel === "world" && view.value === "story") &&
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
const cultivationPane = ref<"" | "practice" | "chores" | "prepare" | "notes">("");
const storyEntry = ref("");
const audioChapter = ref<import("./scene2d/story-routing").StoryChapter>();
watch(view, (next) => { cultivationPane.value = ""; if (next === "cultivation") storyEntry.value = ""; });
function leaveCultivation() {
  if (!game.value || ui.busy || receiptExpanded.value) return;
  ui.running = false;
  ui.history = false;
  storyEntry.value = game.value.realm === 0 ? "qi" : game.value.realm === 1 ? "foundation" : "sea";
  view.value = "story";
}
let cultivationReturnFocus: HTMLElement | null = null;
function closeCultivationPane() {
  cultivationPane.value = "";
  nextTick(() => { if (cultivationReturnFocus?.isConnected) cultivationReturnFocus.focus(); });
}
function openCultivationPane(pane: "practice" | "chores" | "prepare" | "notes") {
  if (pane === "practice" && (ui.running || ui.busy)) return;
  cultivationReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (cultivationPane.value === pane) { closeCultivationPane(); return; }
  cultivationPane.value = pane;
  if (pane === "practice") activity.value = "cultivate";
}
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
  sect: "师门与委托",
  arena: "听松擂台",
  gear: "丹药与法器准备",
  queue: "修行安排",
  journal: "任务与见闻",
  correspondence: "传讯与旧信",
  system: "系统菜单",
  feedback: "版本与反馈",
  help: "玩法说明",
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
const atContest = computed(() => !!game.value && ["entered", "finished"].includes(game.value.sectContest.stage) && game.value.foundationJourney.location === "home");
const currentScene = computed(() => {
  const g = game.value;
  if (!g || titleScreen.value || (view.value === "cultivation" && g.outerSea.location === "home"))
    return { image: "/scenes/moon-terrace.png", name: "听松山居" };
  if(g.lizhao.location!=="away") return {image:"/art/world-story/lizhao/chamber.webp",name:g.lizhao.location==="bay"?"伏潮湾":"离照洞天"};
  if(g.realm===3) return {image:"/art/outer-sea/ferry.webp",name:"外海古渡 · 元婴初成"};
  if(g.realm===2 && g.conclave.location!=="away") return {image:g.conclave.location==="vault"?"/art/conclave/vault.webp":"/art/conclave/court.webp",name:g.conclave.location==="vault"?"归潮秘境":"诸宗会谷"};
  if(g.realm===2 && g.outerSea.location==="guild")return {image:"/art/auction/golden-hall.webp",name:"沧澜会馆"};
  if(g.realm===2 && g.outerSea.location!=="home") return {image:g.outerSea.location==="ruins" ? (g.outerSea.cleared?"/art/outer-sea/inner.webp":"/art/outer-sea/ruins.webp"):"/art/outer-sea/ferry.webp",name:g.outerSea.location==="ruins"?"退潮遗迹":"外海古渡"};
  if(g.realm===2) return {image:"/scenes/moon-terrace.png",name:g.outerSea.met?"听松行前居":"云外石台"};
  if (atContest.value) return { image: "/art/sect-contest/tingsong.webp", name: "听松山 · 松间石台" };
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
  if(g.realm>=2) return nextGoal(g);
  if(g.realm === 2 || g.goldenCore.expedition !== "idle") return goldenGoal(g);
  if (atContest.value && view.value === "story") return g.sectContest.stage === "finished" ? "内比已毕，领取新成绩奖励后与同门道别。" : "按来招斗法，场间可整备，也可交还赛签。";
  if (view.value === "cultivation") return nextGoal(g);
  if (!showRoad.value && g.adventure.mist.stage !== "dormant")
    return mistGoal(g);
  if (g.adventure.step === "done") return roadGoal(g);
  return adventureGoal(g.adventure);
});
const horizon = computed(() =>
  game.value ? journeyHorizon(game.value) : null,
);
const opening = computed(() => (game.value ? openingGuide(game.value) : null));
async function followOpening() {
  if (!opening.value || ui.busy || receiptExpanded.value) return;
  ui.running = false;
  switch (opening.value.action) {
    case "road":
      storyEntry.value = "road";
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
    case "gear":
      openPanel("gear");
      break;
    case "initiation":
      storyEntry.value = "admission";
      view.value = "story";
      break;
    case "break":
      openPanel("break");
      break;
  }
}
function openPanel(id: string) {
  if (id === "sect" && game.value?.journey.branch === "none") return;
  if(game.value && !hasCultivationKit(game.value) && ['inventory','skills','gear','queue','arena','break'].includes(id))return;
  if (ui.busy || receiptExpanded.value) return;
  if (
    game.value && combatOwner(game.value) &&
    !["system", "saves", "settings", "backup", "feedback", "help"].includes(id)
  )
    return;
  ui.running = false;
  dialog.value = id;
}
function resetJourneyView() {
  stopBreakthroughScore();
  preparationSelection.value = null;
  clearTimeout(receiptTimer);
  practicePlayback.stop();
  titleScreen.value = false;
  creating.value = false;
  ui.running = false;
  ui.history = false;
  queueMode.value = false;
  pauseReason.value = null;
  receipt.value = null;
  receiptExpanded.value = false;
  actionOrigin = null;
  arrivalFinished.value = false;
  dialog.value = "";
  showRoad.value = false;
  view.value = "story";
  activity.value = "cultivate";
  atlasMode.value = "story";
  selectedPlace.value = "valley";
  targetVisible.value = false;
}
async function restoreGame(state: State) {
  if (await persist(state)) resetJourneyView();
}
async function beginNew() {
  if (ui.busy) return;
  ui.busy = true;
  try {
    if (game.value)
      await writeSlot("archive-" + crypto.randomUUID(), game.value);
    stopBreakthroughScore();
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

import { useGameSession } from "./session/use-game-session";
import { startAutomaticClock } from "./session/automatic-clock";
const useSession = defineStore("session", {
  state: () => ({ running: false, busy: false, history: false }),
});
const ui = useSession();
const session = useGameSession(toRef(ui, 'busy'), () => {ui.running=false;}, () => {combatFeedback.value=null;});
const {game, ready, loadError, notice, saved, persist} = session;
const sceneCombat = computed(() => !!game.value && !titleScreen.value && !ui.history && view.value === "story" && !!combatOwner(game.value) && combatOwner(game.value) !== 'arena');
const name = ref("沈青禾"),
  aptitude = ref<Aptitude>("insightful"),
  activity = ref<Activity>("cultivate"),
  dialog = ref("");
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
const soloRelic = computed(
  () =>
    game.value?.story.luchi === "distant" &&
    ["crossing", "relic"].includes(game.value?.pending?.kind ?? ""),
);
const event = computed(() => (game.value ? eventView(game.value) : null));
const systemOverlay = computed(() =>
  ["system", "saves", "settings", "backup", "feedback", "help"].includes(
    dialog.value,
  ),
);
const desktopRuntime = window.location.protocol === "xxrs:";
function quitGame() {
  if (!ui.busy && desktopRuntime) window.close();
}
const globalTravel = useStoryTravel(()=>game.value,()=>ui.busy, intent=>{void executeAct(intent);}, true);
const {route:globalTravelRoute, arrived:globalTravelArrived}=globalTravel;
const activeAscension = computed(() => !titleScreen.value && !!game.value?.ascension && !game.value?.pending);
const modal = computed(() =>
  activeAscension.value ? "ascension" :
  globalTravelRoute.value ? "travel" :
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
  game.value ? breakthroughDetails(game.value, true) : null,
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
  { id: "work", name: "劳作", hint: "按境界承接帮工，报酬随本领提高" },
  { id: "rest", name: "养伤", hint: "每月伤势 −1" },
];
const regularRetreat = computed(() => game.value ? retreatPlan(game.value) : null);
async function act(intent: Intent) {
  if (!game.value || ui.busy || receiptExpanded.value) return false;
  if (game.value && additionalStoryRoute(game.value,intent)) {
    ui.running=false;
    globalTravel.act(intent);
    return false;
  }
  return executeAct(intent);
}
async function executeAct(intent: Intent) {
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
        `本次行动未执行：${rejectedActionReason(old, intent)}。没有新增消耗。`;
    return false;
  }
  const ok = await persist(n);
  if (ok) {
    advanceStoryPreference(old, n, localStorage);
    if(n.qiJourney.cultivation.work){ui.running=false;dialog.value="";view.value="story";}
    combatFeedback.value = projectCombatFeedback(old, n, intent);
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
      practicePlayback.stop();
      practiceSerial.value++;
      practicePlayback.play([{value:performed as Activity,durationMs:3600}]);
    }
    if (
      !automatic ||
      (old.status !== n.status && ["dead", "complete"].includes(n.status))
    )
      sound.cue(actionSound(old, n, intent));
    stopBreakthroughScore();
    breakthroughScore.value = soundPrefs.value.enabled && musicVolume.value > 0 ? breakthroughMusic(old, n) : null;
    if (breakthroughScore.value) breakthroughTimer = setTimeout(stopBreakthroughScore, 11000);
    clearTimeout(receiptTimer);
    receipt.value = actionReceipt(old, n, intent);
    arrivalFinished.value = false;
    receiptSerial.value++;
    receiptExpanded.value =
      (!!receipt.value?.ritual || !!receipt.value?.spotlight) && !automatic && intent.type !== "adventure";
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
          "wood",
          crypto.getRandomValues(new Uint32Array(1))[0],
          aptitude.value,
          "male",
        ),
      )
    ) {
      resetJourneyView();
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
function foundationCommand(intent: Intent) {
  return intent.type === "prepare" ? prepare(intent.kind) : act(intent);
}
async function commitBreak() {
  if (await act({ type: "ascension", action: "start" })) dialog.value = "";
}

function download(value: unknown, suffix = "") {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "长生未央" + suffix + ".json";
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
  if (activeAscension.value) return;
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
    if (e.key === "Escape" && view.value === "cultivation" && cultivationPane.value) {
      e.preventDefault();
      closeCultivationPane();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      openPanel("system");
    } else if (
      !titleScreen.value && !sceneCombat.value &&
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
  if (document.hidden) stopBreakthroughScore();
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
let stopAutomaticClock: (() => void) | undefined;
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
          score: !titleScreen.value && game.value?.status === "alive" ? breakthroughScore.value : null,
          scene: currentScene.value,
          audio: gameAudioScene(
            titleScreen.value ? null : game.value,
            dialog.value,
            currentScene.value.name,
            !ui.history && view.value === "story" ? audioChapter.value : undefined,
          ),
        }),
        ({ scene, audio, score }) => {
          const cue = score ?? audio.music;
          const mood =
            presences[scene.name]?.weather ??
            ("mood" in scene ? scene.mood : "moon");
          sound.scene(mood as SoundMood, audio.ambient);
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
  await session.restore();
  if (!unmounted) stopAutomaticClock = startAutomaticClock(
    () => ui.running && !ui.busy && !modal.value && !document.hidden,
    () => queueMode.value ? act({ type: "queueTick" }) : advance(1),
    error => {ui.running=false;notice.value=`自动行动已停止：${String(error)}`;},
  );
});
onUnmounted(() => {
  unmounted = true;
  stopBreakthroughScore();
  stopAudioWatches.forEach((stop) => stop());
  sound.dispose();
  music?.dispose();
  practicePlayback.stop();
  window.removeEventListener("storage", syncSoundPreference);
  window.removeEventListener("blur", blurSound);
  window.removeEventListener("focus", hidden);
  document.removeEventListener("pointerdown", unlockSound);
  document.removeEventListener("keydown", unlockSound);
  clearTimeout(receiptTimer);
  stopAutomaticClock?.();
  document.removeEventListener("visibilitychange", hidden);
  document.removeEventListener("keydown", keyboard);
});
</script>
<template>
  <AscensionPanel v-if="game && activeAscension" :game="game" :busy="ui.busy" :notice="notice" @act="act" />
  <div v-if="globalTravelRoute && game" class="overlay" role="dialog" aria-modal="true" aria-label="剧情旅行">
    <StoryTravelMap :game="game" :route="globalTravelRoute" :busy="ui.busy" :arrived="globalTravelArrived" @depart="globalTravel.depart" @close="globalTravel.close" @cancel="globalTravel.cancel" />
  </div>
  <PlaytestRecorder v-if="playtestEnabled" :game="game" />
  <div v-if="ui.busy" class="saving-pulse" role="status">正在保存……</div>
  <div v-if="notice" class="notice" role="alert">{{ notice }}</div>
  <div
    class="shell immersive-shell"
    :class="{ playing: game && !titleScreen, 'scene-combat': sceneCombat, 'cultivation-exploring': game && !titleScreen && !ui.history && view === 'cultivation', 'story-exploring': game && !titleScreen && !ui.history && view === 'story', 'scene-first': game && !titleScreen && game.realm < 2 && game.adventure.step !== 'done' && game.goldenCore.expedition === 'idle' && !atContest && !ui.history && view === 'story' && (showRoad || game.adventure.mist.stage === 'dormant') }"
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
            >{{ hasCultivationKit(game) ? realmStageLabel(game) : "药乡来客 · 初识灵气" }} · {{ game.journey.main ? techniques[game.journey.main].name : "尚未选定主修" }} · 伤势
            {{ game.injury }}</small
          ><CultivationStatus v-if="hasCultivationKit(game)" :game="game" /><small class="life-remaining"
            >余寿 {{ formatLifeMonths(remainingLifeMonths(game)) }}</small
          ></span
        >
      </button>
      <span v-else class="brand">长生未央</span>
      <button
        class="sound-toggle"
        :aria-pressed="soundPrefs.enabled"
        @click="toggleSound"
      >
        {{ soundPrefs.enabled ? "声音已开" : "开启声音" }}
      </button>
      <small v-if="game && !titleScreen" class="world-date" aria-label="当前修行年月">
        修行 {{ Math.floor(game.month / 12) }} 年 {{ game.month % 12 }} 月
      </small>
      <div class="location-entry" v-if="game && !titleScreen">
        <button @click="openPanel('world')">{{ currentScene.name }}</button>
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
      <p class="eyebrow">青玄界 · 听松山</p>
      <h1>长生未央</h1>
      <p>{{ playableScope }}</p>
      <small>版本 {{ build.version }} · {{ build.id }}</small>
      <p>
        听松问道，漫漫长生路。<br />
        仙途渺渺，或遇知己，结契同行。
      </p>
      <button v-if="game" class="primary" @click="resumeGame">
        继续游戏<small
          >{{ game.name }} · {{ realmStageLabel(game) }} · 第
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
        <img class="creation-landscape" src="/art/scene2d/ferry.png" alt="渡舟停在听松山下，灯火照亮入山石阶" />
        <img class="creation-traveler" src="/art/hero-male/qi-idle.webp" alt="即将启程的少年修士" />
        <div class="art-copy">
          <span class="eyebrow">炼气篇 / 初入仙途</span>
          <h1>初入听松山</h1>
          <p>
            你想学会真正的功法，走出眼前这片群山。<br />
            听松山下，一名药工迟迟未归。先备好行装，去试试自己能走多远。
          </p>
        </div>
      </div>
      <section class="creation-form">
        <button class="quiet" @click="creating = false">返回标题</button>
        <span class="eyebrow">十六岁 · 初入仙途</span>
        <h2>写下这段旅程的名字</h2>
        <label for="name">道号</label
        ><input id="name" v-model="name" maxlength="16" class="name-input" />
        <p class="creation-identity">男修 · 十六岁启程<small>女修创建暂未开放</small></p>
        <h3>选择先天资质</h3>
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
        <p>入山后可学习功法与技艺，练剑、采药、炼丹可以兼修。</p>
        <button
          class="primary start"
          :disabled="ui.busy || loadError"
          @click="start"
        >
          踏入仙途 →
        </button>
        <p class="fineprint">
          本地单机 · 自动存档 · 无离线收益<br />新角色独立开始，原旅程可在存档中读取。
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
        <aside v-if="game.treasures.auction?.entered && !game.treasures.auction.closed" class="opening-guide" aria-label="拍卖正在进行">
          <p>你还在拍卖会场。结束竞拍或离场后，再继续修行与行旅。</p>
          <button @click="view='story'; storyEntry=game.treasures.auction?.venue==='golden'?'sea':game.treasures.auction?.venue==='market'?'road':'foundation'; dialog=''">返回拍卖会 · 继续竞拍或离场</button>
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
        <nav v-if="!sceneCombat">
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
            v-if="hasCultivationKit(game)"
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
        <StoryScenes @scene="audioChapter = $event" :entry-chapter="storyEntry" v-if="!ui.history && view === 'story'" :game="game" :busy="ui.busy || ui.running" :show-road="showRoad" :receipt="receipt" :combat-feedback="combatFeedback"
          @act="worldAct" @cultivate="view = 'cultivation'" @map="openPanel('world')" @breakthrough="dialog = 'break'" @mist="openMist" @road="showRoad = true" @equipment="openPanel('gear')" @board="openPanel('arena')" @sect="openPanel('sect')" @inventory="openPanel('inventory')" />
        <template v-if="!ui.history && view === 'cultivation'"
          ><section
            class="cultivation-room desktop-scene"
            aria-label="洞府场景与修行"
          >
            <SceneBackdrop
              :image="currentScene.image"
              :title="currentScene.name"
              eyebrow="一念长生 · 一诺千金"
              :body="
                game.realm === 2 && game.outerSea.location !== 'home'
                  ? '暂歇此地，调匀丹元，整理下一程所需。'
                  : game.realm
                  ? '云路已经向你展开。今夜在洞府整理行装，明日带着更稳的气息，再赴山外。'
                  : '山风穿过石台，灯火照着未读完的丹经。你知道山外有人在等，也知道每一次凝神，都是为了走得更远。'
              "
              compact
            />
            <PracticeStage
              :key="practiceSerial"
              :gender="game.social.gender"
              :realm="game.realm"
              :location="currentScene.name"
              :activity="practice ?? activity"
              :playing="!!practice && !modal"
            />
            <aside v-show="!cultivationPane" class="cultivation-summary" aria-label="洞府当前目标">
              <h2>{{ currentScene.name }}</h2>
              <strong>{{ realmStageLabel(game) }} · {{ game.realm === 0 ? game.qi : game.realm === 1 ? game.foundationJourney.cultivation : game.outerSea.cultivation }} 修行</strong>
              <p>{{ nextGoal(game) }}</p>
              <button v-if="game.injury" @click="openCultivationPane('chores')">伤势 {{ game.injury }} · 查看调养</button>
            </aside>
            <nav class="cultivation-objects" aria-label="洞府现场入口">
              <button :disabled="ui.busy || ui.running" :aria-pressed="cultivationPane === 'practice'" @click="openCultivationPane('practice')">蒲团 · 打坐修行</button>
              <button :aria-pressed="cultivationPane === 'chores'" @click="openCultivationPane('chores')">案几 · 修行与杂务</button>
              <button :aria-pressed="cultivationPane === 'prepare'" @click="openCultivationPane('prepare')">丹炉 · 突破筹备</button>
              <button :aria-pressed="cultivationPane === 'notes'" @click="openCultivationPane('notes')">灯下 · 道途见闻</button>
              <button :disabled="ui.busy || receiptExpanded" @click="leaveCultivation">山门 · {{ game.realm === 0 ? '炼气历练' : game.realm === 1 ? '筑基行旅' : '外海行旅' }}</button>
            </nav>
            <button v-if="ui.running" class="cultivation-pause" @click="ui.running = false">暂停当前修行</button>
            <fieldset
              v-show="cultivationPane"
              class="cultivation-panel scene-controls"
              :disabled="
                !!game.social.arena.duel || !!game.foundationJourney.duel
              "
              aria-label="洞府修行"
            >
              <div class="cultivation-panel-heading"><h3>{{ {practice:'打坐修行',chores:'修行与杂务',prepare:'突破筹备',notes:'道途见闻'}[cultivationPane || 'practice'] }}</h3><button aria-label="收起洞府操作" @click="closeCultivationPane">收起 ×</button></div>
              <div v-show="cultivationPane === 'notes'" class="cultivation-notes">
        <LearningChoices  :game="game" :busy="ui.busy" @act="worldAct" />
        <FirstPractice  :game="game" :busy="ui.busy" />
        <details
          v-if="horizon && game.realm < 2 && !ui.history && game.adventure.step === 'done' && game.journey.learning.book"
          class="opening-guide"
          aria-label="行旅目标"
        >
          <summary>这一程 · {{ horizon.stage }}</summary>
          <p>青玄界 · 听松山行旅</p>
          <p><strong>本篇终点：</strong>{{ horizon.chapter }}</p>
          <button
            :disabled="ui.busy || receiptExpanded"
            @click="openPanel('arena')"
          >
            可选志向 · 听松试剑榜
          </button>
          <small>十八岁后可登台；行路、救人与修行都不要求上榜。</small>
        </details>
        <aside
          v-if="opening && !ui.history && game.journey.learning.book"
          class="opening-guide"
          aria-label="初入仙途指引"
        >
          <div>
            <strong>{{ opening.title }}</strong>
            <p>{{ opening.body }}</p>
            <button
              :disabled="ui.busy || receiptExpanded"
              @click="followOpening"
            >
              {{ opening.label }}
            </button>
          </div>
        </aside>

              </div>
              <div v-show="cultivationPane !== 'notes'">
              <div class="progress-label">
                <h2>
                  {{ game.realm >= 2 ? realmStageLabel(game) + " · 外海道途" : game.realm ? "筑基已成 · 构筑与历练" : "炼气 → 筑基" }}
                </h2>
                <strong v-if="game.realm === 0"
                  >{{ game.qi }} / {{ MAX_QI }}</strong
                >
                <strong v-else-if="game.realm === 1"
                  >筑基修行 {{ game.foundationJourney.cultivation }} /
                  600</strong
                >
                <strong v-else>金丹修行 {{ game.outerSea.cultivation }} / {{goldenCap(game)}}</strong>
              </div>
              <div v-if="game.realm === 0" class="qi-track">
                <i :style="{ width: (game.qi / MAX_QI) * 100 + '%' }"></i>
              </div>
              <div v-if="game.realm === 1" class="qi-track">
                <i
                  :style="{
                    width: game.foundationJourney.cultivation / 6 + '%',
                  }"
                ></i>
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
                须完成淬脉、凝元，备好筑基丹，固本至根基12并养好伤势；更深的根基与同道护法能提高把握。
              </p>
              <CultivationPanel :game="game" :busy="ui.busy" @act="act" />
                <CultivationOutlook @standing="openPanel('sect')"
                v-show="cultivationPane === 'practice'"
                v-if="activity === 'cultivate'"
                compact
                :game="game"
                :months="3"
                automatic
                :busy="ui.busy || ui.running"
                @act="act"
              />
              <InjuryImpact v-show="cultivationPane === 'chores'" :game="game" :busy="ui.busy || ui.running" @act="act" />
              <div v-show="cultivationPane === 'chores'" class="activity-grid">
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
                      ? `常规闭关 ${formatLifeMonths(regularRetreat?.batchMonths ?? 0)} · 修为 +${regularRetreat?.batchGain ?? 0}`
                      : a.id === "train"
                        ? `剑意 +1${game.realm ? "" : " · 修为 +" + incidentalQiGain(game, "train")}；${game.journey.support === "guard" ? "护身诀免历练伤势" : "每四重受伤"}`
                        : a.id === "work"
                          ? `每月灵石 +${monthlyWorkIncome(game)}${!game.realm && game.journey.main ? " · 修为 +" + incidentalQiGain(game, "work") : ""}`
                          : a.id === "gather"
                            ? `灵草 +${monthlyGatherIncome(game)} · 修为 +${incidentalQiGain(game, "gather")}`
                            : a.id === "meditate"
                              ? `神识 +1${game.realm ? "" : " · 修为 +" + incidentalQiGain(game, "meditate")}；神识 8 可识阵、省炼丹灵石`
                              : a.hint)
                  }}</small>
                </button>
              </div>
              <details v-show="cultivationPane === 'practice' || cultivationPane === 'chores'" :open="cultivationPane === 'chores'" class="monthly-practice">
                <summary>逐月行动与自动修行</summary>
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
                {{
                  game.realm === 1 && activity === "cultivate"
                    ? "筑基吐纳期间没有灵石收入。"
                    : "劳作或完成委托赚取灵石；修炼不产生灵石。"
                }}自动每 0.8 秒推进一月，遇关键剧情、修为满或切后台暂停。
              </p>
              </details>
              <section v-if="game.realm === 0" v-show="cultivationPane === 'prepare'" aria-label="突破与固本准备">
              <div class="preparations">
                <button
                  class="secondary"
                  :disabled="ui.busy || !!preparationError(game, 'refine')"
                  @click="prepare('refine')"
                >
                  炼筑基丹 · 六月温养后亲手掌火<small>{{
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
              <FoundationJourney
                :game="game"
                :busy="ui.busy || ui.running"
                @command="foundationCommand"
              />
              <button
                class="break-button full"
                :disabled="ui.busy || game.realm >= 1 || game.qi < MAX_QI"
                @click="dialog = 'break'"
              >
                叩问天关 · 尝试筑基 ↗
              </button>
              </section>
              <section v-if="game.realm > 0" v-show="cultivationPane === 'prepare'" aria-label="当前境界筹备">
                <button :disabled="ui.busy" @click="openPanel('gear')">准备丹药与灵器</button>
                <button :disabled="ui.busy" @click="openPanel('skills')">研修功法</button>
                <button :disabled="ui.busy" @click="leaveCultivation">前往{{ game.realm === 1 ? '筑基' : '外海' }}行旅</button>
              </section>
              <details v-if="game.result" class="last-result"><summary>最近修行经过</summary><p>{{ game.result }}</p></details>
              </div>
          <nav v-show="cultivationPane === 'chores'" class="facility-actions" aria-label="山居设施">
            <button v-if="game.journey.branch !== 'none'" @click="openPanel('sect')">师门与委托</button
            ><button @click="openPanel('gear')">丹药与法器准备</button
            ><button @click="openPanel('arena')">听松擂台</button
            ><button @click="openPanel('queue')">修行安排</button>
          </nav>
            </fieldset>
          </section>

        </template>
        <div
          v-if="ui.history"
          :class="{ 'desktop-scene history-room': ui.history }"
        >
          <SceneBackdrop
            v-if="ui.history"
            image="/scenes/moon-terrace.png"
            title="这段旅程的卷宗"
            eyebrow="灯下回望"
            body="摊开旧卷，走过的山路、赴过的约定与没说完的话，都还留在这里。"
            compact
          />
          <section class="timeline" :class="{ 'scene-controls': ui.history }">
            <div class="panel-heading">
              <h2>人生卷宗</h2>
              <span class="muted">{{
                ui.history ? "最近 180 条" : "近事三则"
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
      <nav v-if="!sceneCombat" class="quick-dock" aria-label="随身功能">
        <button v-if="hasCultivationKit(game)" @click="openPanel('inventory')">{{ game.itemGrowth.ring ? '储物戒' : '储物袋' }} <kbd>B</kbd></button
        ><button v-if="hasCultivationKit(game)" @click="openPanel('skills')">功法 <kbd>K</kbd></button
        ><button @click="openPanel('world')">地图 <kbd>M</kbd></button
        ><button @click="openPanel('journal')">见闻 <kbd>J</kbd></button
        ><button @click="openPanel('relationship')">人物关系</button>
        <button @click="openPanel('correspondence')">传讯{{ unreadLetters ? ` · ${unreadLetters}` : '' }}</button>
        <button v-if="game.journey.branch !== 'none'" @click="openPanel('sect')">师门与委托</button>
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
      ><template #combat
        ><CombatFeedbackView
          initial-playback
          v-if="game && combatFeedback"
          :game="game"
          :result="combatFeedback" /></template
    ></ActionFeedback>
  </div>
  <SceneArrival
    v-else-if="
      receipt?.scene &&
      receipt.scene.from !== receipt.scene.to &&
      !(receipt.scene.chapter === 'adventure' && game?.adventure.step === 'home') &&
      !modal &&
      !arrivalFinished
    "
    :key="receiptSerial"
    :from="receipt.scene.from"
    :to="receipt.scene.to"
    @finish="arrivalFinished = true"
  />
  <div v-else-if="receipt && !receipt.scene && !modal && sceneCombat" class="combat-receipt-entry">
    <button @click="inspectReceipt" aria-label="查看本合结果与消耗">本合结果 · 查看明细</button>
  </div>
  <div v-else-if="receipt && !receipt.scene && !modal" class="receipt-dock">
    <ActionFeedback
      :key="receiptSerial"
      :receipt="receipt"
      @close="closeReceipt"
      @inspect="inspectReceipt"
    />
  </div>
  <div
    v-if="modal && !activeAscension && !receiptExpanded && !globalTravelRoute"
    class="overlay"
    :data-mood="heart ? eventMood : 'day'"
  >
    <section
      :key="game ? activeEventId(game) || game.status : 'loading'"
      class="modal"
      :data-panel="dialog"
      :class="{
        'event-plane': !!event && !titleScreen && !dialog,
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
          <h2 id="modal-title" tabindex="-1">{{ dialog === 'inventory' && game?.itemGrowth.ring ? '储物戒' : panelTitles[dialog] }}</h2>
          <button aria-label="关闭面板" @click="dialog = ''">✕</button>
        </div>
        <template v-if="dialog === 'character' && game">
          <div class="character-sheet">
            <div class="life-label">
              修行 {{ Math.floor(game.month / 12) }} 年 {{ game.month % 12 }} 月
            </div>
            <div class="portrait">
              <span>{{ game.name.slice(0, 1) }}</span
              ><i>道</i>
            </div>
            <h1>{{ game.name }}</h1>
            <p class="realm-label">
              {{ realmStageLabel(game) }}
              <span>{{ game.journey.main ? techniques[game.journey.main].name : "尚未选定主修" }}</span>
            </p>
            <div class="character-line"></div>
            <div class="stat">
              <span>剩余寿元</span
              ><strong>{{
                formatLifeMonths(remainingLifeMonths(game))
              }}</strong>
            </div>
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
            <InjuryImpact :game="game" :busy="ui.busy || ui.running" @act="act" />
            <div class="character-line"></div>
            <span class="eyebrow"
              >资质 · {{ aptitudes[game.aptitude].name }}</span
            >
            <div class="aptitude-stats">
              <div>
                <strong>{{ game.root }}</strong
                ><span>根骨</span
                ><small>吐纳 +{{ cultivationMonthlyGain(game) }} / 月</small>
              </div>
              <div>
                <strong>{{ game.wisdom }}</strong
                ><span>悟性</span
                ><small>研读 +{{ game.wisdom >= 8 ? 2 : 1 }} 心得</small>
              </div>
              <div>
                <strong>{{ game.sense }}</strong
                ><span>神识</span><small>本境上限 {{ senseLimit(game.realm, game.spirit) }} · 御器容量 {{ controlCapacity(game.sense) }}</small>
              </div>
            </div>
            <p class="fineprint">
              研读心得 {{ game.study }} / 4 · 根基是后天积累，不是根骨。{{
                game.ward
                  ? "护脉丹纹：可抵消一次失败的减寿，保留九成修为。"
                  : ""
              }}
            </p>
            <SpiritSummary :game="game" :busy="ui.busy || ui.running" @act="act" />
            <p class="save-status">{{ saved }}</p>
            <button
              v-if="game.archive"
              class="quiet"
              @click="download(game.archive, '-旧版原档')"
            >
              导出旧版原档
            </button>
          </div>
          <button @click="dialog = 'inventory'">查看储物与装备</button
          ><button v-if="hasCultivationKit(game)" @click="openPanel('skills')">查看功法</button></template
        >
        <CorrespondencePanel
          v-else-if="dialog === 'correspondence' && game"
          :game="game" :busy="ui.busy || ui.running" @act="worldAct"
          @navigate="destination => { if (destination === 'story') resumeStory(); else openPanel(destination); }"
        />
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
          v-model:preparation-selection="preparationSelection"
          :combat-feedback="combatFeedback"
          @equipment="openPanel('skills')"
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
          <h3>人物消息与线索</h3>
          <ul>
            <li v-if="sisterNote(game)">{{ sisterNote(game) }}</li>
            <li v-if="game.journey.maps.sea < 3">
              <ItemArt id="letter" :size="48" />
              陆迟家书：可选寻亲，可在地图的「道友寻亲」继续。
            </li>
            <li v-else>陆迟家书已送达；父亲仍在守引航阵，尚未团聚。</li>
          </ul>
          <h3>与陆迟的约定</h3>
          <p>
            {{
              game.story.stage === "resolved"
                ? "这场青石之约已有结局。"
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
        <GameHelp v-else-if="dialog === 'help'" :game="game" />
        <FeedbackPanel
          v-else-if="dialog === 'feedback'"
          :game="game"
          @recording="
            playtestEnabled = true;
            dialog = '';
          "
        />
        <div v-else class="system-options">
          <p>{{ playableScope }}</p>
          <small>版本 {{ build.version }} · {{ build.id }}</small>
          <button v-if="game" @click="dialog = 'saves'">
            保存游戏 / 读取进度</button
          ><button v-else @click="dialog = 'saves'">读取进度</button
          ><button v-if="desktopRuntime" :disabled="ui.busy" @click="quitGame">
            退出游戏</button
          ><button @click="dialog = 'settings'">显示与声音</button
          ><button @click="dialog = 'feedback'">版本与反馈</button
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
        <template v-if="game.pending?.kind==='relic' && !game.qiJourney.cultivation.relic">
          <CultivationScene v-if="game.qiJourney.cultivation.work" :game="game" :busy="ui.busy" @act="act" />
          <section v-else class="relic-seal-entry"><h2 id="modal-title">青石遗府 · 封丹石台</h2><p>丹匣被六重封纹托在石台上。走到这里还不算取得丹药；须稳住阵压、剥离封纹，才能保住这枚孤丹。</p><p>{{game.qiJourney.cultivation.last}}</p><p>{{cultivationQuote(game,'cultivation:relic').error}}</p><button :disabled="ui.busy||!!cultivationQuote(game,'cultivation:relic').error" @click="act({type:'qiJourney',action:'cultivation:relic'})">屏息入阵 · 亲手解开封丹阵</button><button :disabled="ui.busy" @click="act({type:'qiJourney',action:'cultivation:withdraw'})">退出遗府 · 丹药未取，可独自再来</button></section>
        </template>
        <EventScene v-else
          :image="eventScene || '/scenes/mist-path.jpg'"
          :title="event.title"
          :body="event.body"
          :portrait="soloRelic ? null : (heart?.portrait ?? npc?.portrait)"
          :speaker="soloRelic ? undefined : (heart?.name ?? '陆迟')"
          :quote="
            soloRelic
              ? undefined
              : (heart?.title ?? npc?.quote.replace(/[“”]/g, ''))
          "
        >
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
        </EventScene></template
      >
      <template v-else-if="game?.status === 'legacy'"
        ><h2 id="modal-title" tabindex="-1">旧卷珍藏，新篇启程</h2>
        <p class="event-body">{{ game.result }}</p>
        <p>
          旧档：{{ game.archive?.name }} · 原境界序号 {{ game.archive?.realm }}
        </p>
        <button
          class="secondary full"
          @click="download(game.archive, '-旧版原档')"
        >
          导出完整旧版原档</button
        ><button
          class="primary full"
          :disabled="ui.busy"
          @click="act({ type: 'beginChapter', path: 'wood', aptitude })"
        >
          保留旧档，以十六岁重新开篇（明心善悟）
        </button></template
      >
      <template v-else-if="game && ['complete', 'dead'].includes(game.status)">
        <DeathScene v-if="game.status === 'dead'" :game="game" />
        <SceneBackdrop v-else
          :image="
            game.status === 'complete'
              ? '/scenes/cloud-frontier.jpg'
              : '/scenes/moon-terrace.png'
          "
          :title="game.status === 'complete' ? '筑基篇完成' : '灯尽，前缘未尽'"
          eyebrow="修行履历 · 此篇落笔"
          :body="game.result"
          heading-id="modal-title"
          compact
        />
        <section class="scene-controls" aria-label="修行履历与旅程操作区">
          <div class="ending-actions">
          <button class="primary full" :disabled="ui.busy" @click="beginNew">
            另启新程 · 新建角色
          </button>
          <button :disabled="ui.busy" @click="openPanel('saves')">
            读取存档
          </button>
          <button class="quiet full" @click="download(game)">
            导出旅程存档
          </button>
          </div>
          <div v-if="game.status === 'dead'" class="ending-sound">
            <button :aria-pressed="soundPrefs.enabled" @click="toggleSound">{{ soundPrefs.enabled ? '关闭终章声音' : '开启终章声音' }}</button>
            <small role="status">{{ musicPlaying ? '正在播放 · ' + musicPlaying : soundPrefs.enabled ? '配乐待播放' : '终章声音已关闭' }}</small>
            <small v-if="musicNotice || soundNotice" role="status">{{ musicNotice || soundNotice }}</small>
          </div>
          <LifeReview :game="game" />
          <p class="muted">
            {{
              game.status === "complete"
                ? "本卷告一段落。你的修为、关系和行旅记录都在，可以继续探索。"
                : "这段人生已经结束。可以读取此前存档，或新建独立角色；新的角色不继承此生修为与关系。"
            }}
          </p>
          <button
            v-if="game.status === 'complete' && game.age < game.limit"
            class="primary full"
            :disabled="ui.busy"
            @click="act({ type: 'continue' })"
          >
            继续修行 · 追寻山外故事
          </button>
          <details class="life-review">
            <summary>回看修行卷宗</summary>
            <p v-for="(entry, i) in game.log" :key="i">
              第 {{ entry.month }} 月 · {{ entry.text }}
            </p>
          </details>

        </section></template
      >
      <template v-else-if="dialog === 'break' && game">
        <SceneBackdrop
          image="/scenes/moon-terrace.png"
          title="炼气 → 筑基"
          eyebrow="屏息 · 叩问天关"
          body="风声仿佛停在洞府之外。你将一路积累的灵气收束于丹田，丹药与修为备齐之后，便可叩关；是否再打磨根基，由你决定。"
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
          <p class="muted">
            直接叩关的基础把握；进入三段行功后，以实际紊乱结算，稳住三段可达 100%
          </p>
          <div class="break-details">
            <span v-for="p in details?.parts" :key="p.label"
              >{{ p.label }} {{ p.value > 0 ? "+" : "" }}{{ p.value }}%　</span
            >
          </div>
          <p class="pill-option">
            筑基必需一枚筑基丹（持有
            {{ game.pills }} 枚）。成功或失败均会消耗；显示把握已计入丹药。
          </p>
          <FoundationJourney
            :game="game"
            :busy="ui.busy || ui.running"
            @command="foundationCommand"
          />
          <PreparationValues :game="game" :pill="true" />
          <GrowthPreview :game="game" :request="{ kind: 'break' }" />
          <p class="warning-text">
            本次突破耗时一月，剩余寿元
            {{
              formatLifeMonths(remainingLifeMonths(game))
            }}；若当月寿尽，将先结束人生，不能靠突破延寿。成功增加一百年寿元上限。{{
              game.ward
                ? "护脉丹纹生效：首次失败保留九成修为、不减寿，随后消耗；伤势仍 +2。"
                : "失败保留七成修为、伤势 +2、寿元上限 −1 年。"
            }}可养伤、炼丹、固本后再试。
          </p>
          <p v-if="breakthroughError(game)" class="warning-text">
            {{ breakthroughError(game) }}
          </p>
          <button
            class="primary full"
            :disabled="ui.busy || !!breakthroughError(game)"
            @click="commitBreak"
          >
            凝神，开始三段行功</button
          ><button class="quiet full" :disabled="ui.busy" @click="dialog = ''">
            尚需准备
          </button>
        </section></template
      >
      <template v-else-if="dialog === 'retreat'"
        ><h2 id="modal-title" tabindex="-1">这次闭关将错过约期</h2>
        <p class="event-body">
          闭关六个月无法中途出关。陆迟会独行，同行与护法机会将失去；之后仍可独自重返遗府取丹。确定仍要闭关吗？
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
    </section>
  </div>
</template>

<style scoped>.relic-seal-entry{min-height:60vh;background:linear-gradient(#12271ecc,#12271ecc),url(/art/qi-progression/qingshi-inner-platform.webp) center/cover;padding:8vh 10vw;color:#f4ead3}.relic-seal-entry p{max-width:650px;line-height:1.8}.relic-seal-entry button{padding:14px;margin:10px}</style>
