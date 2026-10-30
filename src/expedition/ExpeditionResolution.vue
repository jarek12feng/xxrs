<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../core";
import { expeditionResolution } from "./resolution";
const props = defineProps<{ game: State }>();
const ending = computed(() => expeditionResolution(props.game));
</script>
<template>
  <section
    v-if="ending"
    class="expedition-resolution"
    aria-label="名单真相与同行回应"
  >
    <span class="eyebrow">筑基之后 · 旧路新行</span>
    <h3>{{ ending.title }}</h3>
    <p>{{ ending.growth }}</p>
    <p>{{ ending.discovery }}</p>
    <p>{{ ending.evidence }}</p>
    <blockquote>{{ ending.response }}</blockquote>
    <p>{{ ending.route }}</p>
    <details>
      <summary>下一条线索 · 雾海交接簿</summary>
      <p>{{ ending.next }}</p>
    </details>
  </section>
</template>
<style scoped>
.expedition-resolution {
  margin: 18px 0;
  padding: 22px;
  border: 1px solid #a99b6f;
  border-radius: 12px;
  background: #f0ebda;
  color: #293f35;
}
h3,
p,
blockquote,
summary {
  color: inherit;
}
p {
  line-height: 1.9;
}
blockquote {
  margin: 18px 0;
  padding: 12px 18px;
  border-left: 3px solid #9a8150;
  background: #e4ddc6;
}
summary {
  cursor: pointer;
}
</style>
