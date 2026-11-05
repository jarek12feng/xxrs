<script setup lang="ts">
import AuctionDestination from "../auction/AuctionDestination.vue";
import {auctionVenueAt} from "../auction/map";
import {auctionVenues} from "../auction";
import AuctionTiming from "../auction/AuctionTiming.vue";
import "./travel-stage.css";
import { travelPlaybackDuration } from "./playback";
import { knowsInland } from "./discovery";
import { computed, nextTick, ref, watch } from "vue";
import type { State, Intent } from "../world";
import type { TravelDestination } from "./routes";
import { characterArt, heroArt } from "../presentation/art";
import RouteCanvas from "../presentation/movement/RouteCanvas.vue";
import { useMapFocus } from "../presentation/movement/useMapFocus";
import { travelWalkSheet } from "../presentation/movement/appearance";
import PathTraveler from "../presentation/movement/PathTraveler.vue";
import { sites, roads, type TravelMode } from "./routes";
import { preferredTravelMode, travelQuote, studyError, travelLocation } from "./rules";
import { formatLifeMonths } from "../progression";
const props = defineProps<{
  game: State;
  busy: boolean;
  destination?: TravelDestination;
}>();
const emit = defineEmits<{ act: [intent: Intent]; close: [] }>();
const { root, keyboard } = useMapFocus(() => {
  if (!props.busy) emit("close");
});
const visibleSites = computed(() => Object.fromEntries(Object.entries(sites).filter(([id]) => knowsInland(props.game,id as TravelDestination))) as Partial<typeof sites>);
const mapSites = computed(() => Object.entries(visibleSites.value).map(([id, site]) => ({ id, ...site!, subtitle: auctionVenueAt(id) ? auctionVenues[auctionVenueAt(id)!].name : undefined })));
const mapEdges = computed(() => roads.filter(([a,b]) => visibleSites.value[a] && visibleSites.value[b]).map(([a, b]) => [a, b] as const));
const selected = ref<TravelDestination>(
  props.game.wayfaring.trip?.to ?? props.destination ?? "ferry",
);
const mode = ref<TravelMode>(
  preferredTravelMode(props.game),
);
const quote = computed(() =>
  travelQuote(props.game, selected.value, mode.value),
);
const departure = ref<ReturnType<typeof travelQuote> | null>(null);
const arrived = ref(false),
  playing = ref(false),
  paused = ref(false);
