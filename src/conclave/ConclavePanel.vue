<script setup lang="ts">
import { projectInteractions } from "../story-interactions";
import FieldLoadout from "../equipment/FieldLoadout.vue";
import GoldenWorld from "../golden-scene/GoldenWorld.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import { goldenCombat } from "../golden-scene/presentation";

import { computed, ref, watch } from "vue";
import { conclaveObject } from "../scene2d/golden-objects";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
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
import { conclaveLessons, victoryMemory } from "./victories";
import { battleSignal } from "./battle-feedback";
import { rivals } from "./content";
import CultivationOutlook from "../CultivationOutlook.vue";
const props = defineProps<{
  game: State;
  busy: boolean;
  entryObject?: string;
}>();
const emit = defineEmits<{ act: [intent: Intent]; shore: []; meeting: [] }>();
const signal = computed(() => battleSignal(props.game));
const defeat = computed(() => !props.game.conclave.duel && props.game.conclave.last.includes("本场复盘："));
const useHerbs = ref(true);
const lessons = computed(() => conclaveLessons(props.game));
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
      const p = conclaveExchange(s, move, useHerbs.value)!;
      add(
        `${label} · 伤害 ${p.damage} / 承伤 ${p.incoming}${p.healing ? ` / 耗草 ${p.herbs} 回气 ${p.healing}` : ""}`,
        { kind: "move", move, useHerbs: useHerbs.value },
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
        if(t.preparation !== "none") add("按自身功法备战 · 不耗年月与物资，撤去演练加成",{kind:"training",style:"none"});
        if (t.preparation !== "ward")
          add("随顾沧遥演练守势 · 本程护体 +3，辨后守势承伤再 −5", {
            kind: "training",
            style: "ward",
          });
        if (t.preparation !== "insight")
          add("与叶问苓推演潮阵 · 本程辨影伤害 +6，辨后反击再 +8", {
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
            add(`背潮石道 · 六月入境，气势 +${16+lessons.value.shelterHp}`, {
              kind: "route",
              route: "shelter",
            });
            add(`循主流抢渡 · 两月入境，反击伤害 +${5+lessons.value.currentDamage}`, {
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
      add("温养定神珠 · 可出战护体 +5，温养抵御阵压", { kind: "attune" });
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
  return projectInteractions(s, rows, conclaveQuote);
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

// The selected object is presentation state; opening it never dispatches a command.
const selected = ref(props.entryObject ?? "");
const stageKey = computed(
  () => `conclave-${c.value.location}-${c.value.depth}`,
);
const actionObject = (action: ConclaveAction) => action.kind === "training"
  ? (action.style === "none" ? "friends" : action.style === "ward" ? "gu" : "ye") : conclaveObject(action.kind);
const hotspots = computed(() => {
  if (c.value.duel) return [];
  const ids = new Set<string>(
    choices.value.map((row) => actionObject(row.action)),
  );
  if (safe.value) ids.add("chamber");
  if (c.value.location === "court") { ids.add("friends"); ids.add("gu"); ids.add("ye"); }
  if (c.value.location === "away") ids.add("shore");
  return [
    { id: "gu", label: "顾沧遥", x: 44, y: 77 },
    { id: "ye", label: "叶问苓", x: 56, y: 77 },
    { id: "shore", label: "古渡石道", x: 78, y: 77 },
    {
      id: "friends",
      label: c.value.introduced ? "商议入境路线" : "与会谷来客相识",
      x: c.value.location === "court" ? 50 : 43,
      y: c.value.location === "court" ? 88 : 63,
    },
    {
      id: "arena",
      label:
        c.value.location === "vault"
          ? conclaveFoe(props.game).name
          : c.value.wins < 3
            ? rivals[c.value.wins]!.name + " · 斗法台"
            : "斗法台",
      x: 71,
      y: c.value.location === "court" ? 77 : 64,
    },
    { id: "path", label: "归潮秘境入口", x: 63, y: 65 },
    { id: "treasure", label: "定神珠与抱元录", x: 45, y: 78 },
    {
      id: "chamber",
      label: active.value ? "会谷歇脚处" : "临海静修处",
      x: 20,
      y: 57,
    },
    { id: "letter", label: "道友来信", x: 40, y: 57 },
    {
      id: "exit",
      label: c.value.location === "vault" ? "回谷石阶" : "古渡归路",
      x: 14,
      y: 77,
    },
  ].filter((row) => ids.has(row.id));
});
const combat = computed(() => goldenCombat(props.game, "conclave"));
const combatOptions = computed(() =>
  choices.value
    .filter((row) => row.action.kind === "move")
    .map((row) => ({
      id: row.action.kind === "move" ? row.action.move : "",
      label: row.label.split(" · ")[0]!,
      detail: row.label.split(" · ").slice(1).join(" · "),
      disabled: !row.available,
    })),
);
function move(id: string) {
  const row = choices.value.find(
    (row) => row.action.kind === "move" && row.action.move === id,
  );
  if (row && !props.busy && !row.quote.error)
    emit("act", { type: "conclave", action: row.action });
}
const shown = computed(() =>
  c.value.duel
    ? []
    : choices.value.filter(
        (row) => actionObject(row.action) === selected.value,
      ),
);
watch(() => c.value.last, () => { if (defeat.value) selected.value = "chamber"; }, {immediate:true, flush:"post"});
watch(stageKey, () => {
  selected.value = defeat.value ? "chamber" : "";
});
</script>
<template>
  <NarrativeStage
    v-if="
      game.realm === 2 &&
      (game.outerSea.notice !== null || game.outerSea.cleared === 2)
    "
    class="conclave"
    aria-label="诸宗会与凝婴机缘"
    :stage-key="stageKey"
    :image="
      c.location === 'vault'
        ? '/art/conclave/vault.webp'
        : active
          ? '/art/conclave/court-empty-v1.webp'
          : '/art/outer-sea/ferry.webp'
    "
    :title="
      c.location === 'vault'
        ? '归潮秘境'
        : active
          ? conclaveSupplement(game)
            ? '会谷补试 · 旧胜绩照录'
            : '诸宗会 · 会谷石台'
          : due
            ? '古渡 · 道友来信'
            : '古渡 · 道友之约'
    "
    :goal="conclaveGoal(game)"
    :hotspots="hotspots"
    :active="selected"
    :battle="!!c.duel"
    @select="$event === 'shore' ? emit('shore') : (selected = $event)"
    @close="selected = ''"
  >
    <template #world>
      <GoldenWorld
        :busy="busy"
        :game="game"
        domain="conclave"
        :focus="selected"
        @performed="selected = defeat ? 'chamber' : ''"
        @select="$event === 'shore' ? emit('shore') : (selected = $event)"
      />
      <div v-if="signal" class="battle-signal" role="status" aria-label="敌方来势">
        <strong>{{ signal.title }}</strong><span>{{ signal.next }}</span>
      </div>
      <CombatBar
        v-if="combat && c.duel"
        :turn="combat.turn"
        :player="combat.player"
        :player-max="combat.playerMax"
        :enemy="combat.enemy"
        :enemy-max="combat.enemyMax"
        :enemy-name="combat.enemyName"
        :tell="signal?.cue ?? ''"
        :options="combatOptions"
        :busy="busy"
        retreat-label="收势撤回 · 保留此前进度"
        @move="move"
        @retreat="
          emit('act', { type: 'conclave', action: { kind: 'withdraw' } })
        "
      ><template #preparation><label class="battle-medicine"><input v-model="useHerbs" type="checkbox" :disabled="busy" />允许守势用药 · 关闭可保留灵草，预览随选择更新</label></template></CombatBar>
    </template>
    <template #status
      ><span
        >修为 {{ game.outerSea.cultivation }}/{{ goldenCap(game) }} · 入境胜绩
        {{ Math.min(c.wins, 2) }}/2 · 秘境 {{ c.depth }}/2</span
      ></template
    >

    <template v-if="selected === 'gu' || selected === 'ye'">
      <p>{{ selected === 'gu' ? '顾沧遥邀你演练守势，稳住阵前护体。' : '叶问苓与你推演潮阵，辨认阵中虚实。' }}</p>
      <p v-if="c.preparation === (selected === 'gu' ? 'ward' : 'insight')">本程已采用此项准备。</p>
      <button @click="selected = 'friends'">{{ c.introduced ? '一同商议入境路线' : '与两位道友相识' }}</button>
    </template>
    <div v-if="selected === 'friends' || selected === 'gu' || selected === 'ye'" class="preparation-tradeoffs">
      <p>演练择一，不叠加，也不要求购买；切换不会返还此前耗费。</p>
      <p>自行备战：零费用，依靠已有功法与器物。守势演练：半年、灵石 12，护体与辨后守势减伤。潮阵推演：半年、灵石 6，辨影与辨后抢攻增伤。</p>
      <p>长春守势可耗草回气，也可在战中关闭用药保留灵草；剑经偏向抢攻，归元息偏向辨阵，均沿用已学功法。</p>
      <p v-if="lessons.gu">{{ lessons.gu }}</p><p v-if="lessons.ye">{{ lessons.ye }}</p>
    </div>
    <p v-if="selected === 'friends'">
      {{
        c.introduced
          ? "与道友推演守势和潮阵，再选一条入境路线。"
          : "石台旁，各宗来客正在商议入境之约。"
      }}
    </p>
    <template
      v-if="
        selected === 'arena' && c.location === 'court' && !c.duel && c.wins < 3
      "
    >
      <p>{{ rivals[c.wins]!.sect }} · {{ rivals[c.wins]!.aim }}</p>
      <p>
        两胜即可入境，第三场自愿争优。失利伤势
        +2，半年后可再试；主动撤回不加伤。
      </p>
    </template>
    <div v-if="defeat && selected === 'chamber'" class="defeat-review">
      <h3>调息与再战</h3><p>{{ c.last }}</p>
      <p>可在此换装、购草和静养，再按当前报价登台；此前胜绩与秘境进度保留。</p>
      <button @click="selected = game.month < c.retryAt || c.wins < 2 ? 'arena' : 'path'">查看再战条件</button>
      <button @click="selected = 'gu'">查看守势演练</button>
      <button @click="selected = 'ye'">查看潮阵推演</button>
    </div>
    <p v-if="selected === 'chamber'">
      灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 伤势 {{ game.injury }}
    </p>
    <p v-if="game.outerSea.notice !== null && !due && selected === 'chamber'">
      距约定会期还有
      {{ Math.floor((game.outerSea.notice + 600 - game.month) / 12) }} 年
      {{ (game.outerSea.notice + 600 - game.month) % 12 }}
      月。可先修行、温养与备战。
    </p>
    <p v-if="selected === 'letter'">
      会谷来信已到古渡。正会之后仍有各宗补试，已有胜绩不作废。
    </p>
    <p v-if="selected === 'treasure'">
      定神珠{{
        c.attuned ? "已温养；出战后护体 +5" : "温养后抵御深处识海阵压"
      }}。抱元守神法与旧法招式不叠加；旧功法与研修保留。
    </p>

    <div v-for="row in shown" :key="row.id" class="scene-choice">
      <button
        :disabled="busy || !row.available"
        @click="emit('act', { type: 'conclave', action: row.action })"
      >
        {{ row.label.split(" · ")[0] }}
      </button>
      <small v-if="row.label.includes(' · ')">{{
        row.label.split(" · ").slice(1).join(" · ")
      }}</small>
      <small
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
    <FieldLoadout v-if="safe && (selected === 'chamber' || selected === 'treasure')"
      :game="game" :busy="busy" @act="emit('act', $event)" />
    <template v-if="safe && selected === 'chamber'">
      <details class="retreat-plan">
        <summary>安排闭关</summary>
        <CultivationOutlook
          :game="game"
          :busy="busy"
          automatic
          @act="emit('act', $event)"
        />
      </details>
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
        留居候会 · 最多 {{ Math.floor(waitMonths / 12) }} 年
        {{ waitMonths % 12 }} 月，消耗同等寿元
      </button>
      <button
        v-if="active && game.month < c.retryAt"
        :disabled="busy || !!conclaveQuote(game, { kind: 'wait' }).error"
        @click="emit('act', { type: 'conclave', action: { kind: 'wait' } })"
      >
        候至可再登台 · 最多六月
      </button>
    </template>

    <details v-if="c.last">
      <summary>刚才的经过</summary>
      <p role="status">{{ c.last }}</p>
    </details>
    <template #notes>
      <details v-if="c.victories.length"><summary>道友记下的交锋</summary><p v-for="v in c.victories" :key="v.kind+v.index">{{ victoryMemory(v) }}</p></details>
      <p v-if="game.outerSea.notice !== null && !due">
        距约定会期还有
        {{ Math.floor((game.outerSea.notice + 600 - game.month) / 12) }} 年
        {{ (game.outerSea.notice + 600 - game.month) % 12 }} 月。
      </p>
      <p v-for="r in c.introduced ? rivals : []" :key="r.name">
        <strong>{{ r.name }} · {{ r.sect }}</strong
        ><br />{{ r.aim }}
      </p>
      <details>
        <summary>凝婴所需与所得用途</summary>
        <p>
          定神珠：{{ c.depth ? "已取得" : "须在归潮外殿争取" }}；{{
            c.attuned ? "已温养；出战后护体 +5" : "温养后才能抵御深处阵压"
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
      <p v-if="c.last">{{ c.last }}</p>
    </template>
  </NarrativeStage>
</template>
<style scoped>
.conclave :deep(.battle-inspector) {
  display: none;
}
.conclave :deep(.narrative-inspector:not(.narrative-notes)) {
  top: auto;
  bottom: 24px;
  max-height: 48%;
  height: auto;
  width: min(400px, 35%);
  padding: 16px;
}
.conclave.in-combat :deep(.narrative-goal) {
  display: none;
}
@media (max-width: 900px) {
  .conclave :deep(.narrative-inspector:not(.narrative-notes)) {
    width: auto;
    max-height: 42%;
  }
}

.scene-choice {
  margin: 12px 0;
}
.scene-choice small {
  display: block;
  color: #dfcfaa;
}
button {
  display: block;
  margin: 8px 0;
  max-width: 100%;
  padding: 10px 12px;
  color: #fff2d4;
  background: #283e39;
  border: 1px solid #9fb2a1;
  border-radius: 6px;
  text-align: left;
  white-space: normal;
}
button:disabled {
  opacity: 0.58;
}
button:focus-visible {
  outline: 2px solid #f9d480;
}
</style>

<style scoped>
.battle-signal{position:absolute;z-index:5;right:9%;top:20%;max-width:260px;display:grid;gap:6px;padding:12px 16px;border:1px solid #d8b875;background:#142b2bee;color:#fff1d3;pointer-events:none;box-shadow:0 4px 20px #0006}.battle-signal strong{font-size:18px;color:#f2d18e}.battle-signal span{font-size:13px;line-height:1.5}.defeat-review{border-left:3px solid #d8b875;padding-left:12px}.defeat-review button{margin:4px}@media(max-width:760px){.battle-signal{top:16%;right:3%;max-width:180px;padding:8px}.battle-signal strong{font-size:15px}.battle-signal span{font-size:12px}}
</style>

<style scoped>.battle-medicine{display:flex;align-items:center;gap:8px;color:#efe2bd;font-size:13px;margin:4px 0}.preparation-tradeoffs{border-left:2px solid #bba36b;padding-left:10px}</style>
