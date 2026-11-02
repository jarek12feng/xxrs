<script setup lang="ts">
import { computed } from "vue";
import type { State } from "./core";
import { growthPreview, type GrowthPreviewRequest } from "./growth-preview";
const props = defineProps<{
  game: State;
  request: GrowthPreviewRequest;
  compact?: boolean;
}>();
const preview = computed(() => growthPreview(props.game, props.request));
</script>
<template>
  <component
    :is="compact ? 'details' : 'section'"
    class="growth-preview"
    :aria-label="preview.title"
  >
    <summary v-if="compact">{{ preview.title }} · 查看变化</summary>
    <strong v-else>{{ preview.title }}</strong>
    <p>{{ preview.note }}</p>
    <ul v-if="preview.lines.length">
      <li v-for="line in preview.lines.slice(0, 4)" :key="line">{{ line }}</li>
    </ul>
    <p v-else>当前可比较的数值不变；特殊用途见功法或物品说明。</p>
    <details v-if="preview.lines.length > 4">
      <summary>更多效果与取舍</summary>
      <ul>
        <li v-for="line in preview.lines.slice(4)" :key="line">{{ line }}</li>
      </ul>
    </details>
    <small
      >攻守为当前境界的基础值；实际交锋还受招式、对手与临场效果影响。</small
    >
  </component>
</template>
<style scoped>
.growth-preview {
  margin: 0.75rem 0;
  padding: 0.8rem;
  border: 1px solid #887453;
  border-radius: 8px;
  background: #191e20;
  color: #f2e4cc;
  line-height: 1.65;
  overflow-wrap: anywhere;
  text-align: left;
}
.growth-preview summary {
  cursor: pointer;
}
.growth-preview p {
  margin: 0.4rem 0;
}
.growth-preview ul {
  margin: 0.5rem 0;
  padding-left: 1.3rem;
}
.growth-preview small {
  color: #d6cbb7;
}
</style>
