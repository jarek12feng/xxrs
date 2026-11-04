<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { sceneFocus } from "./scene-focus";
export interface SceneHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
}
const props = withDefaults(
  defineProps<{
    image: string;
    title: string;
    goal?: string;
    body?: string;
    stageKey: string;
    hotspots: SceneHotspot[];
    active?: string;
    battle?: boolean;
    activityTitle?: string;
    battleInspector?: boolean;
    focusScene?: boolean;
  }>(),
  {
    active: "",
    battle: false,
    goal: "",
    body: "",
    activityTitle: "交锋之中",
    battleInspector: true,
    focusScene: true,
  },
);
const emit = defineEmits<{ select: [id: string]; close: [] }>();
const root = ref<HTMLElement>();
const notes = ref(false);
const width = ref(0);
const hidden = ref(false);
let resize: ResizeObserver | undefined;
const focus = computed(() =>
  sceneFocus(
    props.battle || notes.value || !props.focusScene ? undefined : target.value,
    width.value,
  ),
);
const composition = computed(() => ({
  transform: `translate(${focus.value.x}%,${focus.value.y}%) scale(${focus.value.scale})`,
}));
function visibility() {
  hidden.value = document.hidden;
}
function navigate(event: KeyboardEvent, id: string) {
  const direction =
    event.key === "ArrowRight" || event.key === "ArrowDown"
      ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? -1
        : 0;
  if (!direction || !props.hotspots.length) return;
  event.preventDefault();
  const index = props.hotspots.findIndex((point) => point.id === id);
  const next =
    props.hotspots[
      (index + direction + props.hotspots.length) % props.hotspots.length
    ];
  root.value
    ?.querySelector<HTMLButtonElement>(`[data-hotspot="${next.id}"]`)
    ?.focus({ preventScroll: true });
}
const backdrop = computed(() =>
  props.image === "/scenes/apothecary.jpg"
    ? "/art/scene2d/apothecary-floor-v1.png"
    : props.image,
);
const target = computed(() =>
  props.hotspots.find((x) => x.id === props.active),
);
watch(
  () => props.battle,
  (battle) => {
    if (battle) notes.value = false;
  },
);
watch(
  () => props.stageKey,
  () => {
    notes.value = false;
    emit("close");
  },
);
function choose(id: string) {
  notes.value = false;
  emit("select", id);
}
function close() {
  const id = props.active;
  notes.value = false;
  emit("close");
  root.value
    ?.querySelector<HTMLButtonElement>(`[data-hotspot="${id}"]`)
    ?.focus({ preventScroll: true });
}
function keyboard(event: KeyboardEvent) {
  if (event.key !== "Escape" || props.battle || (!props.active && !notes.value))
    return;
  if (root.value?.closest("[inert]") || !root.value?.getClientRects().length)
    return;
  event.preventDefault();
  event.stopPropagation();
  close();
}
onMounted(() => {
  window.addEventListener("keydown", keyboard, true);
  document.addEventListener("visibilitychange", visibility);
  visibility();
  width.value = root.value?.clientWidth ?? 0;
  if (typeof ResizeObserver !== "undefined" && root.value) {
    resize = new ResizeObserver((entries) => {
      width.value = entries[0]?.contentRect.width ?? 0;
    });
    resize.observe(root.value);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", keyboard, true);
  document.removeEventListener("visibilitychange", visibility);
  resize?.disconnect();
});
</script>
<template>
  <section
    ref="root"
    class="narrative-stage"
    :class="{
      'in-combat': battle,
      inspecting: active || notes,
      'scene-paused': hidden,
    }"
    :aria-label="title"
    :data-stage="stageKey"
  >
    <div class="narrative-world" :style="composition">
      <Transition name="place" mode="default"
        ><div
          :key="backdrop"
          class="scene-landscape"
          :style="{ backgroundImage: `url(${backdrop})` }"
          aria-hidden="true"
        ></div
      ></Transition>
      <div class="narrative-vignette" aria-hidden="true"></div>
      <div class="world-figures"><slot name="world" /></div>
      <button
        v-for="point in hotspots"
        :key="point.id"
        class="narrative-hotspot"
        :data-hotspot="point.id"
        :style="{ left: point.x + '%', top: point.y + '%' }"
        :aria-pressed="active === point.id"
        @click="choose(point.id)"
        @keydown="navigate($event, point.id)"
      >
        <span aria-hidden="true">◇</span><strong>{{ point.label }}</strong>
      </button>
    </div>
    <div class="narrative-overview">
      <header class="narrative-heading">
        <small>青玄界 · 此间行旅</small>
        <h2>{{ title }}</h2>
        <button
          :disabled="battle"
          :aria-expanded="notes"
          @click="notes = !notes"
        >
          此地见闻
        </button>
      </header>
      <aside class="narrative-goal" v-if="goal">
        <span>眼前之事</span>
        <p>{{ goal }}</p>
        <slot name="status" />
      </aside>
    </div>
    <section
      v-if="notes"
      class="narrative-inspector narrative-notes"
      aria-label="此地见闻"
    >
      <div class="narrative-inspector-heading">
        <h3>此地见闻</h3>
        <button @click="close" aria-label="收起此地见闻">×</button>
      </div>
      <p v-if="body">{{ body }}</p>
      <slot name="notes" />
    </section>
    <section
      v-else-if="battle ? battleInspector : active"
      :key="active || stageKey"
      class="narrative-inspector"
      :class="{ 'battle-inspector': battle }"
      aria-label="现场操作"
    >
      <div class="narrative-inspector-heading">
        <h3>{{ battle ? activityTitle : target?.label || "眼前所见" }}</h3>
        <button v-if="!battle" @click="close" aria-label="收起现场操作">
          ×
        </button>
      </div>
      <slot />
    </section>
    <p v-else-if="!battle" class="narrative-hint">
      选择场景中的人物、器物或道路 · Tab 选择，Enter 查看
    </p>
  </section>
