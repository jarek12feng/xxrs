<script setup lang="ts">
import { dutySituations, dutyOptions, isDuty } from "./duties";
import { computed, ref } from "vue";
import type { State, Intent } from "../core";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import { heroArt, characterArt } from "../presentation/art";
import { cultivationQuote, type CultivationAction } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const w = computed(() => props.game.qiJourney.cultivation.work!);
const active = ref("work");
const title = computed(
  () =>
    ({
      alchemy: "丹炉 · 筑基丹行炉",
      circulation: "洞府 · 小周天行功",
      relic: "青石遗府 · 封丹石台",
      herb: "青石药脉 · 玉髓芝",
      herbs: "山下药舍 · 辨药施治",
      watch: "听松夜路 · 护灯引路",
      copy: "藏卷阁 · 校勘旧卷",
    })[w.value.kind],
);
const image = computed(() =>
  ["herb", "relic"].includes(w.value.kind)
    ? "/art/qi-progression/qingshi-inner-platform.webp"
    : w.value.kind === "watch"
      ? "/scenes/mist-path.jpg"
      : w.value.kind === "circulation"
        ? "/scenes/moon-terrace.png"
        : w.value.kind === "copy"
          ? "/art/foundation-journey/inheritance-room.webp"
          : "/scenes/apothecary.jpg",
);
const state = computed(() =>
  w.value.kind === "alchemy"
    ? `炼制 ${w.value.progress}/3 · 火候 ${w.value.pressure}（1文火、2中火、3旺火）· 炉中余力 ${w.value.vigor}`
    : ["circulation", "relic"].includes(w.value.kind)
      ? `${w.value.kind === "relic" ? "封纹" : "周天"} ${w.value.progress}/6 · ${w.value.kind === "relic" ? "阵压" : "脉压"} ${w.value.pressure}/5 · 灵息 ${w.value.vigor}`
      : w.value.kind === "herb"
        ? `完整根段 ${w.value.progress}/3 · 地下灵流 ${w.value.pressure} · 护持余力 ${w.value.vigor}`
        : `已办妥 ${w.value.progress}/3 · 余力 ${w.value.vigor} · 请据现场决定处置`,
);
const situation = computed(() =>
  isDuty(w.value.kind)
    ? dutySituations[w.value.kind][w.value.pressure]!.clue
    : "",
);
const options = computed(() =>
  isDuty(w.value.kind)
    ? dutyOptions[w.value.kind].map((o) => [
        ...o,
        "每次处置余力−1；判断不当额外损失3",
      ])
    : {
        alchemy: [
          ["heat", "添火", "火候+1、余力−1；火候达到5会毁丹"],
          ["coolFire", "收小炉口", "火候−1、余力−1"],
          ["extract", "析出主药精华", "中火2；先取主药精华"],
          ["blend", "调和辅药", "文火1；精华析出后调和"],
          ["condense", "收拢成丹", "旺火3；药性相融后成丹"],
        ],
        relic: [
          ["circulate", "整股破禁", "剥离封纹+2、阵压+2、灵息−2"],
          ["spread", "沿纹慢解", "剥离封纹+1、阵压+1、灵息−1"],
          ["ease", "疏导阵压", "阵压−3、灵息−1"],
        ],
        circulation: [
          ["circulate", "整股行气", "周天+2、脉压+2、灵息−2"],
          ["spread", "分股行气", "周天+1、脉压+1、灵息−1"],
          ["ease", "舒缓经脉", "脉压−3、灵息−1"],
        ],
        herb: [
          ["brace", "布绳护根", "灵流−1、余力−1"],
          ["discern", "辨流引隙", "神识8；灵流归零、余力−2"],
          ["wash", "药液缓流", "灵草2；灵流归零、余力−2"],
          [
            "harvest",
            "循根采取",
            "灵流不高于1时保住一段；余力−1、灵流+1，强采额外损失3余力",
          ],
        ],
        herbs: [
          ["discern", "辨明寒热", "核验病情，余力−1"],
          ["wash", "澄清药液", "核验药性，余力−1"],
          ["treat", "按症施药", "核验后治好一人，余力−1；未核验额外损失3"],
          ["rush", "整包分药", "未辨药性，可能误治"],
        ],
        watch: [
          ["discern", "辨认路标", "核验下一段路，余力−1"],
          ["brace", "护灯照路", "稳住灯火，余力−1"],
          ["escort", "领队越坡", "核验后通过一段，余力−1；盲走额外损失3"],
          ["rush", "催队赶路", "山风未稳，容易失散"],
        ],
        copy: [
          ["discern", "核对原签", "查清出处，余力−1"],
          ["compare", "校正异文", "查证后完成一处，余力−1；误抄额外损失3"],
          ["rush", "凭记忆誊写", "错字会混入后文"],
        ],
      }[w.value.kind],
);
function act(id: string) {
  const action = `cultivation:${id}` as CultivationAction;
  if (!props.busy && !cultivationQuote(props.game, action).error)
    emit("act", { type: "qiJourney", action });
}
const reason = (id: string) =>
  cultivationQuote(props.game, `cultivation:${id}` as CultivationAction).error;
