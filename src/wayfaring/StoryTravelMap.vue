<script setup lang="ts">
import AuctionDestination from "../auction/AuctionDestination.vue";
import AuctionTiming from "../auction/AuctionTiming.vue";
import "./travel-stage.css";
import { travelPlaybackDuration } from "./playback";
import { computed, nextTick, ref, watch } from "vue";
import type { State } from "../world";
import type { StoryRoute } from "./story-routes";
import { characterArt, heroArt } from "../presentation/art";
import { formatLifeMonths } from "../progression";
import PathTraveler from "../presentation/movement/PathTraveler.vue";
import RouteCanvas from "../presentation/movement/RouteCanvas.vue";
import { travelWalkSheet } from "../presentation/movement/appearance";
import { useMapFocus } from "../presentation/movement/useMapFocus";
const props = defineProps<{
  game: State;
  route: StoryRoute;
  busy: boolean;
  arrived: boolean;
}>();
const emit = defineEmits<{ depart: []; close: []; cancel: [] }>();
const { root, keyboard } = useMapFocus(() => {
  if (!props.busy) emit("close");
});
watch(
  () => props.arrived,
  () => {
    void nextTick(() => root.value?.focus({ preventScroll: true }));
  },
);
const actor = ref<InstanceType<typeof PathTraveler> | null>(null),
  paused = ref(false),
  finished = ref(false);
const points = computed(() =>
  props.route.path.map((id) => props.route.sites.find((p) => p.id === id)!),
);
const edges = computed(() =>
  props.route.path.slice(1).map((id, i) => [props.route.path[i]!, id] as const),
);
const name = (id: string) =>
  props.route.sites.find((p) => p.id === id)?.name ?? id;
const remaining = computed(
  () => (props.route.domain === "inland" ? props.game.wayfaring.trip?.remaining : props.game.wayfaring.passage?.remaining) ?? props.route.months,
);
const progress = computed(() =>
  props.arrived
    ? props.route.startProgress
    : props.route.domain === "inland" && props.game.wayfaring.trip
      ? 1 - props.game.wayfaring.trip.remaining / props.game.wayfaring.trip.total
    : props.game.wayfaring.passage
      ? 1 -
        props.game.wayfaring.passage.remaining /
          props.game.wayfaring.passage.total
      : 0,
);
function complete() {
  finished.value = true;
  // Closing is presentation only; the destination was saved before playback began.
  if (props.arrived && !props.route.months && !props.route.stones && !props.route.herbs)
    void nextTick(() => { if (!props.busy) emit("close"); });
}
function pause() {
  paused.value = !paused.value;
  actor.value?.pause();
}
</script>
<template>
  <section
    ref="root"
    tabindex="-1"
    class="story-travel"
    aria-label="地区旅行地图"
    @keydown="keyboard"
  >
    <header>
      <div>
        <small>{{ route.title }}</small>
        <h2>{{ name(route.from) }} → {{ name(route.to) }}</h2>
      </div>
      <button :disabled="busy" @click="emit('close')">
        {{ arrived ? "进入目的地" : "返回现场" }}
      </button>
    </header>
    <div class="travel-body">
      <RouteCanvas
        :sites="route.sites"
        :edges="edges"
        :path="route.path"
        :current="arrived ? route.to : route.from"
        :title="route.title"
        :theme="route.mode === 'sail' ? 'sea' : 'land'"
        :flight="route.mode === 'flight'"
      >
        <PathTraveler
          ref="actor"
          :points="points"
          :image="characterArt(heroArt(game.social.gender, game.realm))"
          :walk-sheet="travelWalkSheet(game)"
          :mode="route.mode"
          :playing="arrived && !finished"
          :progress="progress"
          :duration="travelPlaybackDuration(route.distance, route.mode, game.realm)"
          @finished="complete"
        />
      </RouteCanvas>
      <aside>
