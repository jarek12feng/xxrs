<script setup lang="ts">
import CacheScene from "../item-growth/CacheScene.vue";
import { cacheSite } from "../item-growth/rules";
const cacheOpen = ref(false);
import { knowsInland } from "../wayfaring/discovery";
import SpiritScene from "../spirit/SpiritScene.vue";
import { spiritSite } from "../spirit/rules";
const spiritOpen = ref(false);
import TravelMap from "../wayfaring/TravelMap.vue";
import { preferredTravelMode, travelQuote } from "../wayfaring/rules";
import { foundationApproachPoint } from "./scene-approach";
import FoundationWorld from "./FoundationWorld.vue";
import SecretPactPanel from "../secret-pact/SecretPactPanel.vue";
import { foundationCap, foundationBlock } from "./growth-state";
import CombatField from "../scene2d/combat/CombatField.vue";
import CombatBar from "../scene2d/combat/CombatBar.vue";
import type { Move } from "../expedition/content";
import { heroArt } from "../presentation/art";
import { computed, ref, watch } from "vue";
import NarrativeStage from "../scene2d/NarrativeStage.vue";
import { pactView } from "../secret-pact/view";
import { foundationStoryObjects } from "./local-story";
import { foundationActionObject } from "./scene-objects";
import CombatFeedbackView from "./CombatFeedback.vue";
import type { CombatFeedback } from "./feedback";
import { opponentRealmName } from "../realm-pressure";
import type { State, Intent } from "../world";
import type { JourneyAction } from "./state";
import { challenges, destinations } from "./content";
import { moves } from "../expedition/content";
import {
  foundationExchange,
  foundationPower,
  foundationBattleReadiness,
} from "./combat";
import {
  journeyActionError,
  foundationGoal,
  cultivationStage,
} from "./progression";
import { foundationBoard, journeyOptions, journeyPresentation } from "./view";
import JourneyResult from "./JourneyResult.vue";
import { chapterEnding } from "./aftermath";
import { journeyPreparation } from "./preparation";
import { formatLifeMonths } from "../progression";
import { foundationBattleCue, foundationMoveSetup } from "./battle-cues";
import CultivationOutlook from "../CultivationOutlook.vue";
const props = withDefaults(
  defineProps<{
    game: State;
    combatFeedback?: CombatFeedback | null;
    busy: boolean;
    mode?: "journey" | "board" | "relationship";
  }>(),
  { mode: "journey" },
);
watch(() => cacheSite(props.game), available => { if(!available) cacheOpen.value=false; });
watch(() => props.game.itemGrowth.trial, trial => { if(trial) cacheOpen.value=true; }, {immediate:true});
const emit = defineEmits<{ act: [intent: Intent]; equipment: []; road: [] }>();
watch(() => props.game.spirit.trial, trial => { if(trial?.source === "well") spiritOpen.value = true; }, {immediate:true});
const preparation = computed(() =>
  journeyPreparation(props.game, props.mode === "board"),
);
const ending = computed(() => chapterEnding(props.game));
const q = computed(() => props.game.foundationJourney);
const board = computed(() => foundationBoard(props.game));
const boardReward = computed(
  () =>
    q.value.board.last.split("。").find((line) => line.includes("首胜灵石")) ||
    "",
);
const options = computed(() =>
  journeyOptions(
    props.game,
    props.mode === "relationship" ? "relationship" : "journey",
  ),
);
const battlePreparation = computed(() =>
  q.value.duel ? foundationBattleReadiness(props.game, q.value.duel.id) : null,
);
const foe = computed(() => (q.value.duel ? challenges[q.value.duel.id] : null));
const moveOptions = computed(() =>
  Object.entries(moves).map(([move, label]) => ({
    move: move as keyof typeof moves,
    label,
    preview: foundationExchange(props.game, move as keyof typeof moves),
    setup: foundationMoveSetup(props.game, move as keyof typeof moves),
  })),
);
const battleSnapshot = computed(()=>q.value.duel && foe.value ? {id:q.value.duel.id,turn:q.value.duel.turn,player:q.value.duel.hp,enemy:q.value.duel.enemy,enemyName:foe.value.foe,enemyImage:foe.value.foe.endsWith('阵') ? undefined : foe.value.image,effect:q.value.duel.effect} : null);
const fieldOptions = computed(()=>moveOptions.value.map(m=>({id:m.move,label:m.label,disabled:!!journeyActionError(props.game,{kind:'move',move:m.move}),detail:[
  m.preview ? `伤敌 ${m.preview.damage} / 承伤 ${m.preview.incoming}${m.preview.herbs ? ` / 耗草 ${m.preview.herbs}`:''}${m.preview.healing ? ` / 回气 ${m.preview.healing}`:''}` : '',
  m.preview && q.value.duel && m.preview.incoming>=q.value.duel.hp ? '此招承伤会耗尽气势，回春无法救回；可改招或撤退。' : '',m.setup
].filter(Boolean).join(' · ')})));
function fieldMove(id:string){if(['guard','strike','discern'].includes(id))act({kind:'move',move:id as Move});}
const presentation = computed(() =>
  journeyPresentation(props.game, props.mode === "relationship"),
);
const scene = computed(() =>
  props.mode === "board"
    ? "/scenes/sect-arena.png"
    : props.game.secretPact.site === "zhaoxuan" ? "/art/secret-pact/zhaoxuan-chamber.webp" : props.game.secretPact.site === "brokenStele" ? "/art/world-story/foundation/broken-stele-inn.webp" : `/art/foundation-journey/${destinations[q.value.location].image}.webp`,
);
const active = ref("");
const world = ref<InstanceType<typeof FoundationWorld>>();
function selectObject(id: string) {
  if(props.busy || q.value.duel)return;
  if(id === "cache"){cacheOpen.value=true;return;}
  if(id === "spirit"){spiritOpen.value=true;return;}
  active.value='';
  const arrived=()=>{if(!props.busy && !q.value.duel)active.value=id;};
  if(world.value)world.value.approachObject(foundationApproachPoint(q.value.location,id),arrived);else arrived();
}
function closeObject(){world.value?.cancelMovement();world.value?.skip();active.value='';}
watch(()=>props.busy,busy=>{if(busy)world.value?.cancelMovement();});
const stageKey = computed(
  () =>
    `${props.mode}:${q.value.location}:${presentation.value.image}:${q.value.duel?.id || "peace"}`,
);
watch(stageKey, () => {
  active.value = "";
});
const pact = computed(() => pactView(props.game));
const storyObjects = computed(() => props.mode === 'journey' ? foundationStoryObjects(props.game) : []);
const storyObject = computed(() => storyObjects.value.find(object => object.id === active.value));
const storyActions = computed(() => pact.value.actions.filter(option => storyObject.value?.actions.includes(option.action)));
const storyReceipt = ref('');
watch(active, () => { storyReceipt.value = ''; });
watch(() => props.game.secretPact.last, value => { if(storyObject.value) storyReceipt.value = value; });
const hotspots = computed(() => [
  {
    id: "encounter",
    label:
      props.mode === "board"
        ? "试剑石台"
        : props.mode === "relationship"
          ? "同行与来信"
          : presentation.value.speaker ||
            {
              home: "行前居",
              ferry: "沉井与渡客",
              estate: "药庄",
              snow: "雪线",
              inn: "旅亭",
              frontier: "古道",
            }[q.value.location],
    x: 42,
    y: 57,
  },
  { id: "prepare", label: "随身行囊", x: 23, y: 76 },
  ...(props.mode !== "board"
    ? [{ id: "road", label: "山路与去向", x: 77, y: 49 }]
    : []),
  ...(props.mode === "journey" && pact.value.visible
    ? [{ id: "pact", label: "照玄之约", x: 82, y: 67 }]
    : []),
  ...storyObjects.value,
  ...(props.mode === "journey" && cacheSite(props.game) ? [{id:"cache",label:"侧室石匣 · 前人遗物",x:73,y:36}] : []),
  ...(props.mode === "journey" && spiritSite(props.game) === "well" ? [{id:"spirit",label:props.game.spirit.manual==='learned'?"回声石壁 · 分念诀已通":"沉井回声 · 炼神残篇",x:62,y:42}] : []),
]);
const selectedOptions = computed(() =>
  props.mode === "board"
    ? []
    : options.value.filter(
        (option) => foundationActionObject(option.action) === active.value,
      ),
);
const mapOpen=ref(false),mapDestination=ref<import('../wayfaring/routes').TravelDestination>('ferry');
watch(()=>props.game.wayfaring.trip,trip=>{if(trip){mapDestination.value=trip.to;mapOpen.value=true;}},{immediate:true});
function openTravel(destination:import("../wayfaring/routes").TravelDestination){mapDestination.value=destination;mapOpen.value=true;}
function act(action: JourneyAction) {
  if(props.busy || journeyActionError(props.game,action))return;
  if(action.kind==='travel' && world.value){
    active.value='';
    world.value.approachObject(foundationApproachPoint(q.value.location,'exit'),()=>{
      if(!props.busy && !journeyActionError(props.game,action))openTravel(action.destination);
    });
    return;
  }
  if(action.kind==='travel'){openTravel(action.destination);return;}
  world.value?.cancelMovement();world.value?.skip();
  emit("act", { type: "foundationJourney", action });
}
</script>
<template>
  <section
    class="foundation-panel"
    :class="{'field-battle':!!q.duel}"
    :aria-label="
      mode === 'board'
        ? '听松筑基试剑榜'
        : mode === 'relationship'
          ? '筑基同行与去向'
          : '筑基行旅'
    "
  >
    <CacheScene v-if="(cacheOpen && cacheSite(game)) || game.itemGrowth.trial" :game="game" :busy="busy" @act="emit('act',$event)" @close="cacheOpen=false" />
    <SpiritScene v-else-if="spiritOpen || game.spirit.trial?.source==='well'" :game="game" :busy="busy" @act="emit('act',$event)" @close="spiritOpen=false" />
    <template v-else>
    <TravelMap v-if="mapOpen" :game="game" :busy="busy" :destination="mapDestination" @act="emit('act',$event)" @close="mapOpen=false" />
    <button v-if="!mapOpen && game.wayfaring.trip" @click="openTravel(game.wayfaring.trip.to)">展开途中路图 · 继续剩余行程</button>
    <div v-show="!mapOpen">
    <template v-if="(active === 'pact' || game.secretPact.site !== 'away') && !q.duel">
      <button v-if="game.secretPact.site === 'away'" class="return-to-place" @click="active = ''">
        返回{{ destinations[q.location].name }}
      </button>
      <SecretPactPanel :game="game" :busy="busy" @act="emit('act', $event)" />
    </template>
    <NarrativeStage
      v-else
      :image="mode === 'board' || game.secretPact.site !== 'away' ? scene : presentation.image"
      :title="
        mode === 'board' ? '听松试剑榜 · 筑基组' : destinations[q.location].name
      "
      :stage-key="stageKey"
      :goal="mode === 'board' ? board.next : foundationGoal(game)"
      :hotspots="q.duel ? [] : hotspots"
      :active="active"
      :battle="!!q.duel"
      @select="selectObject"
      @close="closeObject"
    >
      <template #world>
        <FoundationWorld ref="world" :game="game" :mode="mode" @start="active = ''" />
        <CombatField :snapshot="battleSnapshot" :hero="heroArt(game.social.gender,game.realm)" :hero-name="game.name" />
        <CombatBar v-if="q.duel && foe" :turn="q.duel.turn" :player="q.duel.hp" :player-max="foundationPower(game).hp" :enemy="q.duel.enemy" :enemy-max="foe.hp" :enemy-name="`${foe.foe} · ${opponentRealmName(foe)}`" :tell="foundationBattleCue(game)" :options="fieldOptions" :busy="busy" :retreat-disabled="!!journeyActionError(game,{kind:'withdraw'})" retreat-label="沿原路撤退 · 补给不退" @move="fieldMove" @retreat="act({kind:'withdraw'})" />
        <details v-if="q.duel && foe" class="field-battle-details">
          <summary>交锋准备与本合明细</summary>
          <p>{{battlePreparation?.description}} {{battlePreparation?.cooperationNote}}</p>
          <p>基础伤害 {{foundationPower(game).damage}} · 护体 {{foundationPower(game).armor}}。主动撤退不新增伤势；败退伤势 +2，排名与已得成果保留。</p>
          <p v-for="m in moveOptions" :key="m.move">{{m.label}}：{{m.preview?.note || '无额外效果'}}</p>
          <CombatFeedbackView :game="game" :result="combatFeedback" />
          <p role="status">{{q.last}}</p>
        </details>
      </template>
      <template #notes>
        <p>{{ presentation.body || destinations[q.location].intro }}</p>
        <p>
          {{ cultivationStage(game) }} · 修行 {{ q.cultivation }}/600 ·
          当前可积累至 {{ foundationCap(game) }}
        </p>
        <p>{{ foundationBlock(game) }}</p>
        <details v-if="q.last && mode !== 'board'"><summary>刚才经过</summary><p>{{q.last}}</p></details>
      </template>
      <template #status
        ><span
          >{{ cultivationStage(game) }} ·
          {{ q.duel ? "交锋中" : destinations[q.location].name }}</span
        >
        <template v-if="mode === 'board' && !q.duel && q.board.wins.length">
          <small class="board-settlement" role="status"
            >已获胜 {{ q.board.wins.length }} 场 · 首胜奖励已入袋</small
          >
          <small v-if="boardReward" class="board-settlement">{{
            boardReward
          }}</small>
          <button v-if="q.board.last" @click="active = 'encounter'">查看本场经过</button>
        </template>
      </template>
      <aside v-if="mode === 'journey' && q.location === 'home' && !game.adventure.road.surveyed && (active === 'encounter' || active === 'road')" aria-label="青嶂归路指引">
        <p>先沿青嶂旧路到云栈旅亭，记录归路；再回行前居商议同行。</p>
        <button :disabled="busy" @click="emit('road')">前往青嶂旧路</button>
      </aside>
      <CombatFeedbackView
        v-if="!q.duel && active === 'encounter' && mode !== 'relationship'"
        :game="game"
        :result="combatFeedback"
      />
      <section v-if="storyObject && !q.duel" :aria-label="storyObject.label">
        <h3>{{ storyObject.label }}</h3>
        <p>{{ storyObject.body }}</p>
        <p v-if="storyReceipt" role="status">{{ storyReceipt }}</p>
        <button v-for="option in storyActions" :key="option.action"
          :disabled="busy || !option.available"
          @click="emit('act', {type:'secretPact', action:option.action})">
          {{ option.label }}<small>{{ option.detail }}</small><small v-if="option.error">{{ option.error }}</small>
        </button>
      </section>
      <aside
        v-if="
          active === 'prepare' &&
          preparation &&
          mode !== 'relationship' &&
          (preparation.missing ||
            preparation.injury ||
            preparation.needsFunds ||
            preparation.needsHerbs)
        "
        class="foundation-preparation"
        aria-label="当前挑战准备"
      >
        <p v-if="preparation.missing">
          {{
            preparation.optionalBattle ? "同阶应战参考修行" : "下一段需要修行"
          }}
          {{ preparation.target }}，还差 {{ preparation.missing }}。{{
            preparation.optionalBattle ? "也可凭机缘直接越阶挑战。" : ""
          }}本次最多吐纳
          {{ formatLifeMonths(preparation.months) }}，剧情出现时会停下。
        </p>
        <CultivationOutlook
          v-if="preparation.missing"
          :game="game"
          :target="preparation.target"
          :months="preparation.months"
        />
        <button
          v-if="preparation.missing"
          :disabled="busy || preparation.months < 1"
          @click="
            emit('act', {
              type: 'advance',
              activity: 'cultivate',
              months: preparation.months,
            })
          "
        >
          积累修行 · 最多 {{ formatLifeMonths(preparation.months) }}
        </button>
        <button
          v-if="preparation.injury"
          :disabled="busy"
          @click="
            emit('act', {
              type: 'advance',
              activity: 'rest',
              months: preparation.restMonths,
            })
          "
        >
          免费静养 · 最多 {{ preparation.restMonths }} 月
        </button>
        <button
          v-if="preparation.needsHerbs"
          :disabled="busy || game.stones < 8"
          @click="emit('act', { type: 'supplies' })"
        >
          购灵草 4 · 灵石 −8
        </button>
        <p v-if="preparation.needsHerbs">
          长春首合守势或换招转入守势可额外减伤
          4；受击后仍有气势时，每株灵草可回复最多 7 气势。 当前灵草
          {{ game.herbs }}，建议备足 4 株，不是入场条件。
        </p>
        <button
          v-if="preparation.needsFunds"
          :disabled="busy"
          @click="emit('act', { type: 'advance', activity: 'work', months: 1 })"
        >
          劳作一月 · 灵石 +5
        </button>
      </aside>
      <article
        v-if="
          active === 'encounter' &&
          q.epilogue &&
          mode === 'journey' &&
          q.location === 'home' &&
          !q.duel
        "
        class="chapter-ending"
        aria-label="筑基篇尾声"
      >
        <small>你的道途 · 已完成筑基篇</small>
        <h2>{{ ending[0] }}</h2>
        <p v-for="line in ending.slice(1)" :key="line">{{ line }}</p>
        <p class="ending-scope">
          筑基篇终。可继续修行、回访故人或再赴试剑榜。可在凝丹筹备中争取主药、炼丹并叩关。
        </p>
      </article>

      <template v-else-if="mode === 'board' && active === 'encounter'">
        <p>
          筑基修行 {{ q.cultivation }}/600 ·
          {{ cultivationStage(game) }}。每场行前一月、灵石 4；最多 12
          合，败退伤势 +2，可免费静养后再来。
        </p>
        <JourneyResult
          v-if="q.board.last"
          :text="q.board.last"
          label="查看最近一场奖励与对手回应"
        />
        <p class="next-goal">{{ board.next }}</p>
        <button :disabled="busy" @click="emit('equipment')">
          查看功法装配
        </button>
        <ol class="foundation-ranks">
          <li
            v-for="row in board.rows"
            :key="row.id"
            :class="{ current: row.current, won: row.won }"
          >
            <h3>
              {{ row.rank }} · {{ row.foe }} · {{ opponentRealmName(row) }}
            </h3>
            <p>{{ row.purpose }}</p>
            <p>
              {{ foundationBattleReadiness(game, row.id).description }}
              {{ foundationBattleReadiness(game, row.id).cooperationNote }}
            </p>
            <p>
              首胜奖励：灵石 {{ row.prize }}、筑基修行
              {{
                Math.max(0, Math.min(40, foundationCap(game) - q.cultivation))
              }}（当前上限 {{ foundationCap(game) }}）{{
                row.extra ? `、${row.extra}` : ""
              }}。每场首胜可获报酬。
            </p>
            <p v-if="row.won">已获胜 · {{ row.turns }} 合 · 奖励已入袋</p>
            <template v-else-if="row.current"
              ><small>{{
                journeyActionError(game, { kind: "battle", battle: row.id }) ||
                "准备就绪，可登台"
              }}</small
              ><button
                :disabled="
                  busy ||
                  !!journeyActionError(game, { kind: 'battle', battle: row.id })
                "
                @click="act({ kind: 'battle', battle: row.id })"
              >
                挑战{{ row.foe }}
              </button></template
            >
            <small v-else
              >先击败前一位对手；同阶参考修行 {{ row.stage * 200 }}</small
            >
          </li>
        </ol>
      </template>
      <template v-else>
        <template v-if="mode === 'journey'">
          <template v-if="active === 'prepare'">
            <h3>筑基行旅 · 青玄界</h3>
            <p>
              {{ cultivationStage(game) }} · 修行 {{ q.cultivation }}/600 ·
              当前可积累至 {{ foundationCap(game) }}
            </p>
            <p>{{ foundationBlock(game) }}</p>

            <aside v-if="q.cultivation === 600" aria-label="凝丹筹备">
              <h4>凝丹筹备 · 两路争取主药</h4>
              <p>
                圆满积累与归流成果已成。内比两胜或凝露药圃可得主药，炼成凝丹丹药、备好灵地后可叩关。
              </p>
              <p>
                护脉辅药可在工坊自炼或购置；伤势 {{ game.injury }}，先静养调息。
              </p>
            </aside>
          </template>
          <template v-if="active === 'road'">
            <button :disabled="busy" @click="openTravel(q.location==='home'?'ferry':'home')">展开大地图 · 查看路程与御剑</button>
            <nav class="destination-list" aria-label="筑基行旅地点">
              <button
                v-for="(place, id) in destinations"
                v-show="knowsInland(game,id)"
                :key="id"
                :disabled="
                  busy ||
                  !!journeyActionError(game, {
                    kind: 'travel',
                    destination: id,
                  })
                "
                :title="
                  journeyActionError(game, { kind: 'travel', destination: id })
                "
                :aria-pressed="q.location === id"
                @click="act({ kind: 'travel', destination: id })"
              >
                {{ place.name }}{{ q.location === id ? " · 此处" : " · "+formatLifeMonths(travelQuote(game,id,preferredTravelMode(game)).remaining) }}
              </button>
            </nav>
          </template>
          <template v-if="active === 'encounter'">
            <img
              v-if="presentation.portrait"
              class="encounter-portrait"
              :src="presentation.portrait"
              :alt="presentation.speaker || '现场人物'"
            />
            <p>{{ presentation.body || destinations[q.location].intro }}</p>
          </template>
          <template v-if="active === 'prepare'">
            <p>行旅途中，也可随时回洞府修行。</p>
            <button :disabled="busy" @click="emit('equipment')">
              装配传承与功法
            </button>
            <details>
              <summary>挑战吃力时，怎样准备？</summary>
              <p>
                高小境界敌人有真实的境界压制；修行到同阶或取得越阶机缘后，再衡量胜算。先静养伤势，再比较三招的承伤、蓄势与换招收益；一直重复同一套连招也可能撞上重击。
              </p>
              <p>
                护身诀可在功法页装配并研修，每级研修增加护体
                1；主修研修每级增加基础伤害 2。研修需心得 2、灵石 12、灵草
                2，筑基后可达二级。
              </p>
              <p>
                灵器可在丹器页精炼，灵瓶增强护体，灵剑提高伤害。可炼阶数、所需材料与提升效果，以当前精炼报价为准。
              </p>
              <p v-if="game.journey.main === 'spring'">
                长春守势需有灵草，且承伤后仍存活才会回气；储物袋有药也不能在交锋中起死回生。
              </p>
            </details>
          </template>
        </template>
        <template v-else-if="mode === 'relationship' && active === 'encounter'">
          <img
            v-if="presentation.portrait"
            class="encounter-portrait"
            :src="presentation.portrait"
            :alt="presentation.speaker || '同行的人'"
          />
          <p>{{ presentation.body }}</p>

          <p>
            {{
              q.bond === "covenant"
                ? "已结为道侣。"
                : q.bond === "promised"
                  ? "对方正等你的答复，也可以再想一想。"
                  : "尚未结契。可以相约准备远行，也可以继续做朋友。"
            }}
          </p>
          <p>
            联系：{{
              { none: "尚未约定", letters: "药队递信", station: "旅亭留信" }[
                q.contact
              ]
            }}。闭关与现实离线不会损害关系。
          </p></template
        >
        <JourneyResult
          v-if="
            active === 'encounter' &&
            q.last &&
            !(
              q.epilogue &&
              q.location === 'home' &&
              q.last.startsWith(ending[0]!)
            )
          "
          :text="q.last"
        />
        <div class="foundation-options">
          <article
            v-for="option in selectedOptions"
            :key="JSON.stringify(option.action)"
          >
            <p v-if="option.action.kind === 'battle'">
              {{
                foundationBattleReadiness(game, option.action.battle)
                  .description
              }}
              {{
                foundationBattleReadiness(game, option.action.battle)
                  .cooperationNote
              }}
            </p>
            <button
              :disabled="busy || !!option.error"
              @click="act(option.action)"
            >
              {{ option.label }}</button
            ><small v-if="option.error">{{ option.error }}</small>
          </article>
        </div>
      </template>
      <template v-if="active === 'prepare' && mode !== 'journey' && !q.duel"
        ><button :disabled="busy" @click="emit('equipment')">
          查看功法装配
        </button></template
      >
    </NarrativeStage>
    </div>
    </template>
  </section>
