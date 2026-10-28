<script setup lang="ts">
import type { Expedition } from "./rules";
defineProps<{
  quest: Expedition;
  foe: string;
  playerMax?: number;
  enemyMax?: number;
  telegraph?: string;
}>();
</script>
<template>
  <div
    class="battle-stage"
    :class="quest.effect"
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
      <g class="hero" transform="translate(135 0)">
        <ellipse cx="0" cy="157" rx="43" ry="7" fill="#101f1c" />
        <path d="M-11 76 L-39 151 Q0 165 36 151 L12 76Z" fill="#b6c7a0" />
        <path
          d="M0 85 L-4 155 M-11 95 L-31 128 M10 95 L42 107"
          fill="none"
          stroke="#e5d7b6"
          stroke-width="9"
        />
        <circle cy="58" r="18" fill="#dfc5a0" />
        <path d="M-19 58 Q-20 23 13 37 L22 70 L12 46 L-11 46Z" fill="#172321" />
        <path d="M-9 58 L-5 58 M5 58 L9 58" stroke="#34453d" stroke-width="2" />
        <path
          d="M-17 103 L17 109 M-19 110 L12 116"
          stroke="#526b53"
          stroke-width="5"
        />
        <path
          d="M-18 149 L-25 157 H-6 M12 150 L22 158 H6"
          fill="none"
          stroke="#1a2c27"
          stroke-width="5"
        />
        <path
          class="blade"
          d="M39 107 L98 69"
          stroke="#fff0b6"
          stroke-width="5"
        />
        <ellipse
          class="shield"
          cx="25"
          cy="100"
          rx="45"
          ry="62"
          fill="none"
          stroke="#9ee1d1"
          stroke-width="4"
        />
      </g>
      <g class="enemy" transform="translate(460 0)">
        <ellipse cx="0" cy="159" rx="48" ry="7" fill="#101f1c" />
        <g v-if="foe === '蚀阵傀儡'" class="golem">
          <path
            d="M-27 69 L-39 113 L-29 139 L-34 157 L-8 157 L0 130 L9 157 L36 157 L28 130 L39 106 L27 69Z"
            fill="#778b80"
            stroke="#b2b9a0"
            stroke-width="2"
          />
          <path
            d="M-27 76 L-52 92 L-63 126 L-45 134 L-28 103 M28 76 L49 90 L63 127 L45 133 L28 105"
            fill="#536b63"
            stroke="#93a591"
            stroke-width="3"
          />
          <path d="M-20 38 L0 28 L21 39 L16 65 L-17 65Z" fill="#9ca38c" />
          <path
            d="M-13 49 L-4 53 M5 53 L14 49"
            stroke="#ffc581"
            stroke-width="4"
          />
          <path d="M0 78 L13 97 L0 115 L-13 97Z" fill="#e5ac5f" class="core" />
          <path
            d="M-22 77 L-9 87 M24 78 L10 88 M-18 117 L-3 122 L12 116"
            stroke="#334e47"
            stroke-width="3"
            fill="none"
          />
        </g>
        <g v-else class="raider">
          <path
            d="M-16 70 L-35 146 L-10 139 L-9 158 L5 158 L9 134 L20 157 L34 157 L25 125 L19 72Z"
            fill="#33404a"
            stroke="#758785"
            stroke-width="2"
          />
          <path
            d="M-18 79 L-44 101 L-64 80 M18 80 L31 110"
            stroke="#5e706c"
            stroke-width="13"
            fill="none"
          />
          <path d="M-66 84 Q-108 39 -90 21 L-58 75Z" fill="#d1d5bc" />
          <path d="M-22 67 L-25 48 Q0 9 23 48 L22 69Z" fill="#273137" />
          <path d="M-12 48 H12 L9 57 H-10Z" fill="#d3b68b" />
          <path d="M-20 64 Q0 51 20 64 L11 76 H-12Z" fill="#495854" />
          <path d="M-17 99 L23 106" stroke="#b59363" stroke-width="6" />
        </g>
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
[data-tell="strike"] .core {
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
    animation: hit 0.65s 0.15s;
  }
  .strike .wave {
    opacity: 1;
  }
}
</style>
