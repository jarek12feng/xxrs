<script setup lang="ts">
import { computed } from "vue";
import SnowSupplyPanel from "./SnowSupplyPanel.vue";
import type { State, Intent } from "../world";
import {
  estateQuote,
  estateRelationship,
  jobName,
  type EstateAction,
} from "./rules";
import { resourceNames, type ResourceAmounts, type Resource } from "../economy";
import { revisitView } from "../world-revisits/projection";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const life = computed(() => props.game.estateLife);
const work = computed(() => life.value.work);
const relation = computed(() => estateRelationship(props.game));
const labels: Record<EstateAction, string> = {
  buy: "直接购药",
  medicine: "接潮药处理",
  escort: "接三批护运",
  dry: "药炉缓烘",
  cool: "摊开散热",
  separate: "分层隔湿",
  ridge: "走短坡护送一批",
  canal: "沿水渠护送一批",
  repair: "重编篓架并试载",
  herbs: "交接 · 领取灵草6",
  stones: "交接 · 领取灵石12",
  learn: "携记录向岑霁求教",
  cancel: "交还未完合作",
};
const hints = computed<Record<EstateAction, string>>(() => ({
  buy: "按需购药",
  medicine: "备辅药一月、封存两月；缓烘另计月。完成得灵草6或灵石12。",
  escort: "每批短坡一月或沿渠两月，均含回庄。三批齐得灵草6或灵石12。",
  dry: "省辅药、耗一月：湿气−2、余热+2；余热不可超过4。",
  cool: "余热−2，不耗灵草。",
  separate: life.value.packing
    ? "用已学封药手法，湿气−1、余热−1，不耗灵草。"
    : "以干灵草隔湿，湿气−1、余热−1。",
  ridge: `篓架损耗+${life.value.packing ? 1 : 2}，不可超过4。已包含返庄路程。`,
  canal: "绕开颠簸路，不增加篓架损耗。已包含返庄路程。",
  repair: "损耗−2；不扣灵草，但需一月整修试载。",
  herbs: "可用于自炼、战中用药或下一程整备。",
  stones: "可用于购药、工坊或旅行准备。",
  learn: "完成任一合作后可学分层封药：制药隔湿免耗草，护运短坡损耗降低。",
  cancel: "无报酬；已耗物资、年月不退。以后可重新接下。",
}));
const actions = computed(() =>
  (work.value
    ? [
        ...(work.value.kind === "medicine"
          ? ["dry", "cool", "separate"]
          : ["ridge", "canal", "repair"]),
        "herbs",
        "stones",
        "cancel",
      ]
    : ["medicine", "escort", ...(!life.value.packing ? ["learn"] : [])]
  ).map((a) => ({
    id: a as EstateAction,
    label: labels[a as EstateAction],
    hint: hints.value[a as EstateAction],
    quote: estateQuote(props.game, a as EstateAction),
  })),
);
const amounts = (v: ResourceAmounts) =>
  Object.entries(v)
    .map(([k, n]) => `${resourceNames[k as Resource]}${n}`)
    .join("、");
