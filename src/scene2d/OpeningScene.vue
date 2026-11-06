<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from "vue";
import type { State, Intent } from "../core";
import {
  adventureScenes,
  rescueChoices,
  type AdventureAction,
} from "../adventure";
import { characterArt, heroArt } from "../presentation/art";
import ArrivalChoices from '../initiation/ArrivalChoices.vue';
import { arrivalActive } from '../initiation/rules';
import QiOrigin from "../qi-journey/QiOrigin.vue";
import OriginNotes from "../OriginNotes.vue";
import { openingScene } from "./opening";
import { useSpeechBubble } from "./speech-bubble";
import "./speech-bubble.css";
import type { StageHandle } from "./renderer";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; cultivate: [] }>();
const arriving = computed(() => arrivalActive(props.game));
const scene = computed(() => {
  const scene = openingScene(props.game.adventure);
  if (!arriving.value) return scene;
  return {...scene, title:'药乡启程 · 初到听松', lead:'送药抵岸，凭温蘅的引荐求学。先安顿药包，试一试自己的引气之法。', objects:scene.objects.filter(o=>o.id==='origin')};
});
const locked = computed(
  () =>
    props.busy ||
    props.game.status !== "alive" ||
    !!(
      props.game.pending ||
      props.game.social.scene ||
      props.game.social.arena.duel ||
      props.game.expedition.duel ||
      props.game.foundationJourney.duel
    ),
);
const selected = ref(arriving.value ? "origin" : props.game.adventure.step === "home" ? "herbs" : "");
const root = ref<HTMLElement>();
const bubbleStyle = useSpeechBubble(root, () => target.value?.foot ? {...target.value, y: target.value.foot.y - 25} : target.value);
const responseTarget = ref("");
const notesOpen = ref(false);
const walking = ref(false);
const performance = ref("");
const resultOpen = ref(false);
const target = computed(() =>
  scene.value.objects.find((o) => o.id === selected.value),
);
const host = ref<HTMLElement>();
let entry: {x:number;y:number} | undefined;
const ready = ref(false),
  failed = ref(false);
let stage: StageHandle | undefined,
  revision = 0,
  disposed = false;