</template>
<style scoped>
.chapter-ending {
  padding: 22px;
  border: 1px solid #d8b96b;
  border-radius: 12px;
  background: #20382e;
}
.chapter-ending h2 {
  color: #ffe5a5;
}
.ending-scope {
  border-top: 1px solid #788676;
  padding-top: 12px;
}
.foundation-preparation {
  padding: 12px;
  border: 1px solid #788676;
  border-radius: 8px;
}
.foundation-preparation button {
  margin: 4px;
}

.foundation-panel {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f1e5c9;
}
.foundation-panel p {
  line-height: 1.7;
  margin: 0.3em 0;
}
.foundation-panel .next-goal {
  background: #e8eadc;
  color: #203b31;
}
.foundation-panel small {
  display: block;
  color: #d6d2bb;
  line-height: 1.6;
}
.foundation-panel button {
  white-space: normal;
  height: auto;
  min-height: 44px;
  line-height: 1.6;
}
.foundation-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
.foundation-options article {
  display: grid;
  gap: 4px;
}
.foundation-result {
  padding: 14px;
  background: #283d37;
  border-left: 3px solid #d8b96b;
  border-radius: 4px;
}
.foundation-ranks {
  padding-left: 24px;
  display: grid;
  gap: 12px;
}
.foundation-ranks li {
  padding: 12px;
  border: 1px solid #536460;
  border-radius: 8px;
}
.foundation-ranks .current {
  border-color: #ddbe75;
  background: #253b35;
}
.foundation-ranks .won {
  background: #24322c;
}
.foundation-duel {
  display: grid;
  grid-template-columns: minmax(90px, 30%) minmax(0, 1fr);
  align-items: center;
  gap: 18px;
}
.foundation-duel img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
}
.combat-figures :deep(.character-sprite) {
  height: 160px;
}
@media (max-width: 550px) {
  .foundation-duel {
    grid-template-columns: 100px 1fr;
    gap: 10px;
  }
  .foundation-panel {
    padding: 12px;
  }
  .foundation-duel h3 {
    font-size: 1rem;
  }
}
</style>
<style scoped>
.chapter-ending {
  padding: 22px;
  border: 1px solid #d8b96b;
  border-radius: 12px;
  background: #20382e;
}
.chapter-ending h2 {
  color: #ffe5a5;
}
.ending-scope {
  border-top: 1px solid #788676;
  padding-top: 12px;
}
.foundation-preparation {
  padding: 12px;
  border: 1px solid #788676;
  border-radius: 8px;
}
.foundation-preparation button {
  margin: 4px;
}

