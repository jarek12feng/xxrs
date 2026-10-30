<script setup lang="ts">
import { computed } from "vue";
import type { State } from "./world";
import { cultivationProjection, formatLifeMonths } from "./cultivation";
const props = withDefaults(
  defineProps<{
    game: State;
    target?: number;
    months?: number;
    automatic?: boolean;
  }>(),
  { months: 3 },
);
const outlook = computed(() => cultivationProjection(props.game, props.target));
</script>
<template>
  <aside class="cultivation-outlook" aria-label="吐纳耗时与寿元">
    <p>
      剩余寿元 {{ formatLifeMonths(outlook.remainingMonths) }}。下月吐纳实际 +{{
        outlook.monthlyGain
      }}，寿元效率
      {{ Math.round(outlook.efficiency * 100) }}%。寿元减少时收益逐月下降。
    </p>
    <p v-if="outlook.missing">
      修至 {{ outlook.target }} 还差 {{ outlook.missing }}；
      <template v-if="outlook.monthsToTarget !== null"
        >预计需 {{ formatLifeMonths(outlook.monthsToTarget) }}，届时剩余寿元
        {{ formatLifeMonths(outlook.remainingAfterTarget ?? 0) }}。</template
      >
      <template v-else
        >按当前功法继续吐纳，寿尽前无法达到；可探险取得修为与功法机缘。</template
      >
    </p>
    <p v-else>
      当前修行目标已达到。
      <template v-if="game.realm === 1 && outlook.current >= 600"
        >金丹突破尚未开放，可继续原角色的行旅。</template
      >
      <template v-else-if="game.realm === 0 && outlook.current >= 360"
        >须备齐筑基丹才能尝试突破筑基。</template
      >
      <template v-else>可继续积累或寻找机缘。</template>
    </p>
    <p>
      <template v-if="automatic"
        >单次手动行动最长
        {{ months }} 月；自动行动逐月继续，可随时暂停。</template
      >
      <template v-else>本次最长 {{ months }} 月。</template>
      遇剧情或寿尽立即停下。估算逐月计入寿元衰减，未计入途中机缘或剧情耗时。
    </p>
    <p
      v-if="outlook.remainingMonths <= months"
      class="life-warning"
      role="status"
    >
      寿元不足以完成这次行动：第
      {{ outlook.remainingMonths }} 月寿尽，游戏结束，当月不再获得收益。
    </p>
  </aside>
</template>
<style scoped>
.cultivation-outlook {
  margin: 12px 0;
  padding: 10px 12px;
  border: 1px solid #a59b6855;
  border-radius: 6px;
}
.cultivation-outlook p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.7;
}
.life-warning {
  color: #ffceaa;
  font-weight: 600;
}
</style>
