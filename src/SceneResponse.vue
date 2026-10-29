<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { ActionReceipt } from "./action-feedback";
const props = defineProps<{ text: string; receipt?: ActionReceipt | null }>();
const response = ref<HTMLElement>();
watch(
  () => props.receipt,
  async (value, old) => {
    // Same-scene replies must come into view, without jumping to the top of a long scene.
    if (!value?.scene || value.scene.from !== value.scene.to || value === old)
      return;
    await nextTick();
    response.value?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  },
);
</script>
<template>
  <section
    v-if="
      text ||
      receipt?.scene?.body ||
      receipt?.scene?.unlocks.length ||
      receipt?.changes.length
    "
    ref="response"
    :key="receipt?.scene?.body || text"
    class="scene-response"
    :data-tone="receipt?.tone"
    role="status"
    aria-live="polite"
  >
    <span class="eyebrow">{{ receipt?.title || "方才发生的事" }}</span>
    <p>{{ receipt?.scene?.body || text }}</p>
    <p v-if="receipt?.person" class="reply-person">
      {{ receipt.person.name }}：“{{ receipt.person.response }}”
    </p>
    <ul
      v-if="(receipt?.scene?.unlocks || receipt?.unlocks)?.length"
      class="discovery-chips"
    >
      <li
        v-for="item in receipt?.scene?.unlocks || receipt?.unlocks"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
    <div v-if="receipt?.changes.length" class="scene-deltas">
      <span v-for="c in receipt.changes" :key="c.label"
        >{{ c.label }} {{ c.after > c.before ? "+" : "−"
        }}{{ Math.abs(c.after - c.before) }}</span
      >
    </div>
  </section>
</template>
<style>
.scene-response {
  margin-top: 20px;
  padding: 16px;
  border-left: 2px solid #d5bd7e;
  background: #0c1d18b8;
  scroll-margin: 70px 0 20px;
  animation: response-reveal 0.35s ease-out;
  color: #f0ebd5;
}
.scene-response .eyebrow {
  color: #d7c48d;
}
.scene-response p {
  font-size: 15px;
  line-height: 1.85;
  margin: 10px 0 0;
}
.scene-response[data-tone="warning"] {
  border-color: #e9a18a;
}
.discovery-chips {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.discovery-chips li {
  padding: 7px 10px;
  border: 1px solid #d4c58e66;
  background: #bfa35814;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
}
.scene-deltas {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  color: #bfe0c6;
  font-size: 13px;
}
@keyframes response-reveal {
  from {
    opacity: 0.3;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .scene-response {
    animation: none;
  }
}
</style>