.foundation-panel button {
  background: #e8eadc;
  color: #203b31;
  border: 1px solid #a7b4a6;
  border-radius: 6px;
  padding: 8px 12px;
}
.foundation-panel button small {
  color: #385244;
}
</style>

<style scoped>
.scene-player {
  position: absolute;
  left: 14%;
  bottom: 12%;
  width: 20%;
  height: 48%;
  filter: drop-shadow(0 14px 12px #0009);
}
.encounter-portrait {
  float: left;
  width: 110px;
  max-height: 180px;
  object-fit: contain;
  margin: 0 14px 8px 0;
}
.return-to-place {
  justify-self: start;
}
.foundation-panel nav.destination-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  height: auto;
  gap: 10px;
  border: 0;
  margin: 0;
}
.foundation-panel nav.destination-list button {
  min-width: 0;
  padding: 12px;
  line-height: 1.5;
  text-align: left;
}
.foundation-panel :deep(.narrative-stage) {
  min-width: 0;
}
</style>

<style scoped>
.scene-recent {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-top: 8px;
  color: #dfd4b9;
  font-size: 12px;
  line-height: 1.6;
}
</style>

<style scoped>
.field-battle :deep(.battle-inspector) {display:none;}
.field-battle-details {position:absolute;left:4%;top:20%;width:min(350px,40%);z-index:7;pointer-events:auto;color:#f4e7ca;background:#0c241eef;border:1px solid #b9a16d88;padding:8px 12px;}
.field-battle-details summary {cursor:pointer;}
.field-battle-details[open] {max-height:45%;overflow:auto;}
.field-battle-details p {font-size:13px;line-height:1.5;}
</style>