const traveler = ref<InstanceType<typeof PathTraveler> | null>(null);
const shown = computed(() =>
  arrived.value && departure.value ? departure.value : quote.value,
);
const points = computed(() => shown.value.path.map((id) => sites[id]));
const pathLabel = computed(() =>
  quote.value.path.map((id) => sites[id].name).join(" → "),
);
const progress = computed(() =>
  arrived.value
    ? departure.value?.months
      ? 1 - departure.value.remaining / departure.value.months
      : 0
    : props.game.wayfaring.trip
      ? 1 -
        props.game.wayfaring.trip.remaining / props.game.wayfaring.trip.total
      : 0,
);
const deadline = computed(() => {
  const t = props.game.sectContest;
  return t.stage === "invited" &&
    props.game.month + quote.value.remaining >= t.starts
    ? "此行将抵达或跨过已知内比会期，途中会在传讯时停下。"
    : "";
});
function depart() {
  if (props.busy || quote.value.error) return;
  departure.value = { ...quote.value };
  if (selected.value === "pact" || selected.value === "stele") {
    emit("act", {type:"wayfaring",action:{kind:"visit",site:selected.value === "pact" ? "zhaoxuan" : "brokenStele",mode:mode.value}});
    return;
  }
  emit("act", {
    type: "foundationJourney",
    action: { kind: "travel", destination: selected.value, mode: mode.value },
  });
}
function select(id: TravelDestination) {
  if (knowsInland(props.game,id) && !props.busy && !props.game.wayfaring.trip && !arrived.value)
    selected.value = id;
}
watch(
  () => props.game,
  (next, old) => {
    if (next === old || !departure.value) return;
    if (
      !next.wayfaring.trip &&
      travelLocation(next) === departure.value.to &&
      travelLocation(old) !== travelLocation(next)
    ) {
      arrived.value = true;
      playing.value = true;
      void nextTick(() => root.value?.focus({ preventScroll: true }));
    }
  },
);
function pause() {
  paused.value = !paused.value;
  traveler.value?.pause();
}
</script>
<template>
  <section
    ref="root"
    class="travel-map"
    tabindex="-1"
    aria-label="青玄内陆旅行地图"
    @keydown="keyboard"
  >
    <header>
      <div>
        <small>青玄界 · 听松与内陆药路</small>
        <h2>{{ arrived ? "行程已抵达" : "展开行路图" }}</h2>
      </div>
      <button :disabled="busy" @click="emit('close')">
        {{ arrived ? "进入目的地" : "收起地图" }}
      </button>
    </header>
    <div class="travel-layout">
      <RouteCanvas
        :sites="mapSites"
        :edges="mapEdges"
        :path="shown.path"
        :selected="selected"
        :current="game.foundationJourney.location"
        :disabled="busy || !!game.wayfaring.trip || arrived"
        selectable
        title="青玄内陆 · 听松药路"
        :flight="shown.mode === 'flight'"
        @select="select($event as TravelDestination)"
      >
        <PathTraveler
          ref="traveler"
          :points="points"
          :image="characterArt(heroArt(game.social.gender, game.realm))"
          :walk-sheet="travelWalkSheet(game)"
          :mode="shown.mode === 'flight' ? 'flight' : 'walk'"
          :duration="travelPlaybackDuration(shown.distance, shown.mode, game.realm)"
          :playing="playing"
          :progress="progress"
          @finished="playing = false"
        />
      </RouteCanvas>
      <aside>
        <template v-if="arrived"
          ><h3>{{ sites[shown.from].name }} → {{ sites[shown.to].name }}</h3>
          <p>{{ game.wayfaring.last }}</p>
          <div v-if="playing">
            <button @click="pause">
              {{ paused ? "继续演出" : "暂停演出" }}</button
            ><button @click="traveler?.finish()">跳过演出</button>
          </div>
          <button @click="emit('close')">
            进入{{ sites[shown.to].name }}
          </button></template
        >
        <template v-else>
          <p class="where">
            {{ game.wayfaring.trip ? "途中暂歇" : "所在地点" }} ·
            {{ sites[game.foundationJourney.location].name }}
          </p>
          <label
            >目的地<select
              v-model="selected"
              :disabled="busy || !!game.wayfaring.trip"
            >
              <option v-for="(site, id) in visibleSites" :key="id" :value="id">
                {{ site!.name }}
              </option>
            </select></label
          >
          <label
            >行路方式<select
              v-model="mode"
              :disabled="busy || !!game.wayfaring.trip"
            >
              <option value="land">沿陆路</option>
              <option
                value="flight"
                :disabled="game.wayfaring.swordFlight === 'none'"
              >
                御剑{{
                  game.wayfaring.swordFlight === "practiced" ? "试行" : ""
                }}
              </option>
            </select></label
          >
          <h3>{{ sites[quote.from].name }} → {{ sites[selected].name }}</h3>
          <p>{{ pathLabel }}</p>
          <p>路程 {{ quote.distance }} 里 · 行速 {{ quote.speed }} 里／月</p>
          <p>
            本次{{ game.wayfaring.trip ? "剩余" : "耗时" }}
            <strong>{{ formatLifeMonths(quote.remaining) }}</strong
            ><br />预计抵达年龄
            {{ formatLifeMonths(game.age + quote.remaining) }} · 余寿
            {{
              formatLifeMonths(
                Math.max(0, game.limit - game.age - quote.remaining),
              )
            }}
          </p>
          <AuctionDestination :game="game" :place="selected" :months="arrived ? 0 : quote.error ? undefined : quote.remaining" />
          <p v-if="deadline" role="status">{{ deadline }}</p>
          <AuctionTiming v-if="!arrived" :game="game" :months="quote.remaining" />
          <p v-if="quote.error">{{ quote.error }}</p>

          <button
            v-if="game.wayfaring.trip"
            :disabled="busy || !!game.pending || game.status !== 'alive'"
            @click="
              emit('act', { type: 'wayfaring', action: { kind: 'cancel' } })
            "
          >
            放弃此行 · 已用年月不退，不另扣撤回时间
          </button>
          <details
            v-if="
              game.foundationJourney.location === 'home' && !game.wayfaring.trip
            "
            class="flight-study"
          >
            <summary>行前居 · 御剑札记</summary>
            <p>
              {{
                game.wayfaring.swordFlight === "none"
                  ? "筑基后研习一月，练稳起落；再完成一次御剑远行，掌握御剑术。不占主修，不限剑道。"
                  : game.wayfaring.swordFlight === "practiced"
                    ? "起落已稳，可选御剑试行。"
                    : "御剑术已掌握。"
              }}
            </p>
            <button
              v-if="game.wayfaring.swordFlight === 'none'"
              :disabled="busy || !!studyError(game)"
              @click="
                emit('act', { type: 'wayfaring', action: { kind: 'study' } })
              "
            >
              研习御剑 · 一月
            </button>
          </details>
          <p class="quiet">
            外海古渡在更远的海上，须先越过穿云壁，循航路前往。
          </p>
        </template>
      </aside>
    </div>
    <footer>
      <div v-if="!arrived" class="travel-actions">
        <span
          >{{ sites[selected].name }} · {{ formatLifeMonths(quote.remaining)
          }}<small v-if="quote.error"> · {{ quote.error }}</small></span
        >
        <button
          class="depart"
          :disabled="busy || !!quote.error"
          @click="depart"
        >
          {{ game.wayfaring.trip ? "继续剩余路程" : "动身前往" }}
        </button>
      </div>
      <span class="key-hint"
        >Tab 切换焦点 · Enter / 空格选定地点 · Esc 收起地图</span
      >
    </footer>
  </section>
