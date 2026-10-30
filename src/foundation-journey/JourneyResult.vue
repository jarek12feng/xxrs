<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  text: string;
  label?: string;
  expanded?: boolean;
}>();
const split = computed(() => {
  const end = props.text.indexOf("。");
  return end < 0
    ? { brief: props.text, rest: "" }
    : {
        brief: props.text.slice(0, end + 1),
        rest: props.text.slice(end + 1).trim(),
      };
});
</script>
<template>
  <div class="journey-result">
    <p role="status">{{ split.brief }}</p>
    <details v-if="split.rest" :key="text" :open="expanded">
      <summary>{{ label || "查看完整经过" }}</summary>
      <p>{{ split.rest }}</p>
    </details>
  </div>
</template>
<style scoped>
.journey-result {
  padding: 14px;
  background: #283d37;
  color: #f1e5c9;
  border-left: 3px solid #d8b96b;
  border-radius: 4px;
}
p {
  margin: 0.3em 0;
  line-height: 1.7;
}
summary {
  cursor: pointer;
  padding: 10px 0;
  min-height: 44px;
  box-sizing: border-box;
  color: #f1e5c9;
}
summary:focus-visible {
  outline: 2px solid #ddbe75;
  outline-offset: 2px;
}
</style>
