<script setup lang="ts">
import { computed, ref } from "vue";
import type { State, Intent } from "../core";
import CovenantScene from "./CovenantScene.vue";
import ThunderWorld from "./ThunderWorld.vue";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import NascentPracticeWorld from "./NascentPracticeWorld.vue";
import NascentAfterWorld from "./NascentAfterWorld.vue";
import { crossingView } from "./crossing";
import { channelingSituation } from "./channeling";
import { nascentGoal, nascentActive, nascentPromises } from "./rules";
import {
  nascentHotspots,
  nascentInteractions,
  nascentContentBoundary,
} from "./view";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; leave: [] }>();
const selected = ref("");
const performing = ref(false);
const thunderScene = computed(
  () =>
    !!n.value.thunder.battle || (n.value.thunder.cleared && !n.value.emerged),
);
const n = computed(() => props.game.nascentSoul);
const rows = computed(() =>
  nascentInteractions(props.game).filter(
    (row) => nascentActive(props.game) || row.object === selected.value,
  ),
);
const crossing = computed(() => crossingView(props.game));
const hotspots = computed(() => {
  if (props.game.realm === 3 && n.value.ability !== "none")
    return [
      { id: "current", label: "主潮 · 横截航道", x: 34, y: 53 },
      {
        id: "landing",
        label:
          n.value.ability === "done" ? "彼岸路标与测绘地" : "侧岸 · 回流落脚处",
        x: 53,
        y: 27,
      },
      {
        id: "gate",
        label: crossing.value.boat,
        x:
          crossing.value.position === "near"
            ? 33
            : crossing.value.position === "eddy"
              ? 44
              : 53,
        y:
          crossing.value.position === "near"
            ? 76
            : crossing.value.position === "eddy"
              ? 58
              : 38,
      },
    ];
  return (
    props.game.realm === 3
      ? nascentHotspots.filter(
          (p) =>
            p.id === "gate" || (p.id === "companion" && props.game.social.met),
        )
      : nascentHotspots
  ).map((p) => {
    if (props.game.realm === 3 && p.id === "gate")
      return {
        ...p,
        label: n.value.ability !== "none" ? "潮隙与测绘舟" : "庭前礼案与来客",
        x: 53,
        y: 68,
      };
    if (p.id === "furnace") return { ...p, x: 15, y: 65 };
    if (p.id === "trial") return { ...p, x: 39, y: 51 };
    return p;
  });
});
const promises = computed(() => nascentPromises(props.game));
const promiseLabels = {
  duty: "受托职责",
  home: "故乡音讯",
  promise: "未竟旧约",
  companion: "长关告别",
} as const;
const actualPromises = computed(() =>
  (Object.keys(promiseLabels) as (keyof typeof promiseLabels)[]).filter(
    (key) => promises.value[key],
  ),
);
const afterScene = computed(() => props.game.realm === 3 && n.value.emerged);
const sceneImage = computed(() =>
  thunderScene.value
    ? `/art/nascent-tribulation/${n.value.thunder.cleared ? "tribulation-cleared-v1.webp" : "tribulation-platform-v1.webp"}`
    : afterScene.value
      ? n.value.ability !== "none"
        ? "/art/outer-sea/ferry.webp"
        : "/art/world-story/golden/dao-discussion-terrace.webp"
      : "/art/foundation-growth/meridian-retreat.webp",
);
</script>
<template>
  <CovenantScene
    v-if="selected === 'companion' && !nascentActive(game)"
    :game="game"
    :busy="busy"
    @act="emit('act', $event)"
    @close="selected = ''"
  />
  <NarrativeStage
    v-else
    :image="sceneImage"
    :focus-scene="false"
    :title="
      thunderScene
        ? n.thunder.cleared
          ? '劫云散尽 · 元婴初成'
          : '近岸渡劫台 · 天雷叩关'
        : game.realm === 3
          ? n.ability !== 'none'
            ? '古渡潮隙 · 护持测绘舟'
            : '元婴初成 · 出关礼庭'
          : '古渡静室 · 圆满与凝婴'
    "
    :class="{ 'thunder-stage': thunderScene, 'nascent-stage': !thunderScene }"
    stage-key="nascent-soul"
    :goal="nascentGoal(game)"
    :body="n.last"
    :hotspots="nascentActive(game) ? [] : hotspots"
    :active="selected"
    :battle="nascentActive(game)"
    :activity-title="
      n.thunder.battle
        ? n.thunder.battle.kind === 'practice'
          ? '引雷验法'
          : '三重天劫'
        : game.nascentSoul.attempt
          ? '凝婴行功'
          : '禁室试炼'
    "
    @select="selected = $event"
    @close="selected = ''"
  >
    <template #status
      ><span v-if="game.realm === 3 && n.ability !== 'none'"
        >{{ crossing.boat }} ·
        {{ n.ability === "done" ? "通行记录已留存" : "调整护持不耗月" }}</span
      ><span v-else
        >主药 {{ n.marrow }} · 辅药 {{ game.lizhao.reagent }} · 化婴丹
        {{ n.pills }} · 伤势 {{ game.injury }}</span
      ></template
    >
    <template #world>
      <ThunderWorld
        v-if="thunderScene"
        :game="game"
        @performing="performing = $event"
      />
      <NascentAfterWorld v-else-if="afterScene" :game="game" />
      <NascentPracticeWorld v-else :game="game" />
    </template>
    <p
      v-if="
        game.realm === 3 &&
        n.ability !== 'none' &&
        ['gate', 'current', 'landing'].includes(selected)
      "
    >
      {{
        n.ability === "done"
          ? "测绘队已在彼岸展开航图，路标与通行记录保留，无须再次护渡。"
          : selected === "current"
            ? "集中护持可压低浪墙；镇潮印能代你固定此处。"
            : selected === "landing"
              ? "侧岸回流须由你护住；舟队到达后便能卸下测杆。"
              : "可在安全处停舟等候。引航所需年月见操作，观察与调整不耗月。"
      }}
      <span v-if="crossing.seal && !crossing.fixed"
        >镇潮印已离开装配，原镇流失效；可重新装配或改用自身护持。</span
      >
    </p>
    <div v-if="selected === 'letters'">
      <p v-if="!actualPromises.length">长关前已无待交接之事。</p>
      <p v-for="key in actualPromises" :key="key">
        {{ promiseLabels[key] }} ·
        {{ n.commitments[key] === "none" ? "待安排" : "已安排" }}
      </p>
    </div>
    <p v-if="selected === 'furnace'">
      自炼需心得4，稳火可确定成丹；委托不要求炼丹修为。每炉消耗主药、辅药各1。辅药不足可回离照丹室续取；失败不抹去已开渠道。
    </p>
    <p v-if="selected === 'chamber'">
      先修成元婴续篇、完成试雷并备好化婴丹。三段行功共用有限丹元、心神，之后须亲渡三重劫雷。耗尽时强行继续会失稳；每段半年，失败耗本枚丹药并增伤势3，免费静养每月减伤1，与普通养伤相同。
    </p>
    <ol
      v-if="selected === 'chamber' && !nascentActive(game)"
      class="channeling-forecast"
      aria-label="三段行功征象"
    >
      <li v-for="phase in [0, 1, 2]" :key="phase">
        {{ channelingSituation(game, phase) }}
      </li>
    </ol>
    <p v-if="n.attempt" class="current-situation">
      {{ channelingSituation(game) }}
    </p>
    <aside v-if="n.ability === 'done'" class="content-boundary">
      <strong>本卷内容</strong>
      <p>{{ nascentContentBoundary }}</p>
    </aside>
    <p v-if="selected === 'companion'">
      结契自愿，不增加凝婴成功率；已结契者保留旧约，单身同样可完成叩关。
    </p>
    <div class="choices">
      <button
        v-for="row in rows"
        :key="row.id"
        :disabled="busy || performing || !!row.error"
        @click="emit('act', { type: 'nascentSoul', action: row.action })"
      >
        {{ row.label
        }}<small v-if="row.months || row.quote.stones || row.quote.herbs"
          >{{ row.months }}月 · 灵石{{ row.quote.stones }} · 灵草{{
            row.quote.herbs
          }}</small
        ><small v-if="row.error">{{ row.error }}</small>
      </button>
    </div>
    <p v-if="n.last" role="status">{{ n.last }}</p>
    <template #notes
      ><p>
        禁室：六轮内保住身神，破六道印。丹火、回震、露纹依次循环，分别考虑护体、守神、破禁；每个动作的损耗提前显示。
      </p>
      <p>
        凝婴保留法门、修为与关系。正式观礼、简礼与暂缓都可继续；礼物不提供可反复刷取的资源。
      </p>
      <p v-if="n.guests.length">来客：{{ n.guests.join("、") }}</p>
      <p v-if="n.ability === 'done'">
        本卷内容：{{ nascentContentBoundary }}
      </p></template
    >
  </NarrativeStage>
</template>
<style scoped>
@media (min-width: 901px) {
  .nascent-stage :deep(.narrative-inspector) {
    width: 34%;
    top: 175px;
  }
  .nascent-stage :deep(.narrative-goal) {
    width: 31%;
  }

  .thunder-stage :deep(.battle-inspector) {
    width: 31%;
    top: 190px;
  }
  .thunder-stage :deep(.narrative-goal) {
    width: 29%;
  }
}
.channeling-forecast {
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.7;
}
.channeling-forecast li {
  margin-bottom: 8px;
}
.content-boundary {
  border-top: 1px solid #b8a578;
  margin: 12px 0;
  padding-top: 10px;
}
.choices {
  display: grid;
  gap: 9px;
}
.choices button {
  text-align: left;
}
.choices small {
  display: block;
  margin-top: 5px;
}
</style>
