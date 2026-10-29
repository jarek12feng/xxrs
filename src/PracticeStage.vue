<script setup lang="ts">
import { computed } from "vue";
import { usePageVisible } from "./presentation/usePageVisible";
const pageVisible = usePageVisible();
import type { Activity } from "./core";
import CharacterSprite from "./presentation/CharacterSprite.vue";
import ItemArt from "./presentation/ItemArt.vue";
import { heroArt, type Pose } from "./presentation/art";
const props = defineProps<{
  activity: Activity;
  playing: boolean;
  gender?: string | null;
}>();
const labels: Record<Activity, string> = {
  cultivate: "吐纳 · 周天行气",
  meditate: "凝神 · 守一观心",
  study: "研读 · 翻卷悟道",
  work: "劳作 · 松畦耕作",
  gather: "采药 · 辨草入篓",
  train: "历练 · 林间行剑",
  rest: "养伤 · 静坐调息",
};
const pose = computed<Pose>(() =>
  props.activity === "train"
    ? "attack"
    : ["work", "gather"].includes(props.activity)
      ? "idle"
      : "meditate",
);
const propItem = computed(() =>
  props.activity === "study"
    ? "spring"
    : ["work", "gather"].includes(props.activity)
      ? "herbs"
      : undefined,
);
</script>
<template>
  <section
    class="practice-stage"
    :class="[activity, { playing, 'art-paused': !pageVisible }]"
    :data-activity="activity"
    :data-playing="playing"
    aria-label="洞府人物动作"
  >
    <div class="practice-caption">
      <span>听松山居 · 修行日常</span>
      <h3>{{ labels[activity] }}</h3>
      <small role="status">{{
        playing ? "一招一息，皆是修行" : "选择修行，行功一月"
      }}</small>
    </div>
    <div class="practice-figure">
      <CharacterSprite
        :character="heroArt(gender)"
        :pose="pose"
        :label="labels[activity] + '人物场景'"
      />
    </div>
    <div v-if="propItem" class="practice-prop">
      <ItemArt :id="propItem" :size="80" />
    </div>
    <div
      v-if="activity === 'cultivate' || activity === 'meditate'"
      class="qi-ring"
      aria-hidden="true"
    />
  </section>
</template>
<style scoped>
.practice-stage {
  position: relative;
  height: 320px;
  max-width: 900px;
  margin: 0 0 18px;
  overflow: hidden;
  border: 1px solid #a59b6855;
  border-radius: 10px;
  background:
    linear-gradient(90deg, #0d261ee8, #132d2870),
    url("/scenes/moon-terrace.png") center 62% / cover;
}
.practice-caption {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 2;
  max-width: 38%;
  color: #c5d1c2;
}
.practice-caption span {
  color: #c5b58b;
  font-size: 11px;
}
.practice-caption h3 {
  font: 21px/1.6 serif;
  color: #f2e1b8;
}
.practice-figure {
  position: absolute;
  right: 10%;
  bottom: 12px;
  width: 48%;
  height: 290px;
}
.practice-prop {
  position: absolute;
  right: 6%;
  bottom: 16px;
}
.qi-ring {
  position: absolute;
  right: 12%;
  bottom: 24px;
  width: 42%;
  height: 28px;
  border: 1px solid #bad4a6;
  border-radius: 50%;
  opacity: 0.4;
  pointer-events: none;
}
.playing .qi-ring {
  animation: breathe 2s ease-in-out infinite;
}
@keyframes breathe {
  50% {
    opacity: 0.8;
    transform: scale(1.06);
  }
}
@media (max-width: 520px) {
  .practice-caption {
    left: 14px;
    max-width: 52%;
  }
  .practice-caption h3 {
    font-size: 16px;
  }
  .practice-figure {
    right: 2%;
    width: 56%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .playing .qi-ring {
    animation: none;
  }
}
.cultivation-room .practice-stage {
  position: sticky;
  top: 0;
  z-index: 2;
  flex: none;
}
.practice-stage.art-paused * {
  animation-play-state: paused !important;
}
</style>
