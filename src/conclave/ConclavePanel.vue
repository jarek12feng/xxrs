<script setup lang="ts">
import { computed } from "vue";
import type { State, Intent } from "../core";
import { actionError } from "../core";
import {
  conclaveQuote,
  conclaveGoal,
  conclaveExchange,
  conclaveFoe,
  conclaveSupplement,
  type ConclaveAction,
} from "./rules";
import { goldenCap } from "./state";
import { rivals, tell } from "./content";
import CultivationOutlook from "../CultivationOutlook.vue";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const c = computed(() => props.game.conclave);
const active = computed(() => c.value.location !== "away");
const due = computed(
  () =>
    props.game.outerSea.notice !== null &&
    props.game.month >= props.game.outerSea.notice + 600,
);
const choices = computed(() => {
  const s = props.game,
    t = c.value;
  const rows: { label: string; action: ConclaveAction }[] = [];
  const add = (label: string, action: ConclaveAction) =>
    rows.push({ label, action });
  if (t.duel) {
    for (const [move, label] of [
      ["guard", "守势"],
      ["strike", "反击"],
      ["discern", "辨影"],
    ] as const) {
      const p = conclaveExchange(s, move)!;
      add(
        `${label} · 伤害 ${p.damage} / 承伤 ${p.incoming}${p.healing ? ` / 耗草 ${p.herbs} 回气 ${p.healing}` : ""}`,
        { kind: "move", move },
      );
    }
    add("收势撤回 · 保留此前进度", { kind: "withdraw" });
  } else if (t.location === "vault") {
    add("应对守阵者", { kind: "fight" });
    add("撤回会谷 · 行装保留", { kind: "withdraw" });
  } else {
    if (!t.stage && s.outerSea.cleared === 2)
      add("凝炼丹元 · 突破金丹中期", { kind: "mid" });
    if (t.stage === 1 && t.depth === 2)
      add("融汇丹元 · 突破金丹后期", { kind: "late" });
    if (t.location === "away" && due.value && s.outerSea.location === "ferry")
      add("循道友来信，赴诸宗会谷", { kind: "visit" });
    if (t.location === "court") {
      if (!t.introduced) add("与各宗来客相识，听清入境之约", { kind: "meet" });
      else {
        if (t.preparation !== "ward")
          add("随顾沧遥演练守势 · 本程护体 +3", {
            kind: "training",
            style: "ward",
          });
        if (t.preparation !== "insight")
          add("与叶问苓推演潮阵 · 本程辨影伤害 +6", {
            kind: "training",
            style: "insight",
          });
        if (t.wins < 3)
          add(
            `${t.wins === 2 ? "自愿争优切磋" : "登台争取入境资格"} · ${rivals[t.wins]!.name}`,
            { kind: "contest" },
          );
        if (t.wins >= 2) {
          if (t.route === "none") {
            add("背潮石道 · 六月入境，气势 +16", {
              kind: "route",
              route: "shelter",
            });
            add("循主流抢渡 · 两月入境，反击伤害 +5", {
              kind: "route",
              route: "current",
            });
          }
          if (t.route !== "none" && t.depth < 2)
            add(t.supplies ? "循已知路线入归潮秘境" : "筹备归潮行装", {
              kind: t.supplies ? "enter" : "prepare",
            });
        }
      }
      add("离会回古渡 · 胜绩保留", { kind: "leave" });
    }
    if (t.depth && !t.attuned)
      add("温养定神珠 · 护体 +5，抵御识海阵压", { kind: "attune" });
    if (t.depth === 2) {
      if (t.method !== "inherit")
        add("参悟抱元录，承接旧法 · 伤害 +5", {
          kind: "method",
          method: "inherit",
        });
      if (t.method !== "still")
        add("转修抱元守神法 · 护体 +6，暂收旧法招式", {
          kind: "method",
          method: "still",
        });
    }
  }
  return rows.map((r) => ({ ...r, quote: conclaveQuote(s, r.action) }));
});
const safe = computed(
  () =>
    !c.value.duel &&
    c.value.location !== "vault" &&
    props.game.outerSea.location !== "ruins",
);
const waitMonths = computed(() =>
  Math.min(
    120,
    Math.max(
      0,
      (props.game.outerSea.notice ?? props.game.month) + 600 - props.game.month,
    ),
  ),
);
</script>
<template>
  <section
    v-if="
      game.realm === 2 &&
      (game.outerSea.notice !== null || game.outerSea.cleared === 2)
    "
    class="conclave"
    aria-label="诸宗会与凝婴机缘"
  >
    <img
      v-if="active"
      class="scene"
      :src="
        c.location === 'vault'
          ? '/art/conclave/vault.webp'
          : '/art/conclave/court.webp'
      "
      :alt="
        c.location === 'vault' ? '归潮秘境的古阵石庭' : '山谷间的诸宗斗法石台'
      "
      loading="lazy"
    />
    <h3>
      {{
        c.location === "vault"
          ? "归潮秘境"
          : active
            ? conclaveSupplement(game)
              ? "会谷补试 · 旧胜绩照录"
              : "诸宗会 · 会谷石台"
            : "来信与下一段道途"
      }}
    </h3>
    <p>{{ conclaveGoal(game) }}</p>
    <p v-if="c.last" role="status">{{ c.last }}</p>
    <p>
      修为 {{ game.outerSea.cultivation }} / {{ goldenCap(game) }} · 入境胜绩
      {{ Math.min(c.wins, 2) }} / 2 · 秘境 {{ c.depth }} / 2
    </p>
    <p>
      灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 伤势 {{ game.injury }}
    </p>
    <p v-if="game.outerSea.notice !== null && !due">
      距约定会期还有
      {{ Math.floor((game.outerSea.notice + 600 - game.month) / 12) }} 年
      {{ (game.outerSea.notice + 600 - game.month) % 12 }}
      月。可先修行、温养与备战。
    </p>
    <p v-if="due && !active">
      会谷来信已到古渡。正会之后仍有各宗补试，已有胜绩不作废。
    </p>
    <div
      v-if="c.introduced && c.location === 'court' && !c.duel"
      class="people"
    >
      <p v-for="r in rivals" :key="r.name">
        <strong>{{ r.name }} · {{ r.sect }}</strong
        ><br />{{ r.aim }}
      </p>
    </div>
    <div v-if="c.duel" aria-label="当前交锋">
      <h4>{{ conclaveFoe(game).name }} · 金丹中期</h4>
      <p>
        你的气势 {{ c.duel.hp }} / 对手气势 {{ c.duel.enemy }} · 第
        {{ c.duel.turn + 1 }} 合
      </p>
      <p>{{ tell[conclaveFoe(game).pattern[c.duel.turn % 3]!] }}</p>
    </div>
    <div v-for="row in choices" :key="row.label" class="conclave-choice">
      <button
        :disabled="busy || !!row.quote.error"
        @click="emit('act', { type: 'conclave', action: row.action })"
      >
        {{ row.label }}</button
      ><small
        v-if="
          row.quote.months ||
          row.quote.stones ||
          row.quote.herbs ||
          row.quote.error
        "
        >{{ row.quote.months }} 月 · 灵石 {{ row.quote.stones }} · 灵草
        {{ row.quote.herbs
        }}<template v-if="row.quote.error">
          · {{ row.quote.error }}</template
        ></small
      >
    </div>
    <template v-if="safe">
      <CultivationOutlook
        v-if="active"
        :game="game"
        :busy="busy"
        automatic
        @act="emit('act', $event)"
      />
      <button
        v-if="game.injury"
        :disabled="busy || !!actionError(game, 'rest')"
        @click="emit('act', { type: 'advance', activity: 'rest', months: 1 })"
      >
        静养一月
      </button>
      <button
        v-if="active"
        :disabled="busy || !!actionError(game, 'work')"
        @click="emit('act', { type: 'advance', activity: 'work', months: 6 })"
      >
        劳作半年筹资
      </button>
      <button
        v-if="active"
        :disabled="busy || game.stones < 8"
        @click="emit('act', { type: 'supplies' })"
      >
        购置灵草 · 灵石 8
      </button>
      <button
        v-if="!due && game.outerSea.notice !== null"
        :disabled="busy || !!conclaveQuote(game, { kind: 'wait' }).error"
        @click="emit('act', { type: 'conclave', action: { kind: 'wait' } })"
      >
        留居候会 · 最多 {{ waitMonths }} 月，消耗同等寿元
      </button>
      <button
        v-if="active && game.month < c.retryAt"
        :disabled="busy || !!conclaveQuote(game, { kind: 'wait' }).error"
        @click="emit('act', { type: 'conclave', action: { kind: 'wait' } })"
      >
        候至可再登台 · 最多六月
      </button>
    </template>
    <details>
      <summary>凝婴所需与所得用途</summary>
      <p>
        定神珠：{{ c.depth ? "已取得" : "须在归潮外殿争取" }}；{{
          c.attuned ? "已温养，护体 +5" : "温养后才能抵御深处阵压"
        }}。
      </p>
      <p>
        抱元凝神录：{{
          c.depth === 2
            ? "已取得，参悟或转修后可接续金丹后期"
            : "须通过深处照神阵枢"
        }}。
      </p>
      <p>
        化婴丹：{{
          c.depth === 2
            ? "已取得一份主材凝婴灵髓，尚未炼成丹药"
            : "主材可在归潮深处寻找"
        }}。圆满试炼、化婴丹炼制与元婴叩关尚未开放，宝物不能代替丹药。
      </p>
    </details>
  </section>
