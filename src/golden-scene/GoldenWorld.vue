<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import type { State } from "../core";
import { characterArt } from "../presentation/art";
import WalkingActor from "../scene2d/WalkingActor.vue";
import { useSceneApproach } from "../scene2d/use-scene-approach";
import CombatField from "../scene2d/combat/CombatField.vue";
import {
  goldenCombat,
  goldenSnapshot,
  goldenPerformance,
  goldenGuardian,
  rivalImages,
  type GoldenDomain,
} from "./presentation";
const props = defineProps<{
  game: State;
  domain: GoldenDomain;
  focus?: string;
  busy?: boolean;
}>();
const emit = defineEmits<{ performed: []; select: [id: string] }>();
const hero = computed(() =>
  props.game.social.gender === "female" ? "hero-female" : "hero-male",
);
const combat = computed(() => goldenCombat(props.game, props.domain));
const shore = computed(
  () =>
    props.game.outerSea.location === "ferry" &&
    (props.domain === "sea" || props.game.conclave.location === "away"),
);
const court = computed(
  () => props.domain === "conclave" && props.game.conclave.location === "court",
);
const inRuins = computed(() =>
  props.domain === "sea"
    ? props.game.outerSea.location === "ruins"
    : props.game.conclave.location === "vault",
);
const walkReady = ref(false);
const meditationReady = ref(false);
const meditating = computed(
  () =>
    !combat.value &&
    ritual.value &&
    phase.value !== "rest" &&
    meditationReady.value,
);
watch(hero, () => {
  meditationReady.value = false;
});
const walk = useSceneApproach({
  animated: () =>
    (court.value || inRuins.value) &&
    props.game.social.gender === "male" &&
    walkReady.value &&
    !props.busy &&
    !combat.value,
  initial: props.domain === "conclave" && props.game.conclave.location === "court"
    ? { x: 28, y: 82 } : { x: 24, y: 87 },
});
watch(
  () => [props.busy, !!combat.value, !!props.game.pending, props.game.status],
  () => {
    if (
      props.busy ||
      combat.value ||
      props.game.pending ||
      props.game.status !== "alive"
    )
      walk.cancel();
  },
);
watch(
  () =>
    props.domain === "sea"
      ? props.game.outerSea.location
      : props.game.conclave.location,
  () => walk.reset(court.value ? { x: 28, y: 82 } : { x: 24, y: 87 }),
);
const friends = computed(() => !combat.value && (shore.value || court.value));
const performance = ref<ReturnType<typeof goldenPerformance>>(null);
const cue = computed(() => performance.value?.label ?? "");
const phase = ref<"gather" | "settle" | "rest">("rest");
const reducedMotion = ref(false);
const guardian = computed(() => goldenGuardian(props.game, props.domain));
const ritual = computed(
  () =>
    performance.value &&
    ["attune", "method", "breakthrough"].includes(performance.value.kind),
);
const showPearl = computed(
  () =>
    !combat.value &&
    (performance.value?.pearl ||
      (props.domain === "conclave" &&
        props.game.conclave.depth > 0 &&
        props.focus === "treasure")),
);
const showBook = computed(
  () =>
    !combat.value &&
    (performance.value?.book ||
      (props.focus === "treasure" &&
        (props.domain === "conclave"
          ? props.game.conclave.depth === 2
          : props.game.outerSea.manual))),
);
const showSeal = computed(
  () =>
    !combat.value &&
    (performance.value?.seal ||
      (props.focus === "treasure" &&
        props.domain === "sea" &&
        props.game.outerSea.seal)),
);
const objectPosition = computed(() => ({
  left: `${walk.position.value.x}%`,
  top: `${walk.position.value.y}%`,
}));
let timer: ReturnType<typeof setTimeout> | undefined;
let preference: MediaQueryList | undefined;
function stop() {
  walk.cancel();
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
  performance.value = null;
  phase.value = "rest";
}
function visibility() {
  reducedMotion.value = !!preference?.matches;
  if (document.hidden) stop();
  else if (reducedMotion.value) phase.value = "rest";
}
function keyboard(e: KeyboardEvent) {
  if (e.key === "Escape") stop();
}
watch(
  () => goldenSnapshot(props.game, props.domain),
  (next, previous) => {
    if (
      (Object.keys(next) as (keyof typeof next)[]).every(
        (key) => next[key] === previous[key],
      )
    )
      return;
    const result = goldenPerformance(previous, next);
    stop();
    if (result) {
      emit("performed");
      if (!document.hidden) {
        walk.cancel();
        performance.value = result;
        if (result.kind === "arrival" && !props.busy && !props.game.pending) {
          walk.reset({ x: 18, y: 87 });
          walk.walkTo({ x: 24, y: 87 });
        }
        phase.value = reducedMotion.value ? "rest" : "gather";
        const advance = () => {
          if (phase.value === "gather") {
            phase.value = "settle";
            timer = setTimeout(advance, 800);
          } else if (phase.value === "settle") {
            phase.value = "rest";
            timer = setTimeout(stop, 600);
          } else stop();
        };
        timer = setTimeout(advance, reducedMotion.value ? 1800 : 650);
      }
    }
  },
);
watch(
  () => props.focus,
  (value) => {
    if (value) {
      walk.cancel();
      stop();
      // Use only the foreground stone corridor, never the water or background stairs.
      if (
        (court.value || inRuins.value) &&
        !props.busy &&
        !combat.value &&
        !props.game.pending &&
        props.game.status === "alive"
      ) {
        const positions: Record<string, number> = inRuins.value
          ? { path: 52, arena: 52, exit: 18 }
          : {
              friends: 34, gu: 33, ye: 62,
              arena: 60,
              chamber: 25,
              path: 67,
              treasure: 32,
              exit: 15,
            };
        if (positions[value] !== undefined)
          walk.walkTo({ x: positions[value]!, y: court.value ? 82 : 87 });
      }
    }
  },
);
onMounted(() => {
  for (const pose of ["idle", "attack", "guard", "hurt", "meditate"] as const) {
    const img = new Image();
    img.src = characterArt(hero.value, pose);
  }
  preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  reducedMotion.value = !!preference?.matches;
  preference?.addEventListener?.("change", visibility);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("keydown", keyboard);
});
onBeforeUnmount(() => {
  stop();
  preference?.removeEventListener?.("change", visibility);
  document.removeEventListener("visibilitychange", visibility);
  window.removeEventListener("keydown", keyboard);
});
</script>
<template>
  <div
    class="golden-world"
    :data-cue="cue"
    :data-phase="phase"
    :data-performance="performance?.kind"
    :class="{ 'reduced-motion': reducedMotion, 'court-world': court, 'shore-world': shore }"
  >
    <WalkingActor
      v-if="!combat"
      v-show="!meditating"
      :character="hero"
      :label="game.name"
      :position="walk.position.value"
      :moving="walk.moving.value"
      :frame="walk.frame.value"
      :facing="walk.facing.value"
      @ready="walkReady = $event"
    />
    <div
      v-show="meditating"
      class="meditating-actor"
      :style="objectPosition"
      @load.capture="meditationReady = true"
      @error.capture="meditationReady = false"
    >
      <img
        :key="hero"
        :src="characterArt(hero, 'meditate')"
        :alt="game.name"
        decoding="sync"
      />
    </div>
    <div v-if="walk.moving.value && !cue" class="golden-caption">
      <span>沿石台走近</span><button @click.stop="walk.skip">略过走近</button>
    </div>
    <div v-if="friends && court" class="court-people">
      <button v-for="person in [{ id: 'gu-cangyao', key: 'gu', name: '顾沧遥' }, { id: 'ye-wenling', key: 'ye', name: '叶问苓' }]"
        :key="person.id" class="court-person" :class="person.id"
        :aria-label="'与' + person.name + '交谈'" :aria-pressed="focus === person.key"
        :disabled="busy" @click.stop="emit('select', person.key)">
        <img :src="'/art/conclave/' + person.id + '-v1.webp'" :alt="person.name + '在现场'" />
      </button>
    </div>
    <div v-else-if="friends" class="shore-people">
      <button v-for="person in [{ id: 'gu-cangyao', name: game.outerSea.met ? '顾沧遥' : '修堤者' }, { id: 'ye-wenling', name: game.outerSea.met ? '叶问苓' : '观潮阵修' }]"
        :key="person.id" class="court-person" :class="person.id"
        :aria-label="'与' + person.name + '交谈'" :disabled="busy"
        @click.stop="emit('select', domain === 'sea' ? 'friends' : 'shore')">
        <img :src="'/art/conclave/' + person.id + '-v1.webp'" :alt="person.name + '在现场'" />
      </button>
    </div>
    <button
      v-if="court && !combat && game.conclave.introduced && game.conclave.wins > 0 && game.conclave.wins < 3"
      class="court-person waiting-rival" :disabled="busy"
      :aria-label="game.conclave.wins === 1 ? '与纪闻霜交谈' : '与程砚舟交谈'"
      :aria-pressed="focus === 'arena'" @click.stop="emit('select', 'arena')">
      <img :src="rivalImages[game.conclave.wins]"
        :alt="game.conclave.wins === 1 ? '纪闻霜候场' : '程砚舟候场'" />
    </button>
    <div
      v-if="
        !combat &&
        (domain === 'sea' ? game.outerSea.prepared : game.conclave.supplies)
      "
      class="travel-bundle"
      :style="objectPosition"
      role="img"
      aria-label="备好的避潮行装"
    >
      <i></i>
    </div>
    <img
      v-if="guardian && !guardian.array"
      class="waiting-guardian"
      src="/art/characters/golem.webp"
      :alt="guardian.name + '守在阵前'"
    />
    <div
      v-if="combat?.array || guardian?.array"
      class="array-core"
      role="img"
      aria-label="照神阵枢"
    >
      <i></i><i></i><i></i>
    </div>
    <div
      v-if="ritual"
      class="ritual-light"
      :style="objectPosition"
      aria-hidden="true"
    >
      <i></i><i></i>
    </div>
    <div
      v-if="showPearl || showBook || showSeal"
      class="held-artifacts"
      :style="objectPosition"
    >
      <div
        v-if="showPearl"
        class="pearl"
        :class="{ attuned: game.conclave.attuned }"
        role="img"
        aria-label="定神珠"
      >
        <i></i>
      </div>
      <img
        v-if="showBook"
        src="/art/outer-sea/manual.webp"
        :alt="domain === 'conclave' ? '抱元凝神录' : '澄息篇'"
      />
      <img v-if="showSeal" src="/art/outer-sea/seal.webp" alt="镇潮印" />
    </div>
    <CombatField :snapshot="combat" :hero="hero" :hero-name="game.name" />
    <div
      v-if="cue"
      class="golden-caption"
      :class="{ 'retreat-caption': performance?.kind === 'defeat' }"
      role="status"
    >
      <span>{{ cue }}</span
      ><button @click.stop="stop">跳过演出</button>
    </div>
  </div>