async function boot(preservePosition = false) {
  const retainedPosition = preservePosition ? stage?.getPosition?.() : undefined;
  const ticket = ++revision;
  walking.value = false;
  performance.value = "";
  stage?.destroy();
  stage = undefined;
  ready.value = false;
  failed.value = false;
  if (!host.value) return;
  try {
    const { mountStage } = await import("./renderer");
    if (disposed || ticket !== revision || !host.value) return;
    const s = scene.value;
    stage = mountStage(
      host.value,
      {
        sceneKey: s.key,
        entry: retainedPosition ?? entry,
        prepared: props.game.adventure.ready,
    method: props.game.adventure.method,
        rescued: props.game.adventure.step === "home",
        heroSequence: props.game.social.gender !== 'female' && props.game.realm === 0
          ? {url:'/art/scene2d/hero-actions-v1.png',frameWidth:384,frameHeight:512} : undefined,
        onPerformance: (caption) => { if(ticket===revision)performance.value=caption; },
        heroWalk: props.game.social.gender !== 'female' && props.game.realm === 0
          ? { url: '/art/scene2d/hero-qi-walk-v2.png', frameWidth: 384, frameHeight: 512 } : undefined,
        onMotion: (value) => { if(ticket === revision) walking.value = value; },
        heroAction: characterArt(
          heroArt(props.game.social.gender, props.game.realm),
          "guard",
        ),
        image: s.image,
        hero: characterArt(heroArt(props.game.social.gender, props.game.realm)),
        heroCharacter: heroArt(props.game.social.gender, props.game.realm),
        objects: s.objects,
        calm: s.calm,
        gate: s.key === "shrine",
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      },
      () => {
        if (ticket === revision) {
          ready.value = true;
          stage?.settle(scene.value.calm);
          syncScene();
        }
      },
    );
  } catch {
    if (ticket === revision) failed.value = true;
  }
}
let resizeObserver: ResizeObserver | undefined;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
onMounted(() => {
  window.addEventListener("keydown", sceneKeydown, true);
  void boot();
  if (typeof ResizeObserver !== "undefined" && host.value) {
    let size = `${host.value.clientWidth}:${host.value.clientHeight}`;
    resizeObserver = new ResizeObserver(() => {
      const next = `${host.value?.clientWidth}:${host.value?.clientHeight}`;
      if (next === size) return;
      size = next;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => void boot(true), 150);
    });
    resizeObserver.observe(host.value);
  }
});
watch(
  () => scene.value.key,
  async (now, before) => {
    entry = now === "apothecary" && (before === "forest" || before === "shrine") ? {x:82,y:84} : now === "shrine" ? {x:16,y:84} : undefined;
    selected.value = "";
    notesOpen.value = false;
    resultOpen.value = false;
    responseTarget.value = "";
    void boot();
    await nextTick();
    host.value
      ?.closest(".game-layout")
      ?.scrollTo({ top: 0, behavior: "instant" });
  },
);
watch(arriving, () => { void boot(true); });
watch(
  () => props.game.adventure.step,
  (now, before) => {
    if (now === "home" && before === "shrine") selected.value = "herbs";
  },
);
watch(
  () => scene.value.calm,
  (calm) => stage?.settle(calm),
);
function syncScene() {
  stage?.sync?.({
    prepared: props.game.adventure.ready,
    method: props.game.adventure.method,
    rescued: props.game.adventure.step === "home",
  });
}
watch(() => [props.game.adventure.ready, props.game.adventure.step, props.game.adventure.method], syncScene);
watch(
  () => props.game.adventure.result,
  (result) => {
    if (result) responseTarget.value = selected.value;
  },
);
function closeInteraction() {
  const previous = selected.value;
  selected.value = "";
  nextTick(() =>
    root.value
      ?.querySelector<HTMLButtonElement>(`[data-object="${previous}"]`)
      ?.focus(),
  );
}
function sceneKeydown(event: KeyboardEvent) {
  const motion: Record<string, [number,number]> = {w:[0,-5],s:[0,5],a:[-5,0],d:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5],ArrowLeft:[-5,0],ArrowRight:[5,0]};
  const direction = motion[event.key];
  // Ground must own focus. Never steal typing or menu/choice navigation.
  if (direction && document.activeElement === root.value && !locked.value && !root.value?.closest('[inert]')) {
    event.preventDefault(); event.stopPropagation(); selected.value=''; stage?.nudge?.(...direction); return;
  }
  if (
    !root.value?.closest("[inert]") &&
    event.key === "Escape" &&
    (selected.value || notesOpen.value || resultOpen.value || walking.value || performance.value)
  ) {
    event.stopPropagation();
    event.preventDefault();
    stage?.skipPerformance?.();
    stage?.stop?.();
    closeInteraction();
    notesOpen.value = false;
    resultOpen.value = false;
  }
}
onBeforeUnmount(() => {
  window.removeEventListener("keydown", sceneKeydown, true);
  resizeObserver?.disconnect();
  clearTimeout(resizeTimer);
  disposed = true;
  revision++;
  stage?.destroy();
});
function skipWalking() { stage?.skipWalk?.(); root.value?.focus({preventScroll:true}); }
function walkGround(event: PointerEvent) {
  if (locked.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
  const bounds=(event.currentTarget as HTMLElement).getBoundingClientRect();
  if(!bounds.width || !bounds.height) return;
  selected.value='';notesOpen.value=false;root.value?.focus({preventScroll:true});
  stage?.walkTo?.((event.clientX-bounds.left)/bounds.width*100,(event.clientY-bounds.top)/bounds.height*100);
}
watch(locked, (value) => { if(value) {stage?.stop?.();stage?.skipPerformance?.();} });
function select(id: string) {
  if (locked.value) return;
  stage?.skipPerformance?.();
  selected.value = id;
  responseTarget.value = "";
  const o = target.value;
  stage?.focus?.(id);
  if (o?.foot) stage?.walkTo?.(o.foot.x + (o.foot.x < 40 ? 9 : -9), o.foot.y, o.foot.x);
  else if (o) stage?.move(o.x, o.y);
}
function act(action: AdventureAction) {
  if (locked.value) return;
  stage?.skipPerformance?.();
  stage?.skipWalk?.();
  if (action === "finish") emit("cultivate");
  else emit("act", { type: "adventure", action });
}
</script>
<template>
  <section ref="root" class="opening-stage" tabindex="0" aria-label="寻人主线" aria-keyshortcuts="W A S D ArrowUp ArrowDown ArrowLeft ArrowRight">
    <div
      class="stage-world"
      @pointerdown="walkGround"
      :style="{ backgroundImage: `url(${scene.image})` }"
    >
      <div ref="host" class="stage-canvas" aria-hidden="true"></div>
      <div class="stage-shade" aria-hidden="true"></div>
      <button
        v-for="o in scene.objects"
        :key="o.id"
        class="scene-object"
        :class="{
          selected: selected === o.id,
          person: o.kind === 'person',
          exit: o.kind === 'exit',
        }"
        :data-object="o.id"
        :style="{ left: o.x + '%', top: o.y + '%' }"
        :disabled="locked"
        :aria-pressed="selected === o.id"
        @click="
          select(o.id);
          notesOpen = false;
        "
      >
        <span class="object-dot" aria-hidden="true">{{
          o.kind === "exit" ? "↗" : o.kind === "person" ? "· · ·" : "◇"
        }}</span
        ><span>{{ o.name }}</span>
      </button>
    </div>
    <div v-if="performance" class="performance-caption" role="status"><span>{{performance}}</span><button @click="stage?.skipPerformance?.()">跳过演出</button></div>
    <button v-if="walking" class="skip-walk" @click="skipWalking">略过走近</button>
    <header class="scene-heading">
      <span>听松山</span>
      <h2>{{ scene.title }}</h2>
      <button
        class="notes-toggle"
        :aria-expanded="notesOpen"
        @click="
          notesOpen = !notesOpen;
          selected = '';
        "
      >
        沿途见闻与现场详情
      </button>
    </header>
    <aside class="scene-objective" aria-label="眼前的事">
      <span>{{ arriving ? "我的求道之始" : "在听松求学" }}</span>
      <p>{{ scene.lead }}</p>
      <small v-if="game.adventure.step === 'home'">阵光散去 · 药工已脱险</small>
      <small
        v-else-if="game.adventure.step === 'apothecary' && game.adventure.ready"
        >行装已备 · 可以入林</small
      >
    </aside>
    <aside v-if="!performance && target?.kind === 'person' && target.speech"
      class="speech-bubble npc-speech" :style="bubbleStyle" aria-label="人物对白">
      <strong>{{ target.speaker || target.name }}</strong>
      <div class="speech-content"><p>{{ target.speech }}</p></div>
    </aside>
    <div
      v-show="!performance"
      class="stage-interaction"
      :class="{
        'has-target': !!target,
      }"
      aria-label="冒险操作区"
      aria-live="polite"
    >
      <div v-if="target">
        <img
          v-if="target.portrait && target.kind !== 'person'"
          class="speaker-portrait"
          :src="target.portrait"
          :alt="target.speaker || target.name"
        />
        <div class="interaction-title">
          <h3>
            {{ target.speaker || target.name
            }}<small>{{
              target.kind === "person"
                ? "交谈"
                : target.kind === "exit"
                  ? "行路"
                  : "眼前所见"
            }}</small>
          </h3>
          <button @click="closeInteraction" aria-label="收起现场操作">×</button>
        </div>
        <p v-if="!arriving && target.detail" class="observation">{{ target.detail }}</p>
        <ArrivalChoices v-if="arriving" :game="game" :busy="locked" @act="emit('act',$event)" />
        <QiOrigin v-else-if="target.id==='origin'" :game="game" :busy="busy" @act="emit('act',$event)" />
        <p
          v-if="target.kind !== 'person' && responseTarget === selected && scene.briefResult"
          class="immediate-response"
          role="status"
        >
          {{ scene.briefResult }}
        </p>
        <div class="object-actions">
          <button
            v-for="option in target.options"
            :key="option.action"
            :aria-label="option.label"
            :disabled="
              locked || (option.action === 'prepare' && game.adventure.ready)
            "
            @click="act(option.action)"
          >
            <span>{{ option.shortLabel }}</span>
            <small
              v-if="
                option.label !== option.shortLabel &&
                (['prepare', 'rush'].includes(option.action) ||
                  (option.action === 'challenge' && !game.adventure.ready))
              "
              >{{ option.label }}</small
            ><small v-if="game.adventure.step === 'home'">{{
              option.action === "return"
                ? rescueChoices.roots.hint
                : rescueChoices.supplies.hint
            }}</small>
          </button>
        </div>
      </div>
      <small v-if="failed">场景画面暂未载入，仍可通过标记完成行动。</small>
    </div>
    <div
      v-if="game.adventure.result && !notesOpen"
      class="opening-receipt"
      :class="{ 'receipt-open': resultOpen }"
    >
      <button :aria-expanded="resultOpen" @click="resultOpen = !resultOpen">
        {{ resultOpen ? "收起经过" : "刚才发生的事" }}
        {{ resultOpen ? "−" : "+" }}
      </button>
      <p v-show="resultOpen" class="settled-response" role="status">
        {{ game.adventure.result }}
      </p>
    </div>
    <section
      v-if="notesOpen"
      class="scene-notes"
      aria-label="沿途见闻与现场详情"
    >
      <div class="interaction-title">
        <h3>沿途见闻</h3>
        <button aria-label="收起见闻" @click="notesOpen = false">×</button>
      </div>
      <p>{{ adventureScenes[game.adventure.step].body }}</p>
      <OriginNotes :game="game" :busy="busy" @act="emit('act', $event)" />
      <small>这段寻人不推进修行年月；走动和观察不消耗物资。</small>
    </section>
    <p v-if="!target && !notesOpen" class="stage-help">
      点击地面行走 · WASD / 方向键移动 · 选择人物或路标 <span>· Tab 选择 / Enter 查看</span>
    </p>
  </section>
