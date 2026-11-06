<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { createFrameClock } from "../actor-action/frame-clock";
import { observeActionEnvironment } from "../actor-action/environment";
import { measurePath, pointAt, type MapPoint } from "./path";
const props = withDefaults(
  defineProps<{
    points: MapPoint[];
    image: string;
    mode: "walk" | "flight" | "sail";
    walkSheet?: string;
    playing: boolean;
    duration?: number;
    progress?: number;
  }>(),
  { duration: 6500, progress: 0 },
);
const emit = defineEmits<{ finished: [] }>();
const progress = ref(props.progress),
  paused = ref(false),
  reduced = ref(false);
const sheetReady = ref(false),
  sheetFailed = ref(false);
watch(
  () => props.walkSheet,
  () => {
    sheetReady.value = false;
    sheetFailed.value = false;
  },
);
const gait = computed(
  () => Math.floor((progress.value * props.duration) / 100) % 8,
);
const walking = computed(
  () =>
    props.mode === "walk" &&
    props.playing &&
    !reduced.value &&
    sheetReady.value &&
    !sheetFailed.value,
);
const lift = computed(() =>
  props.mode === "flight"
    ? -18 * Math.min(1, progress.value * 8, (1 - progress.value) * 8)
    : 0,
);
const path = computed(() => measurePath(props.points));
const position = computed(() => pointAt(path.value, progress.value));
let finished=false;
let environment:ReturnType<typeof observeActionEnvironment>|undefined;
const clock=createFrameClock({
 request:callback=>requestAnimationFrame(callback),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now(),
 advance:elapsed=>{
  progress.value=Math.min(1,progress.value+elapsed/Math.max(1,props.duration));
  if(progress.value>=1){finish();return false;}
  return true;
 },
});
const stop=clock.stop;
function finish() {
  if(finished)return;
  finished=true;
  stop();
  progress.value = 1;
  emit("finished");
}
function sync() {
  stop();
  if (!props.playing || document.hidden) return;
  if (reduced.value) {
    finish();
    return;
  }
  if (!paused.value && !document.hidden && progress.value < 1)
    clock.start();
}
function pause() {
  paused.value = !paused.value;
  sync();
}
watch(
  () => [props.progress, ...props.points.flatMap(point=>[point.x,point.y])],
  (next,previous) => {
    if(next.length===previous.length && next.every((value,index)=>value===previous[index]))return;
    finished=false;
    progress.value = props.progress;
    paused.value = false;
    sync();
  },
);
watch(
  () => props.playing,
  (playing) => {
    if (playing) {
      finished=false;
      progress.value = props.progress;
      paused.value = false;
    }
    sync();
  },
);
onMounted(() => {
  environment=observeActionEnvironment(()=>{
    stop();
    // Escape pauses locally; background resumes from this same visual progress.
    if(!document.hidden && !reduced.value)paused.value=true;
  },state=>{
    reduced.value=state.reduced;
    // Environment interruption follows notification. Resume on foreground only.
    if(!state.hidden)sync();
  });
});
onUnmounted(() => { clock.dispose(); environment?.dispose(); });
defineExpose({ finish, pause });
</script>
<template>
  <g
    :transform="`translate(${position.x} ${position.y})`"
    class="path-traveler"
    :data-mode="mode"
    aria-hidden="true"
  >
    <ellipse cy="4" rx="16" ry="5" fill="#102c2390" />
    <g :transform="`translate(0 ${lift})`">
      <path
        v-if="mode === 'flight'"
        d="M-28 0 L23 -3 L33 0 L23 3 Z"
        fill="#e6eed7"
        stroke="#8eb5b1"
        stroke-width="2"
      />
      <path
        v-if="mode === 'sail'"
        d="M-34 0 Q0 30 34 0 Z M-36 13 Q-15 20 0 14 T36 14"
        fill="#bca477"
        stroke="#a2d4dc"
        stroke-width="2"
      />
      <svg
        v-if="walkSheet && mode === 'walk'"
        v-show="walking"
        x="-25"
        y="-67"
        width="50"
        height="67"
        :viewBox="`${(gait % 4) * 100} ${Math.floor(gait / 4) * 134} 100 134`"
        :transform="`scale(${position.facing} 1)`"
        overflow="hidden"
      >
        <image
          :href="walkSheet"
          width="400"
          height="268"
          preserveAspectRatio="none"
          @load="sheetReady = true"
          @error="sheetFailed = true"
        />
      </svg>
      <image
        v-show="!walking"
        :href="image"
        x="-25"
        y="-67"
        width="50"
        height="67"
        :transform="`scale(${position.facing} 1)`"
      />
    </g>
  </g>
</template>
