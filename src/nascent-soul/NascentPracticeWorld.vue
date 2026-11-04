<script setup lang="ts">
import { computed } from "vue";
import { nascentTrialPreview } from "./rules";
import type { State } from "../world";
import { characterArt, heroArt } from "../presentation/art";
const props = defineProps<{ game: State }>();
const n = computed(() => props.game.nascentSoul);
const pressure = computed(
  () => nascentTrialPreview(props.game, "body")?.pressure,
);
const phase = computed(() => n.value.attempt?.phase ?? -1);
const seals = computed(
  () => n.value.trial?.seals ?? (n.value.trialWon ? 6 : 0),
);
const marks = Array.from({ length: 6 }, (_, i) => ({
  x: 160 + Math.cos((i * Math.PI) / 3 - Math.PI / 2) * 125,
  y: 160 + Math.sin((i * Math.PI) / 3 - Math.PI / 2) * 125,
}));
</script>
<template>
  <div
    class="practice-world"
    :class="{
      unstable: !!n.attempt && n.attempt.stability <= 3,
      recovering: !n.attempt && game.injury > 0 && n.failures > 0,
    }"
    :data-phase="phase"
  >
    <div
      v-if="n.land !== 'none'"
      class="ground-ring"
      :class="{ protected: n.protection !== 'none' }"
      aria-hidden="true"
    ></div>
    <img
      class="seated-hero"
      :src="characterArt(heroArt(game.social.gender, game.realm), 'meditate')"
      alt="你在静室盘膝行功"
    />
    <div
      v-if="n.trial"
      :key="n.trial.turn"
      class="trial-pressure"
      :class="`pressure-${n.trial.turn % 3}`"
      aria-hidden="true"
    ></div>
    <svg
      v-if="n.trial || n.trialWon"
      class="six-seals"
      viewBox="0 0 320 320"
      role="img"
      :aria-label="`六道禁印，已破${seals}印`"
    >
      <circle
        cx="160"
        cy="160"
        r="125"
        fill="none"
        stroke="currentColor"
        stroke-dasharray="4 12"
      />
      <g
        v-for="(mark, i) in marks"
        :key="i"
        :class="{ broken: i < seals }"
        :data-seal="i + 1"
        :data-broken="i < seals"
      >
        <path :d="`M ${mark.x} ${mark.y - 21} l 21 21 l -21 21 l -21 -21 Z`" />
        <text :x="mark.x" :y="mark.y + 6" text-anchor="middle">
          {{ i + 1 }}
        </text>
      </g>
    </svg>
    <div
      v-if="n.attempt"
      :key="phase"
      class="channeling-flow"
      :class="`phase-${phase}`"
      aria-hidden="true"
    >
      <i></i><i></i><i></i><b></b>
    </div>
    <div class="preparation-objects" aria-label="静室药匣">
      <figure v-if="n.marrow">
        <img src="/art/items/vial.webp" alt="封存归潮灵髓的药瓶" />
        <figcaption>归潮灵髓 ×{{ n.marrow }}</figcaption>
      </figure>
      <figure v-if="game.lizhao.reagent">
        <img src="/art/items/vial-refined.webp" alt="离照定性辅药瓶" />
        <figcaption>定性辅药 ×{{ game.lizhao.reagent }}</figcaption>
      </figure>
      <figure v-if="n.pills">
        <img src="/art/items/clarity-pill.webp" alt="封存化婴丹的青瓷丹瓶" />
        <figcaption>化婴丹 ×{{ n.pills }}</figcaption>
      </figure>
      <span v-if="n.attempt" class="consumed-pill">化婴丹已服 · 丹瓶收空</span>
    </div>
    <div class="practice-readout" aria-live="polite">
      <template v-if="n.trial"
        ><strong>六印禁室 · 第{{ n.trial.turn + 1 }} / 6轮</strong
        ><span
          >护体 {{ n.trial.body }} · 心神 {{ n.trial.mind }} · 丹元
          {{ n.trial.power }}</span
        ><span>{{ pressure }} · 已破 {{ seals }} / 6 印</span></template
      >
      <template v-else-if="n.attempt"
        ><strong>{{ ["化丹归元", "守识凝形", "内外相合"][phase] }}</strong
        ><span
          >丹元 {{ n.attempt.flow }} · 心神 {{ n.attempt.spirit }} · 稳定
          {{ n.attempt.stability }}</span
        ><span>{{
          ["丹元散入经脉", "心神收拢，婴形渐聚", "婴形与外护相应"][phase]
        }}</span
        ><b v-if="n.attempt.stability <= 3"
          >灵流散乱 · 留意余力与稳定</b
        ></template
      >
      <template v-else-if="game.injury && n.failures"
        ><strong>调息养伤</strong
        ><span>伤势 {{ game.injury }} · 灵地与药路仍在</span></template
      >
      <template v-else
        ><strong>{{ n.trialWon ? "六印已解" : "静室待启" }}</strong
        ><span
          >{{
            n.land === "none"
              ? "灵地尚待整备"
              : n.land === "shared"
                ? "合作灵地已备"
                : "旧静室阵纹已校准"
          }}
          ·
          {{
            n.protection === "none"
              ? "护持未定"
              : n.protection === "array"
                ? "外护阵已设"
                : "轮值护持已约定"
          }}</span
        ></template
      >
    </div>
  </div>
