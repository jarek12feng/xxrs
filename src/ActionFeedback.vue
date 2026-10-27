<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import type { ActionReceipt } from "./action-feedback";
const props = defineProps<{ receipt: ActionReceipt; expanded?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const playing = ref(!!props.expanded);
const heading = ref<HTMLElement>();
let timer: ReturnType<typeof setTimeout> | undefined;
function reveal() {
  clearTimeout(timer);
  playing.value = false;
  void nextTick(() => heading.value?.focus());
}
function escape(e: KeyboardEvent) {
  if (!props.expanded || e.key !== "Escape") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (playing.value) reveal();
  else emit("close");
}
onMounted(() => {
  if (!props.expanded) return;
  heading.value?.focus();
  document.addEventListener("keydown", escape, true);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) reveal();
  else timer = setTimeout(reveal, 1400);
});
onUnmounted(() => {
  clearTimeout(timer);
  document.removeEventListener("keydown", escape, true);
});
const ritualText = {
  break: ["气聚丹田", "周天合一 · 叩问天关", "境"],
  refine: ["丹火初燃", "投药 · 控火 · 凝丹", "丹"],
  retreat: ["山门暂掩", "静息凝神 · 温养根基", "静"],
  forge: ["灵纹初现", "淬炼 · 铭纹 · 成器", "器"],
  challenge: ["屏息迎敌", "审势 · 破阵 · 应战", "战"],
};
</script>

<template>
  <section
    :class="['action-feedback', { expanded, playing }]"
    :data-tone="playing ? 'neutral' : receipt.tone"
    :data-ritual="receipt.ritual"
    :role="expanded ? 'dialog' : 'status'"
    :aria-modal="expanded ? true : undefined"
    :aria-labelledby="expanded ? 'feedback-title' : undefined"
    aria-live="polite"
  >
    <div v-if="expanded" class="ritual-sky" aria-hidden="true">
      <div class="ritual-orbit"></div>
      <div class="ritual-orbit inner"></div>
      <span class="ritual-seal">{{
        ritualText[receipt.ritual || "retreat"][2]
      }}</span
      ><i class="ritual-spark one"></i><i class="ritual-spark two"></i
      ><i class="ritual-spark three"></i>
    </div>
    <div class="receipt-body">
      <span class="eyebrow">{{
        playing ? "一念入境" : "行动结果 · 已自动保存"
      }}</span>
      <h2
        ref="heading"
        :id="expanded ? 'feedback-title' : undefined"
        :tabindex="expanded ? -1 : undefined"
      >
        {{
          playing ? ritualText[receipt.ritual || "retreat"][0] : receipt.title
        }}
      </h2>
      <template v-if="playing">
        <p class="ritual-caption">
          {{ ritualText[receipt.ritual || "retreat"][1] }}
        </p>
        <div class="ritual-track"><i></i></div>
        <button class="secondary full" @click="reveal">
          跳过演出 · 查看结果
        </button>
        <small class="muted">结果已保存，演出不会再次消耗材料。</small>
      </template>
      <template v-else>
        <p v-if="receipt.months" class="receipt-time">
          此行经过 {{ receipt.months }} 个月
        </p>
        <p v-if="expanded" class="receipt-cost">{{ receipt.cost }}</p>
        <ul v-if="receipt.changes.length" class="receipt-changes">
          <li
            v-for="change in receipt.changes"
            :key="change.label"
            :class="{ gain: change.good }"
          >
            <span>{{ change.label }}</span
            ><strong
              >{{ change.after > change.before ? "+" : "−"
              }}{{ Math.abs(change.after - change.before) }}</strong
            ><small>{{ change.before }} → {{ change.after }}</small>
          </li>
        </ul>
        <p v-else class="muted">本次没有资源或属性净变化。</p>
        <template v-if="expanded"
          ><p
            v-for="(note, index) in receipt.notes"
            :key="index"
            class="receipt-note"
          >
            {{ note }}
          </p>
          <p class="receipt-next">{{ receipt.next }}</p>
          <button class="primary full" @click="emit('close')">
            知晓结果 · 继续
          </button></template
        >
        <template v-else
          ><p class="receipt-brief">{{ receipt.notes[0] || receipt.next }}</p>
          <button
            class="quiet"
            aria-label="收起行动回执"
            @click="emit('close')"
          >
            收起
          </button></template
        >
      </template>
    </div>
  </section>