</template>
<style scoped>
.conclave {
  margin: 16px 0;
  padding: 18px;
  background: #233c43;
  color: #f4e7cb;
  border: 1px solid #8da7a1;
  border-radius: 10px;
  display: flow-root;
}
.scene {
  float: right;
  width: min(43%, 480px);
  aspect-ratio: 16/9;
  object-fit: contain;
  margin: 0 0 14px 18px;
  border-radius: 8px;
}
.conclave-choice {
  margin: 12px 0;
}
.conclave-choice small {
  display: block;
  color: #dfcfaa;
}
.conclave button {
  background: #304e56;
  color: #fff2d4;
  border: 1px solid #a8c1b8;
  border-radius: 6px;
  padding: 10px 12px;
  max-width: 100%;
  text-align: left;
  white-space: normal;
  margin: 4px 0;
}
.conclave button:disabled {
  background: #303c3c;
  color: #c3ccc5;
}
.conclave button:focus-visible {
  outline: 2px solid #f9d480;
}
.people {
  clear: both;
}
.people p {
  padding: 10px;
  background: #1d333a;
  border-radius: 8px;
}
details {
  clear: both;
  margin-top: 14px;
}
@media (max-width: 600px) {
  .conclave {
    padding: 12px;
  }
  .scene {
    float: none;
    width: 100%;
    margin: 0;
  }
  .conclave button {
    width: 100%;
  }
}
</style>
