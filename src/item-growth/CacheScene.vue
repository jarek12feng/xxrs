<script setup lang="ts">
import { computed, ref } from "vue";
import type { State, Intent } from "../world";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import WalkingActor from "../scene2d/WalkingActor.vue";
import { heroArt } from "../presentation/art";
import ItemArt from "../presentation/ItemArt.vue";
import {
  itemGrowthQuote,
  cachePreview,
  cachePhases,
  type ItemGrowthAction,
} from "./rules";
import { storageProfile } from "./state";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const selected = ref("cache");
const p = computed(() => props.game.itemGrowth),
  storage = computed(() => storageProfile(p.value));
const rows = computed(() => {
  const list: { label: string; action: ItemGrowthAction; effect?: string }[] =
    [];
  if (p.value.trial) {
    for (const [move, label] of [
      ["observe", "辨读外环"],
      ["brace", "托住阵脚"],
      ["reach", "探入取戒"],
    ] as const) {
      const v = cachePreview(props.game, move)!;
      list.push({
        label,
        action: { kind: "move", move },
        effect: `解禁+${v.progress}，稳定度${v.loss > 0 ? "−" : "+"}${Math.abs(v.loss)} → ${v.stability}`,
      });
    }
    list.push({
      label: "收念撤回",
      action: { kind: "withdraw" },
      effect: "不新增伤势；准备投入不退，之后可重试",
    });
  } else if (!p.value.discovered) {
    list.push({ label: "查看石匣铭文", action: { kind: "inspect" } });
  } else if (selected.value === "cache" && !p.value.ring) {
    list.push(
      {
        label: "以神识定阵",
        action: { kind: "enter", preparation: "sense" },
        effect: "需有效神识12",
      },
      {
        label: "以玄铁稳阵",
        action: { kind: "enter", preparation: "iron" },
        effect: "消耗玄铁料1，无神识门槛",
      },
    );
  } else if (selected.value === "ore" && p.value.collected < 2) {
    list.push(
      {
        label: "将一块器髓收入容器",
        action: { kind: "collect", method: "carry" },
        effect: "占大件载荷2",
      },
      {
        label: "请渡工分匣封装一块",
        action: { kind: "collect", method: "pack" },
        effect: "灵石12；不占大件载荷，仍可用于重铸",
      },
    );
  }
  return list.map((row) => ({
    ...row,
    quote: itemGrowthQuote(props.game, row.action),
  }));
});
function act(action: ItemGrowthAction) {
  if (!props.busy && !itemGrowthQuote(props.game, action).error)
    emit("act", { type: "itemGrowth", action });
}
</script>
<template>
  <NarrativeStage
    image="/art/foundation-journey/inheritance-room.webp"
    title="沉井侧室 · 前人遗物"
    stage-key="relic-cache"
    :goal="
      p.trial
        ? '三段内解禁至少6，稳定度大于0；回卷时稳阵，匣口收束再取。'
        : p.ring
          ? '栖尘戒已得。收取余材，回听松重铸旧器；内层空间可待分念诀研修后修复。'
          : '石偶倒下后，侧室露出一只石匣。旧戒与余材尚在，可探取，也可暂缓。'
    "
    :hotspots="
      p.trial
        ? []
        : [
            {
              id: 'cache',
              label: p.ring ? '已开启的石匣' : '潮痕石匣',
              x: 55,
              y: 49,
            },
            {
              id: 'ore',
              label: `沉纹器髓 · 余${2 - p.collected}块`,
              x: 72,
              y: 69,
            },
            { id: 'exit', label: '返回无名渡', x: 21, y: 70 },
          ]
    "
    :active="selected"
    :battle="!!p.trial"
    activity-title="石匣解禁"
    @select="(id) => (id === 'exit' ? emit('close') : (selected = id))"
    @close="selected = ''"
  >
    <template #status
      ><span
        >{{ storage.name }} · 大件载荷 {{ storage.used }} /
        {{ storage.capacity }}</span
      ></template
    >
    <template #world
      ><WalkingActor
        class="cache-player"
        :character="heroArt(game.social.gender, game.realm)"
        :label="game.name"
        :position="{ x: 28, y: 87 }"
        :moving="false"
        :frame="0"
        :facing="1"
        sheet="/art/scene2d/foundation-walk/hero-male-v1.png"
      />
      <div v-if="p.trial" class="cache-progress" role="status">
        {{ cachePhases[p.trial.turn] }} · 第{{
          p.trial.turn + 1
        }}/3段<br />稳定度 {{ p.trial.stability }} · 解禁
        {{ p.trial.progress }}/6
      </div></template
    >
    <template v-if="p.trial || selected === 'cache' || selected === 'ore'">
      <img
        v-if="!p.trial && !p.ring && selected === 'cache'"
        class="cache-detail"
        src="/art/item-growth/sealed-cache.webp"
        alt="潮痕石匣内的暗银古戒"
      />
      <p v-if="p.trial">
        外环先辨纹，回卷须稳阵，匣口收束时可探入。失败伤势+1，戒与余材保留；静养后可重试。
      </p>
      <p v-else-if="!p.discovered">
        铭文被潮痕遮住，匣外的两块器材却仍有灵纹。先看清来历，再决定取什么。
      </p>
      <p v-else-if="selected === 'ore'">
        {{ storage.name }}当前大件载荷 {{ storage.used }} /
        {{
          storage.capacity
        }}。沉纹器髓可重铸二阶听松灵剑或归元灵瓶。每件需一块器髓、玄铁料1、灵石24、三月；保留原精炼和器纹。余材总共两块，不会再生。
      </p>
      <p v-else-if="p.ring">
        <ItemArt
          id="relic-ring"
        />栖尘戒外层已开，能一次收下两块器髓。研修分念诀、有效神识18后，可在听松修复内层。
      </p>
      <p v-else>
        旧主人寿尽前留下遗戒与未用完的器材。栖尘戒外层可容大件载荷4；不是突破必需，可以先走自己的道途。
      </p>
      <button
        v-for="row in rows"
        :key="JSON.stringify(row.action)"
        :disabled="busy || !!row.quote.error"
        @click="act(row.action)"
      >
        {{ row.label
        }}<small
          >{{ row.effect
          }}<template v-if="row.quote.months">
            · 准备{{ row.quote.months }}月</template
          ></small
        ><small v-if="row.quote.error">{{ row.quote.error }}</small>
      </button>
      <p v-if="p.last" class="cache-receipt" role="status">{{ p.last }}</p>
      <button v-if="!p.trial" @click="emit('close')">返回无名渡</button>
    </template>
    <template #notes
      ><p>
        {{ p.last || "这条侧室通向一份额外机缘；不会代替沉井主法与分念诀。" }}
      </p>
      <p>
        普通补给收纳照旧；大件载荷只计算未封装器髓。满载不能收取，可扩容、取戒或分匣封装。
      </p></template
    >
  </NarrativeStage>
</template>
<style scoped>
.cache-player {
  height: clamp(260px, 32vh, 380px);
  width: calc(clamp(260px, 32vh, 380px) * 0.75);
}
button {
  display: block;
  width: 100%;
  text-align: left;
  margin: 10px 0;
}
small {
  display: block;
  line-height: 1.6;
}
.cache-detail {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 4px;
}
.cache-progress {
  position: absolute;
  left: 36%;
  top: 35%;
  padding: 20px;
  background: #102a25ed;
  color: #f7e8c7;
  border: 1px solid #b7a173;
  font-size: 20px;
  line-height: 1.8;
}
.cache-receipt {
  border-left: 2px solid #b7a173;
  padding-left: 12px;
}
</style>