</template>

<style>
.feedback-layer {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #05100de8;
  backdrop-filter: blur(9px);
}
.action-feedback {
  --feedback-accent: #b8d9cb;
  border: 1px solid #789b855e;
  background: #12241f;
  color: #e8eee6;
  box-shadow: 0 12px 50px #0007;
  border-radius: 14px;
  overflow: hidden;
}
.action-feedback.expanded {
  width: min(580px, 100%);
  max-height: calc(100dvh - 40px);
  overflow: auto;
  animation: receipt-enter 0.28s ease-out;
}
.action-feedback[data-tone="success"] {
  --feedback-accent: #edcc82;
}
.action-feedback[data-tone="warning"] {
  --feedback-accent: #e8a58d;
}
.receipt-body {
  padding: 24px;
}
.action-feedback h2 {
  font-size: 25px;
  color: var(--feedback-accent);
  margin: 10px 0 16px;
}
.action-feedback .eyebrow {
  color: #a5bdaf;
}
.action-feedback .muted {
  color: #b1c1b9;
}
.ritual-sky {
  height: 160px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at center, #c5a66030, transparent 65%),
    linear-gradient(#07151099, #12241f),
    url("/scenes/moon-terrace.png") center 45% / cover;
}
.ritual-orbit {
  position: absolute;
  width: 125px;
  height: 125px;
  border: 1px solid var(--feedback-accent);
  border-radius: 50%;
  box-shadow: 0 0 25px #ddbc6c22;
  transform: rotateX(45deg) rotateZ(20deg);
}
.ritual-orbit.inner {
  width: 95px;
  height: 95px;
  transform: rotateX(-35deg) rotateZ(-20deg);
  border-style: dashed;
}
.ritual-seal {
  font: 48px serif;
  color: var(--feedback-accent);
  text-shadow: 0 0 24px var(--feedback-accent);
}
.playing .ritual-orbit {
  animation: ritual-spin 2s linear infinite;
}
.playing .ritual-orbit.inner {
  animation-direction: reverse;
}
.playing .ritual-seal {
  animation: ritual-breathe 1.2s ease-in-out infinite alternate;
}
[data-ritual="refine"] .ritual-sky {
  background:
    radial-gradient(ellipse at 50% 90%, #b96b275e, transparent 65%), #17211d;
}
[data-ritual="refine"] .ritual-seal {
  border: 2px solid #dcad69;
  border-radius: 18% 18% 45% 45%;
  padding: 8px 24px;
  font-size: 38px;
}
.ritual-spark {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #f4d999;
  border-radius: 50%;
  left: 35%;
  top: 70%;
  box-shadow: 0 0 12px #f7df8b;
}
.two {
  left: 63%;
  top: 60%;
}
.three {
  left: 48%;
  top: 35%;
}
.playing .ritual-spark {
  animation: ritual-rise 1.3s ease-out infinite;
}
.playing .two {
  animation-delay: 0.4s;
}
.playing .three {
  animation-delay: 0.7s;
}
.action-feedback[data-tone="warning"] .ritual-sky {
  background: radial-gradient(ellipse, #7b3a3144, transparent 75%), #141b1c;
}
.action-feedback[data-tone="success"] .ritual-seal {
  animation: receipt-enter 0.5s ease-out;
}
.action-feedback[data-tone="success"] .ritual-orbit {
  animation: ritual-bloom 0.8s ease-out;
}
.action-feedback[data-tone="warning"] .ritual-seal {
  animation: ritual-recoil 0.45s ease-out;
}
.action-feedback[data-tone="warning"] .ritual-orbit {
  border-style: dashed;
  opacity: 0.5;
}
.receipt-changes {
  list-style: none;
  margin: 16px 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.receipt-changes li {
  padding: 10px 12px;
  background: #ffffff08;
  border: 1px solid #ffffff0e;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px;
  color: #e7ad97;
}
.receipt-changes li.gain {
  color: #b9dbb8;
}
.receipt-changes li span {
  color: #d6e0d7;
  font-size: 13px;
}
.receipt-changes small {
  grid-column: 1/-1;
  color: #aebfb4;
  font-size: 12px;
}
.receipt-cost,
.receipt-time {
  font-size: 13px;
  color: #b1c1b9;
  line-height: 1.7;
}
.receipt-note {
  font-size: 14px;
  line-height: 1.8;
  color: #d8dfd5;
}
.receipt-next {
  border-left: 2px solid var(--feedback-accent);
  padding: 8px 12px;
  background: #ffffff06;
  font-size: 14px;
  line-height: 1.7;
}
.ritual-caption {
  color: #c2d4c9;
  letter-spacing: 3px;
}
.ritual-track {
  height: 2px;
  background: #ffffff12;
  margin: 28px 0;
}
.ritual-track i {
  display: block;
  height: 100%;
  background: #dec181;
  animation: ritual-progress 1.4s ease-out forwards;
}
.playing .receipt-body > small {
  display: block;
  text-align: center;
  margin-top: 12px;
}
.receipt-dock {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: min(370px, calc(100vw - 32px));
  z-index: 45;
  pointer-events: none;
}
.receipt-dock .action-feedback {
  pointer-events: auto;
  max-height: 40dvh;
  overflow: auto;
  animation: receipt-enter 0.22s ease-out;
}
.receipt-dock .receipt-body {
  padding: 14px 18px;
}
.receipt-dock h2 {
  font-size: 18px;
  margin: 6px 0;
}
.receipt-dock .receipt-changes {
  margin: 10px 0;
  gap: 5px;
}
.receipt-dock .receipt-changes li {
  padding: 6px 9px;
}
.receipt-dock .receipt-changes small {
  display: none;
}
.receipt-dock .receipt-brief {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.receipt-brief {
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
}
.receipt-dock .quiet {
  min-height: 44px;
  color: #c5d8cb;
}
.saving-pulse {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  padding: 12px 20px;
  border-radius: 24px;
  background: #21382f;
  color: #f1e3bf;
  border: 1px solid #baad7477;
}
@keyframes ritual-spin {
  to {
    transform: rotateX(45deg) rotateZ(380deg);
  }
}
@keyframes ritual-bloom {
  from {
    opacity: 0;
    scale: 0.65;
    box-shadow: 0 0 50px #f7df8b88;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}
@keyframes ritual-recoil {
  25% {
    transform: translateX(-5px);
  }
  60% {
    transform: translateX(4px);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes ritual-breathe {
  to {
    opacity: 0.6;
    transform: scale(0.9);
  }
}
@keyframes ritual-rise {
  to {
    transform: translateY(-75px);
    opacity: 0;
  }
}
@keyframes ritual-progress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
@keyframes receipt-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 600px) {
  .feedback-layer {
    padding: 12px;
  }
  .action-feedback.expanded {
    max-height: calc(100dvh - 24px);
  }
  .receipt-body {
    padding: 18px;
  }
  .ritual-sky {
    height: 130px;
  }
  .receipt-dock {
    right: 12px;
    bottom: calc(80px + env(safe-area-inset-bottom));
    width: min(340px, calc(100vw - 24px));
  }
  .action-feedback h2 {
    font-size: 22px;
  }
  .receipt-dock h2 {
    font-size: 17px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .action-feedback,
  .action-feedback * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
