<script setup lang="ts">
import { computed } from "vue";
import type { State } from "./core";
import { lifeReview } from "./life-review";
const props = defineProps<{ game: State }>();
const review = computed(() => lifeReview(props.game));
</script>
<template>
  <section class="life-summary" aria-label="本世经历回顾">
    <h3>这一世，你做成了什么</h3>
    <ul>
      <li v-for="line in review.records" :key="line">{{ line }}</li>
    </ul>
    <details v-if="review.unfinished.length">
      <summary>还有哪些事未完成</summary>
      <ul>
        <li v-for="line in review.unfinished" :key="line">{{ line }}</li>
      </ul>
    </details>
    <h3>换一种人生，会有什么不同</h3>
    <ul>
      <li v-for="line in review.next" :key="line">{{ line }}</li>
    </ul>
    <p>这些尝试不要求现在重开；下一世从头修行，只携所选的一项已解锁传承。</p>
  </section>
</template>
<style scoped>
.life-summary {
  margin: 20px 0;
}
li,
p {
  line-height: 1.8;
  overflow-wrap: anywhere;
}
li {
  margin: 6px 0;
}
</style>
