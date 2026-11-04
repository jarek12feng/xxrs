<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import type { TribulationPresentation } from "./presentation";
const props = defineProps<{ scene: TribulationPresentation }>();
const emit = defineEmits<{ performing: [value: boolean] }>();
const playing = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function finish() {
  clearTimeout(timer);
  playing.value = false;
  emit("performing", false);
}
watch(
  () => props.scene.result?.serial,
  () => {
    finish();
    if (!props.scene.result) return;
    playing.value = true;
    emit("performing", true);
    timer = setTimeout(finish, 1300);
  },
);
onBeforeUnmount(finish);
</script>
<template>
  <div
    class="thunder-world"
    :class="{ playing, cleared: scene.cleared }"
    :style="{
      '--light':
        (playing ? scene.result?.color : scene.phase?.color) || '#a6ecff',
    }"
  >
    <div class="cloud-ring" aria-hidden="true"></div>
    <img
      class="thunder-hero"
      :src="playing ? scene.result?.hero || scene.hero : scene.hero"
      alt="渡劫中的主角"
    />
    <img
      v-if="playing"
      :key="scene.result?.serial"
      class="bolt"
      :src="scene.assets.strike"
      alt=""
    />
    <img v-if="playing" class="impact" :src="scene.assets.impact" alt="" />
    <img
      v-if="playing && scene.result?.ward"
      class="ward"
      :src="scene.assets.ward"
      alt=""
    />
    <div v-if="scene.phase" class="thunder-readout" aria-live="polite">
      <small>{{ scene.phase.title }} · 第{{ scene.phase.turn }}合</small
      ><strong>{{ scene.phase.signal }}</strong>
      <p>{{ scene.phase.tell }}</p>
      <label
        >气势 {{ scene.phase.hp }} / {{ scene.phase.maxHp
        }}<meter :value="scene.phase.hp" :max="scene.phase.maxHp"
      /></label>
      <label
        >雷势 {{ scene.phase.pressure
        }}<meter :value="scene.phase.pressure" :max="scene.phase.maxPressure"
      /></label>
    </div>
    <div v-else-if="scene.cleared" class="thunder-readout victory">
      <strong>{{ scene.victoryTitle }}</strong>
      <p>{{ scene.victoryText }}</p>
    </div>
    <div v-if="playing && scene.result" class="exchange">
      {{ scene.result.label
      }}<small
        >雷势 −{{ scene.result.damage }} · 承伤
        {{ scene.result.incoming }}</small
      >
    </div>
    <button v-if="playing" class="skip" @click="finish">略过演出</button>
  </div>
</template>
<style scoped>
.thunder-world {
  position: absolute;
  inset: 0;
  --light: #a6ecff;
  pointer-events: none;
}
.thunder-hero {
  position: absolute;
  left: 30%;
  bottom: 22%;
  width: 19%;
  height: 44%;
  object-fit: contain;
  filter: drop-shadow(0 12px 13px #000b);
  z-index: 2;
}
.cloud-ring {
  position: absolute;
  left: 13%;
  top: 3%;
  width: 49%;
  height: 27%;
  border-radius: 50%;
  box-shadow: inset 0 -15px 50px #658d9b33;
  animation: gather 5s ease-in-out infinite;
}
.bolt {
  position: absolute;
  left: 28%;
  top: -6%;
  height: 100%;
  width: 23%;
  object-fit: contain;
  z-index: 4;
  animation: fall 1.3s both;
  filter: drop-shadow(0 0 16px var(--light));
}
.impact {
  position: absolute;
  left: 16%;
  bottom: 15%;
  width: 50%;
  height: 26%;
  object-fit: contain;
  z-index: 3;
  animation: impact 1.3s both;
}
.ward {
  position: absolute;
  left: 25%;
  bottom: 19%;
  height: 50%;
  width: 29%;
  object-fit: contain;
  z-index: 3;
  animation: ward 1.3s both;
}
.thunder-readout {
  position: absolute;
  left: 4%;
  bottom: 4%;
  width: 25%;
  padding: 16px 20px;
  background: #101c29e6;
  border-left: 2px solid var(--light);
  color: #f4edd9;
}
.thunder-readout strong {
  display: block;
  font-size: 24px;
  margin: 5px 0;
}
.thunder-readout p {
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.6;
}
.thunder-readout label {
  display: block;
  font-size: 13px;
  margin-top: 6px;
}
.thunder-readout meter {
  display: block;
  width: 100%;
  height: 8px;
  accent-color: #badddd;
}
.exchange {
  position: absolute;
  left: 22%;
  top: 30%;
  width: 30%;
  text-align: center;
  color: #fff3ca;
  font-size: 27px;
  text-shadow: 0 2px 8px #000;
  z-index: 5;
  animation: receipt 1.3s both;
}
.exchange small {
  display: block;
  font-size: 15px;
  margin-top: 8px;
}
.skip {
  position: absolute;
  bottom: 3%;
  left: 44%;
  pointer-events: auto;
  background: #142434df;
  color: #eee;
  border: 1px solid #acb3b7;
  padding: 8px;
  z-index: 6;
}
.cleared .cloud-ring {
  display: none;
}
.playing .thunder-hero {
  animation: brace 1.3s both;
}
@keyframes fall {
  0%,
  12% {
    opacity: 0;
    transform: translateY(-35%) scaleX(0.4);
  }
  25%,
  45% {
    opacity: 1;
    transform: translateY(0) scaleX(1);
  }
  100% {
    opacity: 0;
  }
}
@keyframes impact {
  0%,
  25% {
    opacity: 0;
    transform: scale(0.3);
  }
  45% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.12);
  }
}
@keyframes ward {
  0% {
    opacity: 0;
    transform: scale(0.75);
  }
  20%,
  60% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}
@keyframes brace {
  30% {
    transform: translateY(0);
  }
  42% {
    transform: translate(3px, 2px);
  }
  65% {
    transform: translate(0);
  }
}
@keyframes receipt {
  0%,
  30% {
    opacity: 0;
  }
  50%,
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@keyframes gather {
  50% {
    opacity: 0.5;
    transform: scale(1.08);
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
  .bolt,
  .impact {
    opacity: 0.65;
  }
  .exchange {
    opacity: 1;
  }
}
@media (max-width: 900px) {
  .thunder-readout {
    top: 21%;
    bottom: auto;
    left: 3%;
    width: 32%;
    padding: 8px;
  }
  .thunder-readout strong {
    font-size: 17px;
  }
  .thunder-hero {
    left: 39%;
    bottom: 42%;
    height: 33%;
    width: 23%;
  }
  .bolt {
    left: 39%;
    height: 65%;
  }
  .ward {
    left: 34%;
    bottom: 37%;
    height: 40%;
  }
  .impact {
    left: 25%;
    bottom: 34%;
  }
  .exchange {
    left: 37%;
    top: 20%;
  }
  .skip {
    left: 65%;
    bottom: 48%;
  }
}
</style>
