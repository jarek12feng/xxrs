<script setup lang="ts">
import { computed } from "vue";
import type { State } from "./core";
import { preparationValues } from "./cultivation-feedback";
const props = defineProps<{ game: State; pill: boolean }>();
const choices = computed(() => preparationValues(props.game, props.pill));
</script>
<template>
  <details class="preparation-values">
    <summary>继续准备，实际能增加多少把握？</summary>
    <ul>
      <li v-for="choice in choices" :key="choice.key">
        <strong
          >{{ choice.title }}：{{
            choice.gain > 0 ? `+${choice.gain} 个百分点` : "不再提高当前把握"
          }}</strong
        >
        <small>{{ choice.cost }}。{{ choice.unavailable }}</small>
      </li>
    </ul>
    <p>
      各项单独对照当前丹药勾选与属性，增幅不能直接相加；成功率最多
      95%。这里只比较突破把握，养伤与固本也影响交锋。跨月可能遇到剧情或约期，操作前仍需确认。
    </p>
  </details>
</template>
<style scoped>
.preparation-values {
  margin: 12px 0;
}
li {
  margin: 10px 0;
}
small {
  display: block;
}
p,
small {
  line-height: 1.7;
}
</style>
