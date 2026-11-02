<script setup lang="ts">
import { computed } from "vue";
import { formatLifeMonths } from "../cultivation";
import type { State, Intent } from "../core";
import {
  goldenGoal,
  goldenQuote,
  goldenChance,
  goldenExchange,
  goldenTells,
  type GoldenAction,
} from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const g = computed(() => props.game.goldenCore);
const visible = computed(
  () =>
    props.game.status === "alive" &&
    props.game.realm >= 1 &&
    props.game.foundationJourney.cultivation >= 200,
);
const exitAge = computed(() => props.game.age + goldenQuote(props.game, { kind: "break" }).months);
const exitLife = computed(() => Math.max(0, props.game.limit - exitAge.value));
const goal = computed(() => goldenGoal(props.game));
const options = computed(() => {
  const s = props.game,
    t = g.value;
  const choices: { label: string; action: GoldenAction }[] = [];
  const add = (label: string, action: GoldenAction) =>
    choices.push({ label, action });
  if (s.realm === 2) {
    if (!t.farShore) add("以丹元护体，独自越过云壁", { kind: "farShore" });
  } else if (t.duel) {
    for (const [move, label] of [
      ["guard", "守势"],
      ["discern", "辨影"],
      ["strike", "反击"],
    ] as const) {
      const p = goldenExchange(s, move)!;
      add(
        `${label} · 破阵 ${p.damage} / 承伤 ${p.incoming}${p.herbs ? ` / 耗草 ${p.herbs} 回气 ${p.healing}` : ""}`,
        { kind: "move", move },
      );
    }
    add("撤回归山 · 不新增伤势", { kind: "withdraw" });
  } else if (t.expedition !== "idle") {
    if (t.expedition === "prepared") {
      add("与柳知微合力 · 各取一份主药，石偶较易应对", {
        kind: "route",
        route: "share",
      });
      add("另寻药床独行 · 石偶更强，首通另得灵石 24、清心丹 1", {
        kind: "route",
        route: "alone",
      });
    }
    if (t.expedition === "path")
      add("应对守药石偶 · 看清来势再动手", { kind: "fight" });
    if (t.expedition === "won") add("采下凝露芝心，归山炼丹", { kind: "take" });
    add("沿原路撤回 · 行装不退还", { kind: "withdraw" });
  } else {
    if (t.champion === "pending") {
      add("魁首培养：领取一次凝丹灵地使用", {
        kind: "champion",
        reward: "haven",
      });
      add("魁首培养：请长老护持一次凝丹", {
        kind: "champion",
        reward: "guard",
      });
    }
    if (!t.medicine && !t.pills)
      add("整备行装，赴凝露药圃取结丹主药", { kind: "prepare" });
    if (t.medicine && !t.pills) {
      add("自行合药 · 需心得 2，研读可备", { kind: "brew", method: "self" });
      add("委托丹师炼制", { kind: "brew", method: "commission" });
    }
    if (t.site === "none") {
      add("租用凝丹静室 · 灵气充足，把握 +12", {
        kind: "site",
        site: "rented",
      });
      add("修复旧灵穴 · 需神识 8，把握 +8", { kind: "site", site: "repaired" });
      if (t.havenCredit)
        add("使用师门所赠静室 · 把握 +12", { kind: "site", site: "sect" });
    }
    if (!t.guard)
      add(
        t.guardCredit
          ? "请长老兑现护持 · 把握 +15"
          : "备护脉阵请人守关 · 把握 +15",
        { kind: "guard" },
      );
    add(`服丹叩关 · 当前把握 ${goldenChance(s)}%`, { kind: "break" });
  }
  return choices.map((c) => ({ ...c, quote: goldenQuote(s, c.action) }));
});
const send = (action: GoldenAction) =>
  emit("act", { type: "goldenCore", action });
