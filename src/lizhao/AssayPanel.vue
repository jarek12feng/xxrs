<script setup lang="ts">
import { computed } from "vue";
import { assayView, type AssayState } from "./assay";
const props = defineProps<{ assay: AssayState; verified: boolean }>();
const view = computed(() =>
  props.verified && props.assay.phase === "idle"
    ? { title: "药理已有记录", clue: "先前验证的药理保留，不必重做试炉。" }
    : assayView(props.assay),
);
</script>
<template>
  <section
    class="assay-observation"
    aria-label="试炉观察"
    :data-phase="assay.phase"
  >
    <div
      class="assay-vessel"
      :class="{ divided: assay.separation === 2, strained: assay.strain === 2 }"
      aria-hidden="true"
    >
      <span /><i
        v-if="assay.tide"
        class="tide-foam"
        :style="{ height: `${assay.tide * 12}px` }"
      />
    </div>
    <div role="status">
      <strong>{{ view.title }}</strong>
      <p>{{ view.clue }}</p>
      <div
        v-if="assay.phase !== 'idle'"
        class="assay-readings"
        aria-label="炉况"
      >
        <label
          >潮息 {{ assay.tide }}/2 <meter min="0" max="2" :value="assay.tide"
        /></label>
        <label
          >分药 {{ assay.separation }}/2
          <meter min="0" max="2" :value="assay.separation"
        /></label>
        <label
          >行炉负担 {{ assay.strain }}/2
          <meter min="0" max="2" :value="assay.strain"
        /></label>
      </div>
      <details v-if="!verified" class="assay-help"><summary>查看试炉提示（可选）</summary><p>分槽缓炼稳妥省料；分念辨性较快，但会积累行炉负担。收念可消退负担，滤草或御印可处理潮息；每项操作的耗时与炉况变化在下方显示。</p></details>
      <small v-if="!verified"
        >观察不耗时，可留炉回港。缓炼两月，其他行炉操作各一月；弃炉不耗月。下方显示操作后的炉况。行炉负担仅属本炉，不损伤识海。封存辅药不动用。</small
      >
      <small v-else
        >药理已经掌握。带好主药与定性辅药，可回古渡筹备化婴丹；不必重做试炉。</small
      >
    </div>
  </section>
</template>
<style scoped>
.assay-observation {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border: 1px solid #b8aa7255;
  background: #142c27cc;
  margin: 12px 0;
}
.assay-observation p {
  margin: 8px 0;
  line-height: 1.7;
}
.assay-observation small {
  color: #d3cfb9;
}
.assay-vessel {
  width: 54px;
  height: 66px;
  border: 2px solid #a9bca0;
  border-radius: 10px 10px 22px 22px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.assay-vessel span {
  position: absolute;
  inset: 80% 3px 3px;
  background: #33483c;
  border-radius: 0 0 18px 18px;
}
[data-phase="cloudy"] .assay-vessel span {
  inset-block-start: 25%;
  background: linear-gradient(#1a2023 25%, #7b8d48 26%, #516847);
}
[data-phase="clear"] .assay-vessel span {
  inset-block-start: 40%;
  background: #8bb697;
}
[data-phase="stable"] .assay-vessel span {
  inset: 35% 26% 20%;
  border-radius: 50%;
  background: #d7d8a1;
  box-shadow: 0 0 15px #d7d8a166;
}
.assay-readings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}
.assay-readings label {
  display: grid;
  gap: 4px;
  color: #ece5cc;
}
.assay-readings meter {
  width: 100px;
}
.tide-foam {
  position: absolute;
  top: 25%;
  left: 3px;
  right: 3px;
  background: #101e27;
  border-bottom: 2px solid #c2b784;
}
.assay-vessel.divided span {
  background: linear-gradient(
    90deg,
    #8bb697 48%,
    #223c32 49%,
    #223c32 52%,
    #d7d8a1 53%
  );
}
.assay-vessel.strained {
  border-color: #e8ad7b;
  box-shadow: 0 0 10px #e8ad7b55;
}
</style>
