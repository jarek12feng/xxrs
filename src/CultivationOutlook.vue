<script setup lang="ts">
import { foundationObjective } from "./growth-continuity/foundation-objective";
import { meetingObjective } from "./growth-continuity/meeting-objective";
import MeetingObjective from "./growth-continuity/MeetingObjective.vue";
import PreparationNotes from "./growth-continuity/PreparationNotes.vue";
import CommitmentTiming from "./correspondence/CommitmentTiming.vue";
import {goldenBlock} from "./conclave/state";
import { advancementPromise } from "./recognition/view";
import { foundationBlock } from "./foundation-journey/growth-state";
import { computed, ref } from "vue";
import { retreatDurations, retreatPlan, type RetreatPace } from "./retreat";
import type { Intent } from "./core";
import { actionError } from "./core";
import type { State } from "./world";
import { cultivationProjection, formatLifeMonths } from "./progression";
const props = withDefaults(
  defineProps<{
    game: State;
    target?: number;
    months?: number;
    automatic?: boolean;
    busy?: boolean;
    compact?: boolean;
    meetingPlan?: boolean;
  }>(),
  { months: 3, meetingPlan: true },
);
const emit = defineEmits<{ act: [intent: Intent]; standing: [] }>();
const pace = ref<RetreatPace>("regular");
const continueAccumulating = ref(false);
const meeting = computed(() => meetingObjective(props.game));
const objective = computed(() => foundationObjective(props.game));
const target = computed(() => props.target ?? (objective.value?.canContinue && continueAccumulating.value ? 599 : objective.value?.target));
const durations = computed(() => retreatDurations(props.game));
const retreat = computed(() =>
  retreatPlan(props.game, pace.value, target.value),
);
const outlook = computed(() => cultivationProjection(props.game, target.value));
</script>
<template>
  <aside class="cultivation-outlook" aria-label="吐纳耗时与寿元">
    <section v-if="objective" aria-label="此番修行的用途" class="growth-objective">
      <strong>{{ objective.title }}</strong>
      <p>{{ objective.purpose }}</p>
      <template v-if="objective.next">
        <button :disabled="busy || !!objective.next.error" @click="emit('act', objective.next.intent)">{{ objective.next.label }}</button>
        <p v-if="objective.next.error">{{ objective.next.error }}</p>
      </template>
      <label v-if="objective.canContinue && target !== undefined && props.target === undefined">
        <input v-model="continueAccumulating" type="checkbox" :disabled="busy" />先继续积累，再去试运（最多至 599）
      </label>
    </section>
    <MeetingObjective v-if="meetingPlan" :game="game" :busy="busy" @act="emit('act', $event)" />
    <p v-if="!compact" class="realm-promise">
      {{ advancementPromise(game)
      }}<button v-if="game.realm < 2 && game.journey.branch !== 'none'" :disabled="busy" @click="$emit('standing')">
        查看亲历与任用
      </button>
    </p>
    <p>剩余寿元 {{ formatLifeMonths(outlook.remainingMonths) }}。</p>
    <details>
      <summary>{{ compact ? '修行成效与逐月明细' : '逐月修行明细' }}</summary>
      <p v-if="compact" class="realm-promise">{{ advancementPromise(game) }}<button v-if="game.realm < 2 && game.journey.branch !== 'none'" :disabled="busy" @click="$emit('standing')">查看亲历与任用</button></p>
      <p>
        剩余寿元 {{ formatLifeMonths(outlook.remainingMonths) }}。下月吐纳实际
        +{{ outlook.monthlyGain }}，寿元效率
        {{ Math.round(outlook.efficiency * 100) }}%。本点已积累
        {{
          Math.floor((game.cultivationRemainder / 240) * 100)
        }}%；未满一点的积累会保留，休息或读档不丢失。
      </p>
    </details>
    <p v-if="outlook.missing">
      {{ meeting ? "若继续修炼至" : "修至" }} {{ outlook.target }} 还差 {{ outlook.missing }}；
      <template v-if="outlook.monthsToTarget !== null"
        >预计需 {{ formatLifeMonths(outlook.monthsToTarget) }}，届时剩余寿元
        {{ formatLifeMonths(outlook.remainingAfterTarget ?? 0) }}。</template
      >
      <template v-else
        >{{ outlook.remainingMonths <= 1 ? "余寿不足以完成一次行功，下一月便是此生终点。可先回望卷宗、保存这段旅程。" : "按当前功法继续吐纳，寿尽前无法达到；可探险取得修为与功法机缘，但仍须留足往返和整备年月。" }}</template
      >
    </p>
    <p v-else-if="objective?.ready">此番积累已可付诸实用，可按上方去路继续。</p>
    <p v-else-if="outlook.bottleneck">
      {{
        game.realm === 2 ? goldenBlock(game) : game.realm === 1
          ? foundationBlock(game)
          : "修为已抵当前瓶颈，出门历练取得材料并炼化后，才能继续晋升。"
      }}
    </p>
    <p v-else>
      当前修行目标已达到。
      <template v-if="game.realm === 1 && outlook.current >= 600"
        >可筹备凝丹主药、丹药与灵地，尝试突破金丹。</template
      >
      <template v-else-if="game.realm === 0 && outlook.current >= 360"
        >须备齐筑基丹才能尝试突破筑基。</template
      >
      <template v-else-if="game.realm === 3">元婴已成，可出关安顿、决定大典并亲试护渡神通。</template>
      <template v-else>可继续积累或寻找机缘。</template>
    </p>
    <p v-if="!compact">
      <template v-if="game.realm === 2">闭关按下方所选年月逐月结算，到目标或会期来信时提前出关。</template>
      <template v-else-if="automatic"
        >逐月行动按钮每次
        {{ months }} 月以内；自动行动逐月继续，可随时暂停。</template
      >
      <template v-else>本次最长 {{ formatLifeMonths(months) }}。</template>
      遇剧情或寿尽立即停下。估算逐月计入寿元衰减，未计入途中机缘或剧情耗时。
    </p>
    <PreparationNotes :game="game" :busy="busy" @act="emit('act', $event)" />
    <CommitmentTiming :game="game" :months="automatic ? retreat.batchMonths : months" />
    <section v-if="automatic && retreat.batchMonths > 0" aria-label="安排闭关">
      <p v-if="!compact">
        {{ meeting ? "自选修炼目标：积累修为至" : "目标：积累修为至" }}
        {{ retreat.target }}；达到目标即出关，突破条件仍需另外完成。
      </p>
      <label>
        闭关时长
        <select v-model="pace" :disabled="busy" aria-label="闭关时长">
          <option
            v-for="option in durations"
            :key="option.pace"
            :value="option.pace"
          >
            {{ option.label }} · 最长 {{ formatLifeMonths(option.months) }}
          </option>
        </select>
      </label>
      <p>
        预计闭关 {{ formatLifeMonths(retreat.batchMonths) }}，修为 +{{
          retreat.batchGain
        }}； 出关年龄 {{ formatLifeMonths(retreat.exitAge) }}，剩余寿元
        {{ formatLifeMonths(retreat.remainingAtExit) }}。
        {{
          retreat.reachesTarget
            ? "本次预计达到目标。"
            : retreat.stopsForMeeting
              ? "会期来信时出关，可从古渡赴约。"
              : meeting
                ? "本次结束后可整备赴会，也可继续修炼。"
                : "本次结束后仍需继续积累。"
        }}
      </p>
      <p>
        本次吐纳不消耗灵石、丹药，也没有灵石收入。功法与已装备法器的修行效果已计入预估。
      </p>
      <button
        class="secondary retreat-start"
        :disabled="busy || !!actionError(game, 'cultivate')"
        @click="
          emit('act', {
            type: 'advance',
            activity: 'cultivate',
            months: retreat.batchMonths,
          })
        "
      >
        开始闭关 {{ formatLifeMonths(retreat.batchMonths) }} · 预计修为 +{{
          retreat.batchGain
        }}
      </button>
      <p>
        确认开始后直接结算本段年月，无需现实等待；遇待处理剧情或瓶颈提前出关。已度过的年月不能撤回，可在出关后调整下一段安排。
      </p>
      <p
        v-if="retreat.batchMonths < retreat.duration && !retreat.reachesTarget && !retreat.stopsForMeeting"
        class="life-warning"
        role="status"
      >
        余寿不足，已缩短至寿尽前一月；按当前修行效率仍无法达到目标。
      </p>
    </section>
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
.growth-objective { border-left: 2px solid #b7aa7c; padding: 8px 12px; margin-bottom: 12px; }
.growth-objective label { display: block; margin-top: 8px; font-size: 13px; }
.life-warning {
  color: #ffceaa;
  font-weight: 600;
}

select {
  max-width: 100%;
  margin: 6px 0;
  padding: 8px;
}
.retreat-start {
  white-space: normal;
}
</style>