</script>
<template>
  <section v-if="visible" class="golden-core" aria-label="凝丹机缘与金丹初行">
    <h3>
      {{
        game.realm === 2 ? "金丹初成 · 云壁之外" : "凝丹筹备 · 争取自己的机缘"
      }}
    </h3>
    <p>{{ goal }}</p>
    <details
      :open="
        g.expedition !== 'idle' ||
        game.foundationJourney.epilogue ||
        game.realm === 2 ||
        g.champion === 'pending'
      "
    >
      <summary>
        {{ game.realm === 2 ? "查看金丹初行" : "查看结丹缺口与取药路线" }}
      </summary>
      <template v-if="game.realm === 1">
        <p>
          主药凝露芝心 {{ g.medicine }} 份 · 凝丹丹药 {{ g.pills }} 枚 · 灵地{{
            g.site === "none" ? "未备" : "已备"
          }}
          · 护持{{ g.guard ? "已备" : "未备" }}
        </p>
        <p>
          筑基修行 {{ game.foundationJourney.cultivation }}/600 ·
          {{
            game.foundationJourney.epilogue
              ? "本境考验与归山已完成"
              : "还需完成稳脉、贯流、长风归流与归山"
          }}
        </p>
        <p>
          宗门内比两胜固定授一份主药；散修、失利或错过会期者，可在筑基后期赴药圃。主药用途相同，也可先参赛再转路。
        </p>
        <p>
          预计出关年龄 {{ formatLifeMonths(exitAge) }}；按突破前寿限，届时余寿 {{ formatLifeMonths(exitLife) }}。成功后寿限再增三百年。
        </p>
        <p>
          每次叩关消耗凝丹丹药 1 枚、六个月及已备护持。失败伤势
          +2，保留灵地、功法与筑基成果；可重新取药，重复取药不再发首通额外物资。修复灵穴较慢但便宜，可用额外护持补足把握。
        </p>
      </template>
      <template v-if="g.expedition !== 'idle'"
        ><p>
          凝露药圃 ·
          有守药石偶与禁制，成功取药必得主药。探索途中可撤回；不能在阵中开炉、换装或接其他行程。
        </p>
        <p v-for="tell in goldenTells" :key="tell">{{ tell }}</p></template
      >
      <p v-if="g.duel">
        第 {{ g.duel.turn + 1 }} 合 / 最多 16 合 · 你的气势 {{ g.duel.hp }} ·
        石偶气势 {{ g.duel.enemy }}<br />{{ goldenTells[g.duel.turn % 3] }}
      </p>
      <div v-for="o in options" :key="o.label" class="choice">
        <button :disabled="busy || !!o.quote.error" @click="send(o.action)">
          {{ o.label
          }}<small v-if="o.quote.months"
            >{{ o.quote.months }} 月 · 灵石 {{ o.quote.stones }} / 灵草
            {{ o.quote.herbs }} / 护脉丹 {{ o.quote.ward }}</small
          >
        </button>
        <small v-if="o.quote.error">{{ o.quote.error }}</small>
      </div>
      <p
        v-if="
          game.realm === 1 &&
          g.expedition === 'idle' &&
          game.foundationJourney.location !== 'home'
        "
      >
        <button
          :disabled="busy"
          @click="
            emit('act', {
              type: 'foundationJourney',
              action: { kind: 'travel', destination: 'home' },
            })
          "
        >
          回听松行前居筹备
        </button>
      </p>
      <template v-if="g.expedition === 'idle'">
        <button
          v-if="game.injury"
          :disabled="busy"
          @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
        >
          静养一月 · 不耗灵石
        </button>
        <button
          v-if="game.realm === 1"
          :disabled="busy"
          @click="emit('act', { type: 'advance', activity: 'work', months: 6 })"
        >
          劳作六个月筹资
        </button>
      </template>
      <p v-if="g.last" role="status">{{ g.last }}</p>
    </details>
  </section>
</template>
<style scoped>
.golden-core {
  margin: 16px 0;
  padding: 18px;
  border: 1px solid #ad9768;
  border-radius: 10px;
  background: #192d29;
  color: #f8eedb;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.golden-core summary {
  cursor: pointer;
}
.golden-core button {
  background: #30483e;
  color: #fff3db;
  border: 1px solid #b9a477;
  border-radius: 6px;
  padding: 9px 12px;
  white-space: normal;
  max-width: 100%;
  cursor: pointer;
}
.golden-core button:disabled {
  color: #c2c8bf;
  background: #303a35;
  cursor: not-allowed;
}
.golden-core button:focus-visible {
  outline: 2px solid #ffd884;
}
.choice {
  margin: 12px 0;
}
.choice small {
  display: block;
}
.choice > small {
  color: #e3cfac;
}
@media (max-width: 480px) {
  .golden-core {
    padding: 12px;
  }
  .golden-core button {
    width: 100%;
  }
}
</style>