</template>
<style scoped>
.performance-caption {position:absolute;z-index:9;bottom:110px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:24px;background:#102b25e8;border:1px solid #ad9768;padding:10px 20px;color:#efdfb9;}
.performance-caption button {color:inherit;background:transparent;border:1px solid #ad9768;padding:8px;}
.skip-walk {position:absolute;z-index:8;bottom:115px;left:50%;transform:translateX(-50%);background:#17362b;color:#efdfb9;border:1px solid #ad9768;padding:8px 16px;}
.opening-stage:focus {outline:none;}
.opening-stage:focus-visible {box-shadow:inset 0 0 0 2px #c9b779;}
.opening-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  color: #f4ead2;
  isolation: isolate;
  overflow: hidden;
}
.stage-world,
.stage-canvas,
.stage-shade {
  position: absolute;
  inset: 0;
}
.stage-world {
  background-size: cover;
  background-position: center;
}
.stage-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
}
.stage-shade {
  pointer-events: none;
  background: linear-gradient(
    180deg,
    #061519b3,
    transparent 32%,
    transparent 70%,
    #061519bd
  );
}
.scene-heading {
  display: block;
  height: auto;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  position: absolute;
  top: 100px;
  left: 32px;
  text-shadow: 0 2px 8px #000;
}
.scene-heading > span {
  font-size: 12px;
  letter-spacing: 5px;
  color: #dcc79d;
}
.scene-heading h2 {
  margin: 4px 0 12px;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 4px;
}
.opening-stage button {
  color: #f4ead2;
  cursor: pointer;
}
.notes-toggle,
.opening-receipt > button {
  background: #102923b8;
  border: 1px solid #b6a07666;
  padding: 8px 12px;
  font-size: 12px;
}
.scene-objective {
  position: absolute;
  right: 30px;
  top: 112px;
  width: 240px;
  border-right: 2px solid #c7ad75;
  padding: 0 14px;
  text-shadow: 0 2px 5px #000;
}
.scene-objective > span {
  color: #ecd39c;
  font-size: 13px;
}
.scene-objective p {
  font-size: 14px;
  line-height: 1.7;
  margin: 6px 0;
}
.scene-objective small {
  color: #e0edbe;
}
.opening-stage .scene-object {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  min-height: 44px;
  border: 0;
  background: transparent;
  font-size: 14px;
  text-shadow:
    0 2px 5px #000,
    0 0 8px #000;
  white-space: nowrap;
}
.scene-object > span:last-child {
  padding: 3px 8px;
  border-bottom: 1px solid #d8bd7f88;
  background: #0b2326a8;
}
.object-dot {
  color: #ffe0a1;
  font-size: 27px;
  line-height: 1;
  filter: drop-shadow(0 0 5px #ecc475);
}
.scene-object.selected .object-dot {
  color: white;
}
.opening-stage button:focus-visible {
  outline: 2px solid #ffdb91;
  outline-offset: 4px;
}
.stage-interaction {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  width: min(760px, calc(100% - 64px));
  z-index: 3;
}
.stage-interaction.has-target,
.scene-notes {
  border: 1px solid #a18b5d88;
  background: linear-gradient(120deg, #102720f5, #142827ee);
  box-shadow: 0 10px 40px #0008;
  padding: 18px 24px;
  backdrop-filter: blur(14px);
}
.stage-interaction.has-target {
  max-height: 38%;
  overflow: auto;
}
.interaction-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.interaction-title h3 {
  margin: 0;
  color: #e5cc94;
  font-size: 17px;
}
.interaction-title button {
  background: transparent;
  border: 1px solid #687d6c;
  min-width: 36px;
  min-height: 32px;
}
.stage-interaction p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.65;
}
.object-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.object-actions button {
  flex: 1 1 180px;
  border: 1px solid #a58c57;
  background: #294b3e;
  padding: 10px 14px;
  min-height: 44px;
  font-size: 14px;
  text-align: left;
}
.object-actions small {
  display: block;
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.6;
  color: #e1d7bf;
}
.opening-receipt {
  position: absolute;
  left: 32px;
  bottom: 16px;
  z-index: 4;
}
.opening-receipt.receipt-open {
  width: min(760px, calc(100% - 64px));
  max-height: 110px;
  overflow: auto;
  background: #102720fa;
  border: 1px solid #a18b5d88;
  padding: 12px;
}
.settled-response {
  font-size: 14px;
  line-height: 1.8;
}
.stage-interaction.has-target ~ .opening-receipt {
  bottom: 16px;
  top: auto;
}
.opening-receipt .settled-response { margin: 4px 0 0; }

.scene-notes {
  position: absolute;
  left: 32px;
  top: 210px;
  width: min(460px, calc(100% - 64px));
  max-height: calc(100% - 310px);
  overflow: auto;
  z-index: 5;
}
.scene-notes p {
  line-height: 1.85;
  font-size: 15px;
}
.scene-notes small {
  color: #bfbba8;
}
.stage-help {
  position: absolute;
  bottom: 92px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #e3d5b5;
  pointer-events: none;
  text-shadow: 0 2px 6px #000;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 600px) {
  .scene-heading {
    top: 88px;
    left: 16px;
  }
  .scene-heading h2 {
    font-size: 23px;
  }
  .scene-heading .notes-toggle {
    padding: 6px;
    font-size: 10px;
  }
  .scene-objective {
    top: 90px;
    right: 12px;
    width: 135px;
    padding: 0 8px;
  }
  .scene-objective p {
    font-size: 12px;
    line-height: 1.5;
  }
  .scene-objective > span,
  .scene-objective small {
    font-size: 10px;
  }
  .opening-stage .scene-object {
    font-size: 11px;
    padding: 4px;
  }
  .stage-interaction {
    bottom: 75px;
    width: calc(100% - 24px);
  }
  .stage-interaction.has-target {
    padding: 12px;
    max-height: 38%;
  }
  .object-actions {
    gap: 6px;
  }
  .object-actions button {
    flex-basis: 115px;
    padding: 8px;
    font-size: 12px;
  }
  .object-actions small {
    font-size: 11px;
  }
  .stage-interaction p {
    font-size: 12px;
  }
  .opening-receipt {
    left: 12px;
    bottom: 75px;
  }
  .stage-interaction.has-target ~ .opening-receipt {
    top: 205px;
  }
  .scene-notes {
    left: 12px;
    top: 195px;
    width: calc(100% - 24px);
    max-height: calc(100% - 285px);
    padding: 14px;
  }
  .stage-help {
    bottom: 110px;
    font-size: 11px;
  }
  .stage-help span {
    display: none;
  }
}

/* PC dialogue is an overlay on the scene, not a new page. */
.speaker-portrait {
  float: left;
  width: 104px;
  height: 138px;
  object-fit: cover;
  object-position: 50% 20%;
  margin: 0 20px 10px 0;
  border: 1px solid #a18b5d88;
  border-radius: 3px;
}
.interaction-title h3 small {
  font-size: 11px;
  color: #b8bdad;
  margin-left: 12px;
  font-weight: normal;
}
.immediate-response {
  border-left: 2px solid #bca66f;
  padding-left: 12px;
  color: #ebdbad;
}
.object-actions {
  clear: both;
}
.opening-stage .scene-object.person .object-dot {
  font-size: 19px;
  letter-spacing: 2px;
  border: 1px solid #e2ca8d;
  border-radius: 50%;
  width: 36px;
  height: 26px;
  background: #18362cc9;
}
.opening-stage .scene-object.exit .object-dot {
  font-size: 30px;
}
@media (min-width: 1000px) {
  .opening-stage {
    background: #08191b;
  }

  .stage-interaction {
    width: min(780px, calc(100% - 80px));
    bottom: 86px;
  }
  .stage-interaction.has-target {
    border-radius: 5px;
    padding: 20px 24px;
    max-height: 40%;
    background: linear-gradient(110deg, #102720fa, #142827ed);
  }
  .stage-interaction.conversation {
    width: min(840px, calc(100% - 80px));
  }
  .stage-interaction .observation {
    font-size: 16px;
    line-height: 1.8;
  }
  .object-actions button {
    flex: 1 1 150px;
    min-height: 44px;
  }
  .scene-objective {
    width: 250px;
  }
}
@media (max-width: 600px) {
  .speaker-portrait {
    width: 60px;
    height: 82px;
    margin-right: 12px;
  }
}
</style>
