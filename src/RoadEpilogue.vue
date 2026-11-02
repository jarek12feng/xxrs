<script setup lang="ts">
import LifeReview from "./LifeReview.vue";
import ExpeditionResolution from "./expedition/ExpeditionResolution.vue";
import { computed } from "vue";
import { passSolutions, type State } from "./core";
const props = defineProps<{ game: State; locked: boolean }>();
defineEmits<{ return: []; continue: [] }>();
const ending = computed(() => {
  const key = props.game.adventure.road.solution;
  if (key === "none" || key === "legacy")
    return {
      title: "青嶂归途",
      route: "沿旧路过关",
      world:
        "你越过山口，将安全归路记入旅亭路簿。后来者有了可以核对的方向；山口的旧阵和通行方式仍保持原样。",
      person:
        "郁青的航图多了一段归路。你与山外有了来往，青嶂仍守着原来的关口。",
      future:
        "雾海来信仍待追寻。此行未得医道、剑道或识阵的破关之法，前路须另作准备。",
    };
  return {
    title: {
      medicine: "草木之间，有人歇脚",
      sword: "山口已开，旧名难寻",
      array: "山风有时，归人有约",
    }[key],
    route: passSolutions[key].name,
    world: passSolutions[key].consequence,
    person: {
      medicine:
        "青嶂留在关前照料伤者，也愿意请你坐下喝茶。郁青的药队有了落脚处，货车却仍要绕山。",
      sword:
        "郁青组织商队，让更多药材越过山口。青嶂仍替旅人守路，却收起了邀你喝茶的碗；那些旧名字无法复原。",
      array:
        "青嶂愿与你把茶喝完，郁青将开关时刻写进每张图。赶路的人有时要等候，旧名字则完整留在山上。",
    }[key],
    future: {
      medicine:
        "雾海旧药圃根脉淤塞，此番救草的手法或可一试。",
      sword:
        "到了雾海，可请商队协助架起归桥。",
      array:
        "继续探索时，你能凭归阵手法独自辨读雾海废驿，不必为这一步另找同行者。",
    }[key],
  };
});
</script>
<template>
  <section class="road-epilogue" aria-labelledby="road-ending-title">
    <div class="epilogue-heading">
      <span class="eyebrow">青嶂关 · 归路已通</span>
      <h2 id="road-ending-title">{{ ending.title }}</h2>
      <p>
        你将归路记入旅亭路簿，合上书页，窗外又有药队经过。
      </p>
      <strong>{{ ending.route }}</strong>
    </div>
    <div class="epilogue-records">
      <article>
        <h3>关前今昔</h3>
        <p>{{ ending.world }}</p>
      </article>
      <article>
        <h3>故人近况</h3>
        <p>{{ ending.person }}</p>
      </article>
      <article>
        <h3>前路可用之法</h3>
        <p>{{ ending.future }}</p>
      </article>
    </div>
    <ExpeditionResolution :game="game" />
    <LifeReview :game="game" />
    <p class="epilogue-note">
      可回旅亭访友，也可继续修行，往雾海探信。
    </p>
    <div class="epilogue-actions">
      <button :disabled="locked" @click="$emit('return')">
        回到旅亭 · 重访故人
      </button>
      <button class="primary" :disabled="locked" @click="$emit('continue')">
        继续探索 · 雾海来信 →
      </button>
    </div>
  </section>
</template>
<style scoped>
.road-epilogue {
  grid-column: 1 / -1;
  padding: clamp(22px, 4vw, 60px);
  background: #f5f1e6;
  color: #293d32;
}
.epilogue-heading {
  max-width: 760px;
  margin: 0 auto 32px;
  text-align: center;
}
.epilogue-heading h2 {
  font-size: clamp(26px, 3vw, 40px);
  margin: 16px 0;
}
.road-epilogue p {
  font-size: var(--road-reading, 16px);
  line-height: 1.9;
}
.epilogue-heading strong {
  display: inline-block;
  border-block: 1px solid #acb39f;
  padding: 10px 24px;
  margin-top: 12px;
}
.epilogue-records {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.epilogue-records article {
  padding: 22px;
  border: 1px solid #bec5b4;
  border-radius: 8px;
  background: #fffcf5;
}
.epilogue-records h3 {
  margin-top: 0;
}
.epilogue-note {
  margin: 28px 0;
  color: #56634f;
  text-align: center;
}
.epilogue-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
}
.epilogue-actions button {
  min-height: 48px;
  padding: 12px 22px;
  font-size: var(--road-reading, 16px);
}
@media (max-width: 800px) {
  .epilogue-records {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .epilogue-actions button {
    width: 100%;
  }
}
</style>