</template>
<style scoped>
.practice-world {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.seated-hero {
  position: absolute;
  left: 25%;
  bottom: 29%;
  height: 42%;
  width: 26%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 12px 10px #0008);
}
.ground-ring {
  position: absolute;
  left: 22%;
  bottom: 25%;
  width: 32%;
  height: 13%;
  border: 2px solid #c7c2a278;
  border-radius: 50%;
  box-shadow:
    0 0 20px #e4d18c33,
    inset 0 0 20px #efdca433;
}
.ground-ring.protected {
  border: 3px double #b9edce;
  box-shadow:
    0 0 30px #99e4b755,
    inset 0 0 30px #99e4b733;
}
.trial-pressure {
  position: absolute;
  left: 23%;
  bottom: 27%;
  width: 30%;
  height: 45%;
  border-radius: 50%;
  background: radial-gradient(ellipse at bottom, #e9ab4c44, transparent 65%);
  animation: phase-arrive 0.8s ease-out;
}
.trial-pressure.pressure-1 {
  background: radial-gradient(ellipse at top, #90cce04d, transparent 65%);
}
.trial-pressure.pressure-2 {
  border: 2px dashed #ead7a199;
  background: radial-gradient(ellipse, #ecd99f22, transparent 65%);
}
.six-seals {
  position: absolute;
  left: 22%;
  bottom: 26%;
  width: 32%;
  height: 51%;
  color: #e4c882;
  overflow: visible;
}
.six-seals path {
  fill: #1b392fe6;
  stroke: currentColor;
  stroke-width: 2;
}
.six-seals text {
  fill: #fff2cf;
  font-size: 17px;
}
.six-seals g {
  transition:
    opacity 0.5s,
    filter 0.5s;
}
.six-seals .broken {
  opacity: 0.2;
  filter: grayscale(1);
}
.six-seals .broken path {
  stroke-dasharray: 5 10;
}
.channeling-flow {
  position: absolute;
  left: 27%;
  bottom: 31%;
  width: 22%;
  height: 34%;
  color: #e9c976;
  animation: phase-arrive 0.8s ease-out;
}
.channeling-flow i {
  position: absolute;
  inset: 20% 14%;
  border: 3px solid currentColor;
  border-left-color: transparent;
  border-radius: 50%;
  transform: rotate(28deg);
  box-shadow: 0 0 14px currentColor;
}
.channeling-flow i + i {
  transform: rotate(-28deg);
  inset: 32% 5%;
}
.channeling-flow i + i + i {
  inset: 40% 20%;
  transform: rotate(90deg);
}
.channeling-flow.phase-1 {
  color: #a6dcf1;
}
.phase-1 i {
  inset: 0 20% 55%;
}
.phase-1 b,
.phase-2 b {
  position: absolute;
  inset: 30% 38% 25%;
  border-radius: 45%;
  background: radial-gradient(ellipse, #fff6c9b0, transparent 70%);
  box-shadow: 0 0 30px #d5e9ba75;
}
.channeling-flow.phase-2 {
  color: #bee4bc;
}
.phase-2 i {
  inset: 0 -12%;
  border-style: double;
}
.unstable .channeling-flow {
  color: #e39172;
  opacity: 0.7;
}
.recovering .seated-hero {
  filter: saturate(0.45);
}
.preparation-objects {
  position: absolute;
  left: 6%;
  bottom: 23%;
  display: flex;
  gap: 8px;
  max-width: 22%;
  align-items: end;
}
.preparation-objects figure {
  margin: 0;
  text-align: center;
  max-width: 90px;
}
.preparation-objects img {
  width: 58px;
  height: 70px;
  object-fit: contain;
}
.preparation-objects figcaption,
.consumed-pill {
  font-size: 12px;
  background: #10281ee8;
  padding: 4px;
  color: #fff1cb;
}
.practice-readout {
  position: absolute;
  left: 5%;
  bottom: 5%;
  width: 47%;
  padding: 12px 16px;
  background: #10291eea;
  border-left: 2px solid #cfb77d;
  color: #f6e8cb;
  display: grid;
  gap: 6px;
  font-size: 14px;
}
.practice-readout strong {
  font-size: 19px;
}
.practice-readout b {
  color: #ffd9a8;
}
@keyframes phase-arrive {
  from {
    opacity: 0.25;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
@media (max-width: 900px) {
  .seated-hero {
    bottom: 46%;
    height: 29%;
  }
  .six-seals {
    bottom: 43%;
    height: 33%;
  }
  .channeling-flow {
    bottom: 46%;
    height: 25%;
  }
  .ground-ring {
    bottom: 44%;
  }
  .preparation-objects {
    bottom: 48%;
    left: 2%;
  }
  .practice-readout {
    bottom: 46%;
    left: 54%;
    width: 40%;
    padding: 8px;
    font-size: 12px;
  }
  .practice-readout strong {
    font-size: 14px;
  }
}
</style>
