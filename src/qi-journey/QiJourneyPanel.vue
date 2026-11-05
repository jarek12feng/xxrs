<script setup lang="ts">
import QiNarrativeScene from "./QiNarrativeScene.vue";
import { qiNarrativeActive } from "./narrative";
import QiWorld from "./QiWorld.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import { passageIds, passagePlan } from "./passage";
import { preparationReady } from "./preparation";
import QiPeoplePanel from "./QiPeoplePanel.vue";
import QiPreparationPanel from "./QiPreparationPanel.vue";
import { computed, ref, watch } from "vue";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import type { State, Intent } from "../core";
import { qiGoal, qiError, qiEnemy, qiPreview, qiPower, qiEnemyTell } from "./rules";
import { qiTacticalCue } from "./tactics";
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
// Preparation trials occur on their own route, before entering the promotion site.
const location = computed(() => {
  if (q.value.trial) return {
    medicine: { name: "药谷采药径", image: qiSites[0]!.image },
    sect: { name: "护送山口", image: "/scenes/mist-path.jpg" },
    wander: { name: "古阵外围", image: qiSites[1]!.image },
  }[q.value.trial];
  return q.value.node ? site.value : { name: "听松山下", image: "/scenes/mountain-market.jpg" };
});
const enemy = computed(() => qiEnemy(props.game));
const locked = (a: QiAction) => props.busy || !!qiError(props.game, a);
function act(action: QiAction) {
  if(locked(action))return;
  const commit=()=>{if(!locked(action))emit("act",{type:"qiJourney",action});};
  if(action.startsWith('enter:') || (action==='withdraw' && !q.value.duel)) {
    active.value=''; world.value?.approach({x:action==='withdraw'?12:87,y:87},commit);
  } else { world.value?.cancel(); world.value?.stop(); commit(); }
}
const passages = computed(() =>
  passageIds.map((action) => ({
    action,
    ...passagePlan(props.game, action, qiPower(props.game).hp),
  })),
);
const active = ref("");
const narrativeOpen=ref(false);
const world = ref<InstanceType<typeof QiWorld>>();
function select(id:string) {
  if(id==="narrative" && !props.busy && !props.game.pending && !q.value.node){narrativeOpen.value=true;return;}
  if(props.busy || props.game.pending || props.game.status!=='alive' || q.value.duel)return;
  active.value='';
  const positions:Record<string,number>={journey:53,prepare:37,supplies:22,people:73};
  world.value?.approach({x:positions[id]??35,y:87},()=>{
    if(!props.busy && !props.game.pending && props.game.status==='alive' && !q.value.duel)active.value=id;
  });
}
const stageKey = computed(() => `qi-${q.value.gates}-${q.value.node}-${!!q.value.essence}`);
const hotspots = computed(() => q.value.duel ? [] : q.value.node ? [{ id: "journey", label: "灵流险地", x: 53, y: 45 }] : [
  { id: "journey", label: q.value.essence ? "晋升灵材" : site.value?.name || "筑基前路", x: 60, y: 42 },
  { id: "prepare", label: "山道与历练", x: 35, y: 50 },
  { id: "supplies", label: "坊市摊位", x: 19, y: 72 },
  { id: "narrative", label: props.game.journey.branch === "none" ? "药坪与药窟 · 求学引荐" : "药坪与药窟", x: 48, y: 65 },
  { id: "people", label: "许照岚与裴铸", x: 78, y: 65 },
]);
watch(stageKey, () => { active.value = ""; });
watch(()=>!!q.value.node, entered=>world.value?.reset({x:entered?18:30,y:87}));
watch(()=>props.busy || !!props.game.pending || props.game.status!=='alive',locked=>{if(locked){world.value?.cancel();world.value?.stop();}});
const combatOptions=computed(()=>Object.entries(moves).map(([id,label])=>{
  const p=qiPreview(props.game,id as Move);
  return {id,label,disabled:locked(id as QiAction),detail:`伤害 ${p?.damage} · 承伤 ${p?.incoming} · 回气 ${p?.healing} · 耗草 ${p?.herbs}`};
}));
</script>
<template>
  <QiNarrativeScene v-if="!game.realm && (narrativeOpen || qiNarrativeActive(game))" :game="game" :busy="busy" @act="emit('act',$event)" @close="narrativeOpen=false" />
  <NarrativeStage class="qi-stage" v-else-if="!game.realm" :stage-key="stageKey" :image="location?.image || '/scenes/mist-path.jpg'"
    :title="location?.name || '听松山道'" :goal="qiGoal(game) || ''" :hotspots="hotspots" :active="active" :battle="!!q.duel"
    @select="select" @close="active = ''; world?.cancel()">
    <template #world><QiWorld ref="world" :game="game" @performed="active = ''" />
      <CombatBar v-if="q.duel && enemy" :turn="q.duel.turn" :player="q.duel.hp" :player-max="qiPower(game).hp" :enemy="q.duel.enemy" :enemy-max="enemy.hp" :enemy-name="enemy.name" :tell="qiEnemyTell(game)" :options="combatOptions" :busy="busy" :retreat-disabled="locked('withdraw')" retreat-label="撤回山下 · 已用补给不退" @move="act($event as QiAction)" @retreat="act('withdraw')" />
      <details v-if="q.duel && enemy" class="qi-battle-notes"><summary>敌情与应对</summary><p>{{enemy.trait}}</p><p>{{qiTacticalCue(game,enemy.identity)}}</p><p v-if="enemy.kind==='妖兽'">守势可收力护身：伤害 −3、承伤 −4。</p></details>
    </template>
    <template #status><span>灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 伤势 {{ game.injury }}</span></template>
  <section class="qi-journey" aria-label="炼气历练与晋升">
    <h3 v-if="!q.duel">
      炼气道途 ·
      {{
        q.gates === 0 ? "淬脉入后期" : q.gates === 1 ? "凝元至圆满" : "准备筑基"
      }}
    </h3>

    <p v-if="game.qi < 120">
      先打坐积累修为，熟悉功法。中期再准备药谷历练；灵石留给研修、法器与补给。
    </p>
    <p v-if="!q.duel" class="resources">
      灵石 {{ game.stones }} · 灵草 {{ game.herbs }} · 根基
      {{ game.foundation }} · 伤势 {{ game.injury }}
    </p>
    <p v-if="q.last.includes('暂缓') && !q.duel" role="status" class="interruption-note">{{ q.last }}</p>
    <details v-if="q.last && !q.duel"><summary>刚才的经过</summary><p role="status">{{ q.last }}</p></details>
    <QiPreparationPanel v-if="active === 'prepare'"
      :game="game"
      :busy="busy"
      @act="emit('act', $event)"
      @sect="narrativeOpen=true"
    />
    <template v-if="active === 'journey' && q.node === 2">
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
    <template v-else-if="active === 'journey' && q.essence">
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
    <template v-else-if="active === 'journey' && site && game.qi >= 120">
      <details :open="preparationReady(game)">
        <summary>
          晋升秘境 · {{ site.name
          }}{{
            preparationReady(game) ? " · 成长路线已完成" : " · 先走通一条成长路线"
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
        <details :open="!game.journey.equipped || game.herbs < 8">
          <summary>行前准备建议</summary>
          <p>
            灵剑利于抢攻；灵瓶持续减伤，途中还能护脉通行，但一阶灵瓶不能独自保障两战续航。主修研至熟练可提高伤害，辅修研习可补护体；具备神识 8、心得 2 与熟练主修可不耗材穿阵并恢复气势。护脉丹恢复更多，适合气势损耗较大时救急。长春诀守势会耗草回气，先留足入境费用，再搭配应敌手段与途中恢复；不必买齐所有器物。
          </p>
        </details>
        <p v-if="game.journey.main === 'spring' || game.herbs < 8" class="supply-note">药理护身先耗四株灵草，余下 {{ Math.max(0, game.herbs - 4) }} 株可留给战中回气。入境资格不代表能胜过两场交锋；可先准备法器、研修主修，或备一枚护脉丹供途中恢复。</p>
        <div class="qi-actions">
          <button
            v-for="(route, key) in qiRoutes"
            :key="key"
            :disabled="locked(`enter:${key}`)"
            @click="act(`enter:${key}`)"
          >
            {{ route.name }}<small>{{ key === 'medicine' && q.gates > 0 ? '灵草 4；入内耗草，气势上限 +12。内府傀儡不受药气诱引。' : route.hint }}</small
            ><small>{{
              qiError(game, `enter:${key}`) || "查看行程与消耗"
            }}</small>
          </button>
        </div>
      </details>
    </template>
    <button v-if="q.node" :disabled="busy" @click="act('withdraw')">
      撤回山下 · 保留修为，已用补给不退
    </button>
    <template v-else-if="active === 'supplies' && game.qi >= 120">
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
    v-if="active === 'people' && !q.node"
    :game="game"
    :busy="busy"
    @act="emit('act', $event)"
    @inventory="emit('inventory')"
    @facilities="emit('facilities')"
  />
  </NarrativeStage>
</template>
<style scoped>
.qi-stage :deep(.battle-inspector){display:none}
.qi-battle-notes{position:absolute;left:24px;top:125px;max-width:300px;z-index:5;pointer-events:auto;color:#f3e7cb;background:#102720e8;padding:8px 12px;border:1px solid #b49d6a88}.qi-battle-notes p{font-size:13px;line-height:1.6}
@media(min-width:901px){
  .qi-stage :deep(.battle-inspector){width:330px;right:18px;top:90px;bottom:8px;padding:14px;}
  .qi-stage :deep(.battle-inspector .qi-actions){grid-template-columns:1fr;margin:8px 0;}
  .qi-stage :deep(.battle-inspector .qi-actions button){padding:8px 10px;}
}
.enemy-tell{border-left:2px solid #ddc387;padding-left:10px;color:#ffe7ad}

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
  border: 0;
  padding: 0;
  margin: 0;
  border-radius: 8px;
  background: transparent;
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
