<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { moves } from "../expedition/content";
import type { Move } from "../expedition/content";
import { contestFoes, contestRank } from "./content";
import {
  contestError,
  contestExchange,
  contestDate,
  type ContestAction,
} from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const t = computed(() => props.game.sectContest);
const visible = computed(
  () =>
    props.game.status === "alive" && props.game.realm === 1 &&
    ["invited", "preparing", "entered", "finished"].includes(t.value.stage),
);
const foe = computed(() => contestFoes[t.value.results.length]);
const options = computed(() =>
  Object.entries(moves).map(([move, label]) => ({
    move: move as Move,
    label,
    preview: contestExchange(props.game, move as Move),
  })),
);
const err = (a: ContestAction) => contestError(props.game, a);
const send = (action: ContestAction) =>
  emit("act", { type: "sectContest", action });
const years = computed(() =>
  Math.floor(
    (props.game.age + Math.max(0, t.value.starts - props.game.month)) / 12,
  ),
);
</script>
<template>
  <section v-if="visible" class="contest-scene" aria-label="同门的邀约与内比">
    <template v-if="t.stage === 'invited' || t.stage === 'preparing'">
      <h3>{{ t.reminded ? "山门的开场口信" : "归途中，同门说起十年之约" }}</h3>
      <p role="status">{{ t.last }}</p>
      <p>
        定于{{ contestDate(t.starts) }} · 届时约 {{ years }} 岁 ·
        {{ Math.max(0, t.starts - game.month) }} 月后 · 会期一年
      </p>
      <p>
        一胜得灵石 24、护脉丹 1；两胜固定授结丹主药凝露芝心；三胜另选凝丹灵地或一次护持。各档只授一次，另有成绩补给。主药也可在筑基后期的凝露药圃取得，不必夺魁；长闭关到开场时会停下。
      </p>
      <button
        v-if="!t.reminded && t.stage === 'invited'"
        :disabled="busy || !!err({ kind: 'prepare' })"
        @click="send({ kind: 'prepare' })"
      >
        应下十年之约，先去修行
      </button>
      <template v-if="t.reminded">
        <button
          v-if="game.foundationJourney.location !== 'home'"
          :disabled="busy"
          @click="
            emit('act', {
              type: 'foundationJourney',
              action: { kind: 'travel', destination: 'home' },
            })
          "
        >
          回山赴约
        </button>
        <button
          :disabled="busy || !!err({ kind: 'enter' })"
          @click="send({ kind: 'enter' })"
        >
          前往松间石台
        </button>
        <p v-if="err({ kind: 'enter' })">{{ err({ kind: "enter" }) }}</p>
      </template>
      <button
        :disabled="busy || !!err({ kind: 'defer' })"
        @click="send({ kind: 'defer' })"
      >
        暂不参加，继续自己的道途
      </button>
    </template>
    <template v-else>
      <img
        class="contest-art"
        src="/art/sect-contest/tingsong.webp"
        alt="松林之间的宗门石台，同门正在切磋"
        loading="lazy"
      />
      <h3>松间石台 · 第 {{ t.edition }} 届同门内比</h3>
      <p>
        三场点到为止，胜负逐场记名。每场整备一月、灵石
        2；场间可调整功法、器物和补给。
      </p>
      <p v-if="t.results.length">
        已赛 {{ t.results.length }} 场 ·
        {{ t.results.filter((x) => x === "win").length }} 胜
      </p>
      <template v-if="t.stage === 'entered' && foe">
        <h4>{{ foe.name }}</h4>
        <p>{{ foe.goal }}</p>
        <template v-if="t.duel">
          <p>
            第 {{ t.duel.turn + 1 }} 合 / 最多 12 合 · 你的气势
            {{ t.duel.hp }} · 对手气势 {{ t.duel.enemy }}
          </p>
          <p class="tell">{{ foe.tells[t.duel.turn % foe.tells.length] }}</p>
          <button
            v-for="o in options"
            :key="o.move"
            :disabled="busy || !!err({ kind: 'move', move: o.move })"
            @click="send({ kind: 'move', move: o.move })"
          >
            {{ o.label
            }}<small v-if="o.preview"
              >伤敌 {{ o.preview.damage }} / 承伤 {{ o.preview.incoming
              }}<span v-if="o.preview.herbs">
                / 耗草 {{ o.preview.herbs }} 回气 {{ o.preview.healing }}</span
              ></small
            >
          </button>
          <button :disabled="busy" @click="send({ kind: 'withdraw' })">
            收势认输 · 本场记负，不新增伤势
          </button>
        </template>
        <template v-else>
          <details>
            <summary>赛前听来的招法</summary>
            <p v-for="tell in foe.tells" :key="tell">{{ tell }}</p>
          </details>
          <button
            :disabled="busy || !!err({ kind: 'fight' })"
            @click="send({ kind: 'fight' })"
          >
            行礼上台 · 一月、灵石 2
          </button>
          <p v-if="err({ kind: 'fight' })">{{ err({ kind: "fight" }) }}</p>
          <button
            v-if="game.injury"
            :disabled="busy"
            @click="
              emit('act', { type: 'advance', activity: 'rest', months: 1 })
            "
          >
            静养一月 · 不耗灵石
          </button>
          <button
            v-if="game.stones < 2"
            :disabled="busy"
            @click="
              emit('act', { type: 'advance', activity: 'work', months: 1 })
            "
          >
            劳作筹措整备费 · 一月
          </button>
          <button :disabled="busy" @click="send({ kind: 'leave' })">
            交还赛签 · 余场弃权，保留已胜场次
          </button>
        </template>
      </template>
      <template v-if="t.stage === 'finished'">
        <h4>{{ contestRank(t.results.filter((x) => x === "win").length) }}</h4>
        <p>一胜修行资助、两胜结丹主药均随补给固定入囊，不会因选择药材或丹药而漏领；三胜后可在凝丹筹备中选择培养。</p>
        <p>历史最好 {{ t.best }} 胜。只补发首次达到的新成绩奖，不重复刷奖。</p>
        <template v-if="t.best > t.claimed">
          <button
            :disabled="busy"
            @click="send({ kind: 'reward', reward: 'herbs' })"
          >
            领取灵草 {{ (t.best - t.claimed) * 4 }}
          </button>
          <button
            :disabled="busy"
            @click="send({ kind: 'reward', reward: 'medicine' })"
          >
            领取回春散 {{ t.best - t.claimed }}
          </button>
        </template>
        <p v-if="err({ kind: 'leave' })">{{ err({ kind: "leave" }) }}</p>
        <button
          :disabled="busy || !!err({ kind: 'leave' })"
          @click="send({ kind: 'leave' })"
        >
          与同门道别，离开石台
        </button>
      </template>
      <p role="status">{{ t.last }}</p>
    </template>
  </section>
