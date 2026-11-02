<script setup lang="ts">
import CharacterSprite from "../presentation/CharacterSprite.vue";
import { heroArt, heroBattlePose } from "../presentation/art";
import { passageIds, passagePlan } from "./passage";
import { preparationReady } from "./preparation";
import QiPeoplePanel from "./QiPeoplePanel.vue";
import QiPreparationPanel from "./QiPreparationPanel.vue";
import { computed } from "vue";
import type { State, Intent } from "../core";
import { qiGoal, qiError, qiEnemy, qiPreview, qiPower, qiEnemyTell } from "./rules";
import { qiTacticalCue, medicineOpening } from "./tactics";
import { qiSites, qiRoutes, commissions, type QiAction } from "./content";
import { moves, type Move } from "../expedition/content";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{
  act: [intent: Intent];
  facilities: [];
  board: [];
  gear: [];
  sect: [];
  inventory: [];
}>();
const q = computed(() => props.game.qiJourney);
const site = computed(() => qiSites[q.value.gates]);
const enemy = computed(() => qiEnemy(props.game));
const locked = (a: QiAction) => props.busy || !!qiError(props.game, a);
const act = (action: QiAction) => emit("act", { type: "qiJourney", action });
const passages = computed(() =>
  passageIds.map((action) => ({
    action,
    ...passagePlan(props.game, action, qiPower(props.game).hp),
  })),
);
const preview = (move: Move) => qiPreview(props.game, move);
</script>
<template>
  <section v-if="!game.realm" class="qi-journey" aria-label="炼气历练与晋升">
    <h3>
      炼气道途 ·
      {{
        q.gates === 0 ? "淬脉入后期" : q.gates === 1 ? "凝元至圆满" : "准备筑基"
      }}
    </h3>
    <p>{{ qiGoal(game) }}</p>
    <p v-if="game.qi < 120">
      先打坐积累修为，熟悉功法。中期再准备药谷历练；灵石留给研修、法器与补给。
    </p>
    <p class="resources">
      灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 根基
      {{ game.foundation }} · 伤势 {{ game.injury }}
    </p>
    <p v-if="q.last" role="status">{{ q.last }}</p>
    <QiPreparationPanel
      :game="game"
      :busy="busy"
      @act="emit('act', $event)"
      @sect="emit('sect')"
    />
    <template v-if="q.duel && enemy">
      <h4>{{ enemy.name }} · 炼气{{ site?.stage === 1 ? "中期" : "后期" }}</h4>
      <div class="combat-art">
        <CharacterSprite
          :character="heroArt(game.social.gender, game.realm)"
          :pose="heroBattlePose(q.duel.effect)"
          :label="game.name"
        />
        <img
          class="enemy-art"
          :src="enemy.image"
          :alt="`${enemy.name} · ${enemy.kind}`"
        />
      </div>
      <p>{{ enemy.trait }}</p>
      <p v-if="enemy.kind === '妖兽'">守势可收力护身：伤害 −3、承伤 −4；抢攻则争取尽早结束交锋。</p>
      <p>{{ qiEnemyTell(game) }}</p>
      <p v-if="!medicineOpening(game, enemy.identity)">{{ qiTacticalCue(game, enemy.identity) }}</p>
      <label
        >自身气势 {{ q.duel.hp }} / {{ qiPower(game).hp
        }}<progress :value="q.duel.hp" :max="qiPower(game).hp"
      /></label>
      <label
        >敌方气势 {{ q.duel.enemy }} / {{ enemy.hp
        }}<progress :value="q.duel.enemy" :max="enemy.hp"
      /></label>
      <div class="qi-actions">
        <button
          v-for="(label, move) in moves"
          :key="move"
          :disabled="busy"
          @click="act(move)"
        >
          {{ label
          }}<small
            >伤害 {{ preview(move)?.damage }} · 承伤
            {{ preview(move)?.incoming }} · 回气 {{ preview(move)?.healing }} ·
            耗草 {{ preview(move)?.herbs }}</small
          >
        </button>
      </div>
    </template>
    <template v-else-if="q.node === 2">
      <h4>灵流逆涌 · 剩余气势 {{ q.vigor }}</h4>
      <p>守关者就在前方。护脉丹最多恢复 26 气势，灵瓶与熟练功法可省下耗材；看看哪种已够用，择一即可。</p>
      <div class="qi-actions">
        <button
          v-for="p in passages"
          :key="p.action"
          :disabled="busy || !!p.error"
          @click="act(p.action)"
        >
          {{ p.label }} · {{ p.cost
          }}<small
            >进入下一战气势 {{ p.vigor }} · {{ p.error || "可以通行" }}</small
          >
        </button>
      </div>
    </template>
    <template v-else-if="q.essence">
      <h4>
        <img
          class="material-art"
          :src="`/art/qi-progression/${q.gates ? 'condensed-essence' : 'dew-herb'}.webp`"
          alt=""
        />炼化{{ site?.material }}
      </h4>
      <div class="qi-actions">
        <button
          v-for="a in ['refine', 'mentor', 'artisan'] as const"
          :disabled="locked(a)"
          @click="act(a)"
        >
          {{
            a === "refine"
              ? "自行炼化：灵石 24、灵草 4、心得 2"
              : a === "mentor"
                ? "师门护脉：灵石 12、贡献 4"
                : "请坊市匠师：灵石 48"
          }}<small>{{
            qiError(game, a) || "耗时一月，材料消耗后突破此段瓶颈"
          }}</small>
        </button>
      </div>
    </template>
    <template v-else-if="site && game.qi >= 120">
      <details :open="preparationReady(game)">
        <summary>
          晋升秘境 · {{ site.name
          }}{{
            preparationReady(game) ? " · 已具备准备" : " · 先走通一条成长路线"
          }}
        </summary>
        <h4>{{ site.name }}</h4>
        <img
          :src="site.image"
          :alt="site.name"
          class="site-art"
          loading="lazy"
        />
        <p>{{ site.intro }}</p>
        <p>
          两场交锋之间须穿过险地，气势不会自动补满。每次入内需一月、灵石
          {{ site.fee }}；可撤退准备后再来。
        </p>
        <details>
          <summary>行前准备建议</summary>
          <p>
            灵剑利于抢攻；灵瓶持续减伤，途中还能护脉通行。主修研至熟练后，具备神识 8、心得 2 可不耗材穿阵并恢复气势；护脉丹恢复更多，适合这次救急。长春诀守势会耗草回气。选择一项主要投入，留足盘缠即可尝试。
          </p>
        </details>
        <div class="qi-actions">
          <button
            v-for="(route, key) in qiRoutes"
            :key="key"
            :disabled="locked(`enter:${key}`)"
            @click="act(`enter:${key}`)"
          >
            {{ route.name }}<small>{{ key === 'medicine' && q.gates > 0 ? '灵草 4；入内耗草，气势上限 +12。内府傀儡不受药气诱引。' : route.hint }}</small
            ><small>{{
              qiError(game, `enter:${key}`) || "准备就绪，出发"
            }}</small>
          </button>
        </div>
      </details>
    </template>
    <button v-if="q.node" :disabled="busy" @click="act('withdraw')">
      撤回山下 · 保留修为，已用补给不退
    </button>
    <template v-else-if="game.qi >= 120">
      <details :open="game.stones < 24">
        <summary>筹措物资 · 山下委托</summary>
        <p>
          每份委托只领一次报酬。缺灵石可劳作或接师门差事；购药研修前，记得留些盘缠。
        </p>
        <div class="qi-actions">
          <button
            v-for="(c, key) in commissions"
            :disabled="locked(`commission:${key}`)"
            @click="act(`commission:${key}`)"
          >
            {{ c.name }}<small>{{ c.need }} · {{ c.reward }}</small
            ><small>{{
              qiError(game, `commission:${key}`) || "一月完成并交付"
            }}</small>
          </button>
        </div>
      </details>
      <details>
        <summary>坊市成品 · 花灵石省去自制准备</summary>
        <p>
          成品即时交付；买到法器后须在储物袋装配。回春散只能治疗伤势，不能在秘境中恢复气势。
        </p>
        <button
          v-for="a in ['buy:healing', 'buy:sword', 'buy:vial'] as const"
          :disabled="locked(a)"
          @click="act(a)"
        >
          {{
            a === "buy:healing"
              ? "回春散 · 灵石 12"
              : a === "buy:sword"
                ? "听松灵剑 · 灵石 40"
                : "归元灵瓶 · 灵石 40"
          }}<small>{{ qiError(game, a) }}</small>
        </button>
      </details>
      <div class="qi-actions">
        <button
          :disabled="busy || !!game.pending"
          @click="emit('act', { type: 'supplies' })"
        >
          坊市购草 · 灵石 8 换灵草 4
        </button>
        <button :disabled="busy" @click="emit('facilities')">功法研修</button>
        <button :disabled="busy" @click="emit('gear')">
          丹药与法器 · 自制、采购、委托
        </button>
        <button :disabled="busy" @click="emit('sect')">
          师门差事 · 赚取灵石与护脉贡献
        </button>
        <button :disabled="busy" @click="emit('inventory')">
          储物袋 · 装配法器、服药疗伤
        </button>
        <button :disabled="busy" @click="emit('board')">
          听松试剑榜 · 试招与功法奖励
        </button>
      </div>
    </template>
  </section>
  <QiPeoplePanel
    v-if="!q.node"
    :game="game"
    :busy="busy"
    @act="emit('act', $event)"
    @inventory="emit('inventory')"
    @facilities="emit('facilities')"
  />
