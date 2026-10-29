<script setup lang="ts">
import { computed } from "vue";
import { usePageVisible } from "../presentation/usePageVisible";
const pageVisible = usePageVisible();
import { characterArt, heroArt } from "../presentation/art";
import type { Expedition } from "./rules";
const props = defineProps<{
  gender?: string | null;
  quest: Expedition;
  foe: string;
  playerMax?: number;
  enemyMax?: number;
  telegraph?: string;
}>();
const hero = computed(() =>
  characterArt(
    heroArt(props.gender),
    props.quest.effect === "strike" ? "attack" : "idle",
  ),
);
const enemy = computed(() =>
  characterArt(
    props.foe === "蚀阵傀儡" ? "golem" : "raider",
    ["strike", "win"].includes(props.quest.effect)
      ? "hurt"
      : props.quest.effect === "hurt" || props.telegraph === "guard"
        ? "attack"
        : "idle",
  ),
);
</script>
<template>
  <div
    class="battle-stage"
    :class="[quest.effect, { 'art-paused': !pageVisible }]"
    :key="`${quest.attempts}-${quest.cleared}-${quest.duel?.turn}-${quest.effect}`"
    :data-foe="foe === '蚀阵傀儡' ? 'golem' : 'raider'"
    :data-tell="telegraph"
    role="group"
    :aria-label="`与${foe}交锋`"
  >
    <div v-if="quest.duel" class="meters">
      <label
        >你的气势 <strong>{{ quest.duel.hp }} / {{ playerMax }}</strong
        ><meter
          aria-label="你的气势"
          :min="0"
          :max="playerMax || 60"
          :value="quest.duel.hp"
      /></label>
      <label
        >{{ foe }} <strong>{{ quest.duel.enemy }} / {{ enemyMax }}</strong
        ><meter
          :aria-label="`${foe}气势`"
          :min="0"
          :max="enemyMax || 64"
          :value="quest.duel.enemy"
      /></label>
    </div>
    <svg viewBox="0 0 600 180" aria-hidden="true">
      <path
        d="M0 130 L90 25 L166 95 L235 38 L315 130 L420 45 L600 120 V180 H0Z"
        fill="#36524c"
        opacity=".5"
      />
      <path
        d="M0 142 Q200 78 400 139 T600 128"
        fill="none"
        stroke="#accab1"
        opacity=".15"
        stroke-width="15"
      />
      <path d="M0 152 Q160 125 300 154 T600 148 V180 H0" fill="#31493e" />
      <g class="hero">
        <image
          :href="hero"
          x="65"
          y="5"
          width="140"
          height="165"
          preserveAspectRatio="xMidYMax meet"
        />
        <ellipse
          class="shield"
          cx="140"
          cy="100"
          rx="54"
          ry="68"
          fill="none"
          stroke="#9ee1d1"
          stroke-width="3"
        />
      </g>
      <g class="enemy">
        <image
          :href="enemy"
          x="380"
          y="5"
          width="150"
          height="165"
          preserveAspectRatio="xMidYMax meet"
        />
      </g>
      <path
        class="wave"
        d="M200 125 Q280 10 386 100"
        fill="none"
        stroke="#e9d999"
        stroke-width="7"
      />
      <g class="runes" fill="#b8eadb">
        <text x="255" y="75" font-size="30">☯</text>
        <circle cx="285" cy="83" r="40" fill="none" stroke="currentColor" />
      </g>
    </svg>
    <p>
      {{
        quest.duel
          ? `你的气势 ${quest.duel.hp} · ${foe} ${quest.duel.enemy}`
          : quest.effect === "win"
            ? "关卡完成"
            : quest.effect === "loss"
              ? "退回安全处"
              : "观察来势，准备应对"
      }}
    </p>
  </div>
</template>
<style scoped>
.battle-stage {
  overflow: hidden;
  border: 1px solid #8b9c78;
  border-radius: 12px;
  background: linear-gradient(#172d30, #3a5041);
  color: #fff0c6;
}
.meters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 14px 16px 0;
  font-size: 13px;
}
.meters label {
  display: block;
  color: #f2e6c4;
}
.meters strong {
  float: right;
  font-variant-numeric: tabular-nums;
}
meter {
  display: block;
  width: 100%;
  height: 13px;
  margin-top: 6px;
}
meter::-webkit-meter-bar {
  background: #152723;
  border: 1px solid #809582;
  border-radius: 8px;
}
meter::-webkit-meter-optimum-value {
  background: linear-gradient(90deg, #639f88, #b8d5a1);
}
.meters label:last-child meter::-webkit-meter-optimum-value {
  background: linear-gradient(90deg, #a06850, #e5b478);
}
[data-tell="guard"] .enemy {
  animation: ready 1.6s ease-in-out infinite;
}
[data-tell="discern"] .enemy {
  animation: veil 1.8s ease-in-out infinite;
}
[data-tell="strike"] .enemy {
  animation: flash 1.4s infinite;
}
@keyframes ready {
  50% {
    translate: 0 -4px;
  }
}
@keyframes veil {
  50% {
    opacity: 0.55;
  }
}
svg {
  display: block;
  width: 100%;
  max-height: 230px;
}
p {
  text-align: center;
  margin: 0 0 12px;
}
.shield,
.wave,
.runes {
  opacity: 0;
}
.strike .hero {
  animation: lunge 0.65s ease-out;
}
.strike .enemy {
  animation: hit 0.65s 0.15s;
}
.strike .wave {
  animation: flash 0.7s;
}
.guard .shield {
  animation: flash 1s;
}
.discern .runes {
  animation: flash 1s;
}
.hurt .hero {
  animation: hit 0.65s;
}
.hurt .enemy {
  animation: lunge 0.6s reverse;
}
.win .enemy {
  animation: vanish 1s forwards;
}
.loss .hero {
  animation: vanish 1s forwards;
}
@keyframes lunge {
  50% {
    translate: 35px 0;
  }
}
@keyframes hit {
  30%,
  70% {
    translate: -12px 0;
    opacity: 0.45;
  }
}
@keyframes flash {
  20%,
  70% {
    opacity: 1;
  }
}
@keyframes vanish {
  to {
    opacity: 0.25;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
  .guard .shield,
  .discern .runes,
  .strike .enemy {
    animation: none;
  }
  .strike .wave {
    opacity: 1;
  }
}
.battle-stage.art-paused * {
  animation-play-state: paused !important;
}
</style>