</script>
<template>
  <NarrativeStage
    :title="title"
    :image="image"
    :stage-key="'practice-' + w.kind"
    :goal="
      w.kind === 'alchemy'
        ? '依药性调火，完成析药、调和与成丹。'
        : w.kind === 'relic'
          ? '保住丹匣，剥离六重封纹；阵压达到5便会失手。'
          : w.kind === 'circulation'
            ? '贯通小周天，脉压达到5便会散功。'
            : w.kind === 'herb'
              ? '护住三段主根，再将玉髓芝收入药匣。'
              : '完成眼前事务，验收后才有报酬。'
    "
    :hotspots="[
      {
        id: 'work',
        label:
          w.kind === 'circulation'
            ? '经脉与灵息'
            : w.kind === 'herb'
              ? '玉髓芝与地脉'
              : '现场事务',
        x: 57,
        y: 55,
      },
    ]"
    :active="active"
    @select="active = $event"
    @close="active = ''"
  >
    <template #world>
      <img
        class="actor"
        :src="
          characterArt(
            heroArt(game.social.gender, game.realm),
            w.kind === 'circulation' ? 'meditate' : 'idle',
          )
        "
        :alt="game.name"
      />
      <div
        class="practice-object"
        :class="w.kind"
        :style="{ '--pressure': w.pressure }"
        aria-hidden="true"
      >
        <i v-for="n in 6" :key="n" :class="{ lit: n <= w.progress }"></i
        ><img
          v-if="w.kind === 'herb'"
          class="object-art"
          src="/art/qi-progression/dew-herb.webp"
          alt=""
        /><img
          v-if="w.kind === 'watch'"
          class="object-art"
          src="/art/items/spirit-lantern.webp"
          alt=""
        /><img
          v-if="w.kind === 'copy'"
          class="object-art"
          src="/art/items/manual-herb.webp"
          alt=""
        /><span>{{
          w.kind === "alchemy"
            ? "丹炉与药液"
            : w.kind === "relic"
              ? "封丹石匣"
              : w.kind === "herb"
                ? "玉髓芝"
                : w.kind === "circulation"
                  ? "小周天"
                  : w.kind === "watch"
                    ? "引路灯"
                    : w.kind === "copy"
                      ? "原签与校本"
                      : "药碗与药签"
        }}</span>
      </div>
    </template>
    <p class="state" role="status">{{ state }}</p>
    <p>{{ game.qiJourney.cultivation.last }}</p>
    <p class="situation">{{ situation }}</p>
    <div class="actions">
      <button
        v-for="o in options"
        :key="o[0]"
        :disabled="busy || !!reason(o[0]!)"
        @click="act(o[0]!)"
      >
        {{ o[1] }}<small>{{ reason(o[0]!) || o[2] }}</small>
      </button>
    </div>
    <button :disabled="busy" @click="act('withdraw')">
      收手退回 · 已用物资与年月不退
    </button>
  </NarrativeStage>
</template>
<style scoped>
.actor {
  position: absolute;
  left: 21%;
  bottom: 10%;
  height: 43%;
  object-fit: contain;
}
.practice-object {
  position: absolute;
  left: 46%;
  bottom: 27%;
  width: 210px;
  height: 170px;
  border: 1px solid #b8c7a8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #16342b99;
  box-shadow: 0 0 calc(12px + var(--pressure) * 8px) #d6a25366;
}
.practice-object i {
  height: 14px;
  width: 14px;
  border: 1px solid #a7c9b1;
  border-radius: 50%;
}
.practice-object i.lit {
  background: #eed189;
  box-shadow: 0 0 12px #eed189;
}
.practice-object span {
  position: absolute;
  bottom: 20px;
  color: #fff1c8;
}
.object-art {
  position: absolute;
  width: 100px;
  height: 100px;
  object-fit: contain;
  top: 0;
}
.state {
  font-size: 18px;
  color: #ffe1a3;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 12px 0;
}
.actions button {
  padding: 12px;
  white-space: normal;
}
.actions small {
  display: block;
  margin-top: 6px;
}
</style>