</template>
<style scoped>
.combat-art {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 12px;
  height: 140px;
  margin: 8px 0;
}
.combat-art :deep(.character-sprite) {
  width: 40%;
  height: 140px;
}
.enemy-art {
  width: 40%;
  height: 140px;
  object-fit: contain;
  border-radius: 6px;
}
.site-art {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: contain;
  border-radius: 6px;
}
.material-art {
  width: 64px;
  height: 64px;
  object-fit: contain;
  vertical-align: middle;
}
.qi-journey {
  border: 1px solid #a9986d;
  padding: 14px;
  margin: 14px 0;
  border-radius: 8px;
  background: #14271fee;
  color: #f4ead3;
}
.qi-journey h3,
.qi-journey h4 {
  color: #f4dfaa;
}
.qi-journey p {
  line-height: 1.65;
}
.resources {
  font-variant-numeric: tabular-nums;
}
.qi-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
  gap: 8px;
  margin: 10px 0;
}
.qi-actions button {
  white-space: normal;
  text-align: left;
  padding: 10px;
  line-height: 1.5;
}
.qi-actions small {
  display: block;
}
label {
  display: block;
  margin: 8px 0;
}
progress {
  display: block;
  width: 100%;
  accent-color: #b8d393;
}
summary {
  cursor: pointer;
}
.qi-actions button:disabled {
  opacity: 1;
  background: #38483c;
  color: #d9e1d4;
  border: 1px solid #778571;
  cursor: not-allowed;
}
</style>