</template>
<style scoped>
.contest-art {
  display: block;
  width: min(42%, 480px);
  float: left;
  margin-right: 24px;
  height: auto;
  border-radius: 8px;
  margin-bottom: 12px;
}
.contest-scene {
  margin: 16px 0;
  padding: 20px;
  border: 1px solid #a98d5e;
  border-radius: 10px;
  background: #182925;
  color: #f4ead8;
  line-height: 1.75;
  overflow-wrap: anywhere;
}
.contest-scene::after {
  content: "";
  display: block;
  clear: both;
}
@media (max-width: 800px) {
  .contest-art {
    width: 100%;
    float: none;
    margin-right: 0;
  }
}
.contest-scene button {
  background: #263d35;
  color: #fff0d5;
  border: 1px solid #bba16e;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  margin: 5px;
  max-width: 100%;
  white-space: normal;
}
.contest-scene button:disabled {
  background: #303a35;
  color: #bec4bc;
  cursor: not-allowed;
}
.contest-scene button:focus-visible {
  outline: 2px solid #efcc7c;
  outline-offset: 2px;
}
.contest-scene small {
  display: block;
}
.tell {
  border-left: 3px solid #d5b46f;
  padding-left: 12px;
}
@media (max-width: 480px) {
  .contest-scene {
    padding: 12px;
  }
  .contest-scene button {
    width: 100%;
    margin: 5px 0;
  }
}
</style>