</template>
<style scoped>
.narrative-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: calc(100dvh - 160px);
  min-height: 560px;
  overflow: clip;
  color: #f2ead7;
  background: #081b1c;
  border: 1px solid #bca26b44;
}
.narrative-world {
  position: absolute;
  inset: 0;
  transform-origin: center;
  transition: transform 420ms cubic-bezier(0.2, 0.65, 0.3, 1);
}
.scene-landscape {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
}
.place-enter-active,
.place-leave-active {
  transition: opacity 350ms ease;
}
.place-enter-from,
.place-leave-to {
  opacity: 0;
}
.narrative-stage.inspecting .narrative-hotspot:not([aria-pressed="true"]) {
  opacity: 0.38;
}
.narrative-stage.inspecting
  .narrative-hotspot:not([aria-pressed="true"]):is(:hover, :focus-visible) {
  opacity: 1;
}
.narrative-hotspot {
  transition: opacity 180ms ease;
}
.narrative-hotspot[aria-pressed="true"] > span {
  animation: point-response 600ms ease-out;
}
@keyframes point-response {
  from {
    transform: scale(1.7);
    filter: drop-shadow(0 0 14px #ffe3a4);
  }
  to {
    transform: scale(1);
  }
}
.scene-paused * {
  animation-play-state: paused !important;
}
@media (prefers-reduced-motion: reduce) {
  .narrative-world,
  .place-enter-active,
  .place-leave-active,
  .narrative-hotspot {
    transition: none;
  }
  .narrative-hotspot[aria-pressed="true"] > span {
    animation: none;
  }
}

.narrative-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    #071916a8,
    transparent 36%,
    transparent 70%,
    #071916a8
  );
}
.world-figures {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.narrative-heading {
  position: absolute;
  top: 24px;
  left: 28px;
  display: block;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  text-shadow: 0 2px 8px #000;
  max-width: 43%;
}
.narrative-heading small {
  color: #d8c39a;
  letter-spacing: 3px;
}
.narrative-heading h2 {
  font-size: clamp(22px, 2vw, 32px);
  margin: 6px 0 12px;
  font-weight: 500;
}
.narrative-heading button {
  padding: 7px 12px;
  background: #132b25d9;
  border: 1px solid #bca26b88;
  color: inherit;
}
.narrative-goal {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 260px;
  padding: 0 14px;
  border-right: 2px solid #bca26b;
  text-shadow: 0 2px 7px #000;
}
.narrative-goal > span {
  font-size: 12px;
  color: #e8d09a;
}
.narrative-goal p {
  font-size: 14px;
  line-height: 1.7;
  margin: 6px 0;
}
.narrative-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  background: transparent;
  border: 0;
  color: #fff0c7;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  min-height: 44px;
  cursor: pointer;
  text-shadow: 0 2px 6px #000;
}
.narrative-hotspot > span {
  font-size: 26px;
  filter: drop-shadow(0 0 4px #d3ba84);
}
.narrative-hotspot strong {
  background: #102b24db;
  border-bottom: 1px solid #c2a974;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 500;
}
.narrative-hotspot[aria-pressed="true"] > span {
  color: #fff;
}
.narrative-hotspot:focus-visible,
.narrative-stage button:focus-visible {
  outline: 2px solid #f2d291;
  outline-offset: 3px;
}
.narrative-inspector {
  position: absolute;
  right: 22px;
  top: 150px;
  bottom: 22px;
  width: min(420px, 40%);
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  padding: 20px;
  background: #102720f5;
  backdrop-filter: blur(12px);
  border: 1px solid #ad976877;
  box-shadow: 0 12px 45px #0008;
  z-index: 3;
}
.narrative-inspector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.narrative-inspector-heading h3 {
  margin: 0;
  color: #e3c891;
  font-size: 17px;
}
.narrative-inspector-heading button {
  min-width: 34px;
  min-height: 34px;
  border: 1px solid #8b946b;
  background: transparent;
  color: #f2ead7;
}
.narrative-inspector :deep(p) {
  font-size: 14px;
  line-height: 1.7;
}
.narrative-inspector :deep(button) {
  max-width: 100%;
  white-space: normal;
  color: #f4ead1;
  background: #294839;
  border: 1px solid #a59060;
  padding: 10px 12px;
  min-height: 40px;
  cursor: pointer;
}
.narrative-inspector :deep(button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
.narrative-inspector :deep(.fineprint),
.narrative-inspector :deep(.muted),
.narrative-inspector :deep(small) {
  color: #d2cbb5;
}
.narrative-inspector :deep(h4),
.narrative-inspector :deep(h3) {
  color: #e7cd94;
}
.narrative-inspector :deep(img) {
  max-width: 100%;
}
.narrative-inspector :deep(.scene-controls) {
  width: auto;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  position: static;
}
.narrative-inspector :deep(details) {
  margin: 10px 0;
}
.narrative-inspector :deep(summary) {
  cursor: pointer;
}
.battle-inspector {
  width: min(600px, 48%);
  top: 100px;
}
.narrative-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16px;
  text-align: center;
  font-size: 12px;
  color: #e5d9bf;
  text-shadow: 0 2px 6px #000;
}
@media (min-width: 1000px) {
  .narrative-world {
    width: 100%;
    height: 100%;
  }
}
@media (max-width: 900px) {
  .narrative-stage {
    min-height: 640px;
  }
  .narrative-goal {
    width: 180px;
    right: 12px;
  }
  .narrative-heading {
    left: 16px;
  }
  .narrative-inspector,
  .battle-inspector {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 44%;
    padding: 14px;
  }
  .narrative-hotspot strong {
    font-size: 12px;
  }
}
.narrative-overview {
  display: contents;
}
@media (max-width: 600px) {
  .narrative-overview {
    display: grid;
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    gap: 8px;
    max-height: 36%;
    overflow: auto;
  }
  .narrative-overview .narrative-heading,
  .narrative-overview .narrative-goal {
    position: static;
    max-width: none;
    width: auto;
    margin: 0;
  }
  .narrative-overview .narrative-heading h2 {
    font-size: 20px;
    margin: 4px 0;
  }
  .narrative-overview .narrative-goal {
    background: #10251ee6;
    padding: 8px 12px;
  }
}
</style>