const oldOffer = computed(() => revisitView(props.game, "estate")?.offers[0]);
const buyError = computed(() => estateQuote(props.game, "buy").error);
function buy() {
  emit("act", { type: "estateLife", action: "buy" });
}
</script>
<template>
  <section class="estate-life" aria-label="药庄合作">
    <h3>药案与护运</h3>
    <p>{{ relation }}</p>
    <p v-if="!work">
      为下一程备药，可以在药庄合作，也可直接买齐缺料。两类合作独立备货，交清后各需十二月才有下一批，不必等候。
    </p>
    <p v-if="life.packing" class="learned">
      已领悟 · 分层封药：隔湿免耗草，短坡损耗减半。
    </p>
    <div v-if="work" class="workbench" :class="work.kind" aria-live="polite">
      <strong>{{ jobName(work.kind) }}</strong>
      <template v-if="work.kind === 'medicine'">
        <div class="leaves" aria-hidden="true">
          <i v-for="n in 4" :key="n" :class="{ wet: n <= work.progress }"></i>
        </div>
        <p>湿气 {{ work.progress }} / 4 · 余热 {{ work.strain }} / 4</p>
        <p>封存条件：湿气尽、余热不超过1。余热过高先散热，药案可暂放。</p>
      </template>
      <template v-else>
        <div class="baskets" aria-hidden="true">
          <i
            v-for="n in 3"
            :key="n"
            :class="{ delivered: n <= work.progress }"
            >{{ n <= work.progress ? "已交" : "待运" }}</i
          >
        </div>
        <p>已交 {{ work.progress }} / 3 批 · 篓架损耗 {{ work.strain }} / 4</p>
        <p>路况与损耗公开；篓架承受不住时可整修或绕行。每批均回到药庄。</p>
      </template>
    </div>
    <div class="choices">
      <article v-for="a in actions" :key="a.id">
        <button
          :disabled="busy || !!a.quote.error"
          @click="emit('act', { type: 'estateLife', action: a.id })"
        >
          {{ a.label }}
        </button>
        <p>{{ a.hint }}</p>
        <small
          >{{
            a.quote.months
              ? `耗时${a.quote.months}月 · 完成后年龄${Math.floor((game.age + a.quote.months) / 12)}岁${(game.age + a.quote.months) % 12}月 · 余寿${Math.max(0, game.limit - game.age - a.quote.months)}月`
              : "不耗年月"
          }}{{
            amounts(a.quote.cost) ? " · 消耗" + amounts(a.quote.cost) : ""
          }}</small
        >
        <small v-if="a.quote.error" class="reason">{{ a.quote.error }}</small>
      </article>
    </div>
    <SnowSupplyPanel v-if="!work" :game="game" :busy="busy" @act="emit('act',$event)" />
    <details>
      <summary>直接购药与用途</summary>
      <p>灵草可供原有工坊自炼丹药；不想等待下一批合作时，可按需购买。</p>
      <button :disabled="busy || !!buyError" @click="buy">
        购灵草4 · 灵石{{ oldOffer?.cost.stones ?? 8 }} · 不耗年月</button
      ><small v-if="buyError">{{ buyError }}</small>
    </details>
    <p v-if="life.last" class="receipt" role="status">{{ life.last }}</p>
    <p class="optional">
      此处合作不影响境界资格。可离庄修行或远游，已做的步骤保留；亦可交还合作。
    </p>
  </section>
</template>
<style scoped>
.estate-life {
  color: #eee4c9;
}
.estate-life p {
  line-height: 1.65;
  margin: 8px 0;
}
.choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.choices article {
  padding: 10px;
  border: 1px solid #8c9c7866;
  background: #152f2b99;
}
.estate-life button {
  min-height: 42px;
  padding: 9px 12px;
  background: #294a40;
  color: #ffedbb;
  border: 1px solid #ad9e74;
  cursor: pointer;
  text-align: left;
}
.estate-life button:disabled {
  opacity: 0.5;
  cursor: default;
}
.estate-life button:focus-visible,
.estate-life summary:focus-visible {
  outline: 2px solid #ffe5a2;
  outline-offset: 3px;
}
.estate-life small {
  display: block;
  line-height: 1.6;
  color: #d0c9b4;
}
.reason {
  color: #edba9c !important;
}
.workbench {
  padding: 12px;
  background: #263d3066;
  border: 1px solid #9eaa78;
}
.leaves,
.baskets {
  display: flex;
  gap: 14px;
  margin: 12px;
}
.leaves i {
  width: 32px;
  height: 18px;
  border-radius: 70% 5%;
  background: #aa9865;
  transform: rotate(-18deg);
}
.leaves i.wet {
  background: #5c9d7c;
  box-shadow: 0 0 0 2px #81bdc35c;
}
.baskets i {
  font-style: normal;
  border: 2px double #a08a61;
  padding: 8px;
  background: #65523155;
}
.baskets i.delivered {
  background: #5b89645e;
  border-color: #b7c58b;
}
.receipt,
.learned {
  padding: 10px;
  border-left: 2px solid #c2b579;
  background: #4e684633;
}
.optional {
  font-size: 0.9em;
  color: #c3c7b1;
}
.estate-life details {
  margin: 14px 0;
}
.estate-life summary {
  cursor: pointer;
  padding: 8px 0;
}
@media (max-width: 600px) {
  .choices {
    grid-template-columns: 1fr;
  }
}
</style>