</template>
<style scoped>
.golden-world {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.meditating-actor {
  position: absolute;
  width: 195px;
  height: 260px;
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 10px 8px #0008);
}
.meditating-actor img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}
.shore-world :deep(.walking-actor), .shore-world .meditating-actor { width:19%; height:33%; }
.shore-world .court-person { top:80%; }
.shore-world .gu-cangyao { left:43%; }
.shore-world .ye-wenling { left:47%; top:76%; }
/* Court figures share the stone terrace's ground plane. Foreground hero is slightly larger. */
.court-world :deep(.walking-actor), .court-world .meditating-actor {
  width: 19%; height: 33%; z-index: 2;
}
.court-person {
  position: absolute; top: 74%; width: 14%; height: 29%;
  transform: translate(-50%, -100%); pointer-events: auto;
  border: 0; padding: 0; margin: 0; background: transparent; cursor: pointer;
  filter: drop-shadow(0 6px 5px #10231d66);
}
.court-person::before {
  content: ""; position: absolute; bottom: 0; left: 23%; width: 54%; height: 5%;
  border-radius: 50%; background: #13241f55; filter: blur(4px); z-index: -1;
}
.court-person img { width: 100%; height: 100%; object-fit: contain; object-position: center bottom; }
.court-person:is(:hover, :focus-visible), .court-person[aria-pressed="true"] {
  filter: drop-shadow(0 0 6px #ebd69999);
}
.court-person:focus-visible { outline: 2px solid #e9d39b; outline-offset: 3px; border-radius: 35%; }
.gu-cangyao { left: 45%; }
.ye-wenling { left: 55%; }
.waiting-rival { left: 71%; }
.golden-caption {
  position: absolute;
  bottom: 8%;
  left: 32%;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #102b24ed;
  color: #f4ead3;
  padding: 10px 16px;
  border: 1px solid #bca26b88;
}
.golden-caption button {
  pointer-events: auto;
  background: transparent;
  color: inherit;
  border: 1px solid #bca26b;
  padding: 7px 12px;
  cursor: pointer;
}
.pearl {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #efffe9, #8ab9aa 45%, #264d47);
  box-shadow: 0 0 22px #b0dccb77;
}
.pearl.attuned {
  box-shadow: 0 0 36px #d3f7d9;
}
.travel-bundle {
  position: absolute;
  width: 26px;
  height: 28px;
  margin: -85px 0 0 52px;
  border-radius: 30% 35% 42% 40%;
  border: 1px solid #8e9d8b;
  background: radial-gradient(
    ellipse at 30% 20%,
    #71806a,
    #3c5141 60%,
    #22352b
  );
  box-shadow: 0 5px 6px #03100d99;
}
.travel-bundle::before {
  content: "";
  position: absolute;
  left: 11px;
  top: -5px;
  bottom: 0;
  width: 4px;
  background: #a69a70;
  border-radius: 2px;
}
.travel-bundle i {
  position: absolute;
  width: 30px;
  height: 8px;
  left: -2px;
  top: -4px;
  background: #6c7c66;
  border: 1px solid #9ba78a;
  border-radius: 8px;
}
.retreat-caption {
  border-color: #b9906c;
  background: #382b23ed;
}
.waiting-guardian {
  position: absolute;
  right: 22%;
  bottom: 24%;
  width: 19%;
  height: 43%;
  object-fit: contain;
  filter: drop-shadow(0 12px 10px #001e20aa);
}
.held-artifacts {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 58px;
  transform: translateY(-125px);
  filter: drop-shadow(0 8px 10px #072525aa);
  transition:
    transform 600ms ease,
    filter 600ms ease;
}
.held-artifacts img {
  width: 76px;
  height: 76px;
  object-fit: contain;
}
[data-phase="gather"] .held-artifacts {
  transform: translateY(-140px);
}
[data-phase="settle"] .held-artifacts {
  filter: drop-shadow(0 0 15px #d9e4a999);
}
.ritual-light {
  position: absolute;
  width: 180px;
  height: 70px;
  margin: -50px 0 0 -90px;
  border-radius: 50%;
  border: 1px solid #d6e5ae88;
  background: radial-gradient(
    ellipse,
    #95c9aa66,
    #7fa7a32a 45%,
    transparent 70%
  );
  opacity: 0.45;
  transform: scale(0.8);
  transition:
    opacity 650ms ease,
    transform 650ms ease;
}
.ritual-light i {
  position: absolute;
  inset: 10px;
  border: 1px solid #dcebb666;
  border-radius: 50%;
}
.ritual-light i + i {
  inset: 20px;
}
[data-phase="settle"] .ritual-light {
  opacity: 1;
  transform: scale(1.15);
}
[data-phase="rest"] .ritual-light {
  opacity: 0.2;
  transform: scale(0.85);
}
.reduced-motion .held-artifacts,
.reduced-motion .ritual-light {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .held-artifacts,
  .ritual-light {
    transition: none;
  }
}
.array-core {
  position: absolute;
  right: 24%;
  bottom: 34%;
  width: 150px;
  height: 150px;
  border: 2px solid #b1d8d5;
  border-radius: 50%;
  box-shadow: 0 0 28px #a6d7cd88;
  transform: rotate(25deg);
}
.array-core i {
  position: absolute;
  inset: 15%;
  border: 2px solid #d5d4ad;
  transform: rotate(45deg);
}
.array-core i:nth-child(2) {
  inset: 30%;
  transform: rotate(0);
}
.array-core i:nth-child(3) {
  inset: 44%;
  background: #d4eadc;
  box-shadow: 0 0 24px #fff;
}
@media (max-width: 900px) {
  .golden-caption {
    left: 10%;
    max-width: 80%;
  }
  .meditating-actor {
    width: 143px;
    height: 190px;
  }
  .held-artifacts {
    margin-left: 40px;
  }
  .held-artifacts img {
    width: 56px;
    height: 56px;
  }
}
</style>