</template>
<style scoped>
.travel-map {
  color: #eadfc5;
  background: #0d2522;
  padding: 20px;
  border: 1px solid #6c8165;
  border-radius: 14px;
}
.travel-map header {
  height: auto;
  min-height: 0;
  padding: 0;
  margin: 0 0 12px;
  border: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}
.travel-map h2 {
  margin: 6px 0 18px;
}
.travel-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(290px, 24vw, 360px);
  gap: 24px;
  align-items: start;
}
.travel-layout svg {
  width: 100%;
  height: auto;
  align-self: center;
  aspect-ratio: 1000 / 540;
}
.travel-layout aside {
  max-height: calc(100dvh - 210px);
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 14px;
  background: #152f29;
  border-radius: 10px;
}
.travel-map label {
  display: block;
  margin: 12px 0;
}
.travel-map select {
  display: block;
  width: 100%;
  padding: 8px;
  background: #203d32;
  color: #f6e9c9;
}
.travel-map button {
  background: #294d3d;
  color: #f5e9c9;
  border: 1px solid #ac9565;
  padding: 10px 14px;
  margin: 4px;
  cursor: pointer;
}
.travel-map button:disabled {
  opacity: 0.5;
  cursor: default;
}
.travel-map p {
  line-height: 1.6;
  margin: 10px 0;
}
.flight-study summary {
  cursor: pointer;
  padding: 12px 0;
}
.flight-study {
  border-top: 1px solid #64765a;
  margin-top: 18px;
}
.quiet {
  font-size: 13px;
  color: #bac5b5;
}
.travel-map button:focus-visible,
.travel-map select:focus-visible {
  outline: 3px solid #f2d794;
  outline-offset: 3px;
}
.travel-map .depart {
  width: auto;
  flex-shrink: 0;
  background: #4c6040;
  font-size: 16px;
  font-weight: 700;
}
.travel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.key-hint {
  font-size: 12px;
}
.travel-map footer {
  padding: 0;
  border: 0;
  margin-top: 16px;
  color: #c2cdbb;
  font-size: 13px;
}
.travel-map {
  min-width: 0;
  outline: none;
}
@media (min-width: 1100px) {
  .travel-layout {
    align-items: center;
  }
  .travel-layout aside {
    padding: 16px 20px;
  }
}
@media (min-width: 851px) and (max-height: 800px) {
  .travel-map {
    padding: 12px;
  }
  .travel-map header h2 {
    font-size: 22px;
    margin: 4px 0 10px;
  }
  .travel-map p {
    margin: 6px 0;
    font-size: 14px;
  }
  .travel-map h3 {
    font-size: 16px;
    margin: 8px 0;
  }
  .travel-map label {
    margin: 6px 0;
  }
  .travel-map .flight-study summary {
    cursor: pointer;
    padding: 12px 0;
  }
  .flight-study {
    margin-top: 10px;
  }
  .travel-map footer {
    padding: 0;
    border: 0;
    margin-top: 8px;
  }
}
@media (max-width: 850px) {
  .travel-layout aside {
    max-height: none;
    overflow: visible;
  }
  .travel-layout {
    grid-template-columns: 1fr;
  }
  .travel-layout svg {
    min-height: 0;
  }
  .travel-map {
    padding: 10px;
  }
}
</style>