<AuctionTiming v-if="!arrived" :game="game" :months="remaining" />
        <AuctionDestination v-if="route.domain==='road' || route.domain==='inland' || route.domain==='sea'" :game="game" :place="route.to" :months="arrived ? 0 : remaining" />
        <p class="route-line">{{ route.path.map(name).join(" → ") }}</p>
        <p>
          路程 {{ route.distance.toLocaleString() }} 里 ·
          {{
            route.mode === "sail"
              ? "循潮行舟"
              : route.mode === "flight"
                ? (game.realm >= 2 ? "丹元护体飞行" : "御剑行路")
                : "沿路行走"
          }}
        </p>
        <template v-if="!arrived">
          <p>
            本次{{ (game.wayfaring.passage || game.wayfaring.trip) ? "剩余" : "耗时" }}
            <strong>{{
              remaining ? formatLifeMonths(remaining) : "不另扣年月"
            }}</strong>
          </p>
          <p v-if="route.stones || route.herbs">
            灵石 {{ route.stones }} · 灵草 {{ route.herbs }}（抵达时结算）
          </p>
          <p>
            预计抵达年龄 {{ formatLifeMonths(game.age + remaining) }}<br />余寿
            {{
              formatLifeMonths(Math.max(0, game.limit - game.age - remaining))
            }}
          </p>
          <p>{{ route.note }}</p>
          <p
            v-if="
              route.domain === 'sea' &&
              game.outerSea.notice !== null &&
              !game.outerSea.reminded &&
              game.month + remaining >= game.outerSea.notice + 600
            "
            role="status"
          >
            途中将到诸宗会期，收到来信时暂停，剩余航程保留。
          </p>
          <p v-if="route.error" role="status">{{ route.error }}</p>

          <button
            v-if="game.wayfaring.passage || game.wayfaring.trip"
            :disabled="busy || !!game.pending || game.status !== 'alive'"
            @click="emit('cancel')"
          >
            放弃此行 · 已耗年月不退
          </button>
        </template>
        <template v-else>
          <p role="status">
            {{ finished ? "已抵达，可进入现场。" : "正在前往目的地。" }}
          </p>
          <div v-if="!finished">
            <button @click="pause">
              {{ paused ? "继续演出" : "暂停演出" }}</button
            ><button @click="actor?.finish()">跳过演出</button>
          </div>
          <button @click="emit('close')">进入{{ name(route.to) }}</button>
        </template>
      </aside>
    </div>
    <footer>
      <div v-if="!arrived" class="travel-actions">
        <span
          >{{ name(route.to) }} ·
          {{ remaining ? formatLifeMonths(remaining) : "不另扣年月"
          }}<small v-if="route.error"> · {{ route.error }}</small></span
        >
        <button
          class="depart"
          :disabled="busy || !!route.error"
          @click="emit('depart')"
        >
          {{ (game.wayfaring.passage || game.wayfaring.trip) ? "继续剩余行程" : "动身前往" }}
        </button>
      </div>
      <span>Esc 返回现场 · 暂停或跳过演出不改变行程结果</span>
    </footer>
  </section>
</template>
<style scoped>
.story-travel {
  background: #0d2522;
  color: #f0e5ca;
  padding: clamp(14px, 2vw, 28px);
  border: 1px solid #8b9975;
  border-radius: 12px;
  min-width: 0;
  outline: none;
  box-sizing: border-box;
}
.story-travel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: auto;
  min-height: 0;
  gap: 20px;
  padding: 0;
  margin: 0 0 18px;
  border: 0;
}
h2 {
  font-size: clamp(20px, 1.6vw, 28px);
  margin: 6px 0;
}
p {
  font-size: 15px;
  line-height: 1.7;
  margin: 12px 0;
}
.travel-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(290px, 24vw, 360px);
  gap: 24px;
  align-items: center;
}
aside {
  background: #17382f;
  padding: 20px;
  max-height: calc(100dvh - 230px);
  overflow: auto;
  scrollbar-gutter: stable;
  border-radius: 8px;
}
button {
  background: #294d3d;
  color: #f5e9c9;
  border: 1px solid #ac9565;
  padding: 10px 14px;
  margin: 4px;
  cursor: pointer;
  white-space: normal;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible {
  outline: 3px solid #f2d794;
  outline-offset: 3px;
}
.travel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.depart {
  width: auto;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
}
.story-travel footer {
  padding: 0;
  margin: 14px 0 0;
  border: 0;
  color: #c3ceb7;
  font-size: 13px;
}
@media (max-width: 850px) {
  .travel-body {
    grid-template-columns: 1fr;
  }
  aside {
    max-height: none;
  }
  .story-travel {
    padding: 12px;
  }
}
</style>
