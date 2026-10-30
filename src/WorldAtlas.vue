<script setup lang="ts">
import { computed } from "vue";
import { currentWorldMap as worldMap, qingxuanPaths } from "./world-geography";
import { routeNodes, landmarkLabel } from "./landmarks";
import { places, explorationError, type State, type Place } from "./core";
const props = defineProps<{
  game: State;
  selected: Place;
  story?: boolean;
  selectedStory?: string;
}>();
const routes = computed(() => routeNodes(props.game));
const paths = computed(() => {
  const byKey = new Map(routes.value.map((n) => [n.key, n]));
  return qingxuanPaths.map(([from, to]) => {
    const a = byKey.get(from)!,
      b = byKey.get(to)!;
    return {
      key: from + to,
      d: `M ${a.x * 10} ${a.y * 5.62} L ${b.x * 10} ${b.y * 5.62}`,
      active: a.active && b.active,
    };
  });
});
const emit = defineEmits<{
  select: [place: Place];
  selectStory: [key: string];
}>();
const points: Record<Place, { x: number; y: number }> = {
  valley: { x: 30, y: 72 },
  peak: { x: 49, y: 50 },
  sea: { x: 76, y: 64 },
};
const distant = worldMap.distant;
</script>

<template>
  <section class="world-atlas" :aria-label="worldMap.name + '本界地图'">
    <header class="atlas-heading">
      <div>
        <span>山河万里 · 一念长生</span>
        <h3>{{ worldMap.name }} · 本界全图</h3>
      </div>
      <p>所在界域 · {{ worldMap.name }}</p>
    </header>
    <div class="atlas-scope">
      <p>{{ worldMap.overview }}</p>
      <p class="atlas-scope-note">点选地标，查看去路与行前准备。</p>
      <details class="atlas-regions">
        <summary>本界地域一览 · 听松山之外还有什么</summary>
        <div class="atlas-region-grid">
          <article v-for="region in worldMap.regions" :key="region.name">
            <strong>{{ region.name }}</strong
            ><small>{{ region.status }} · 按进展前往</small>
            <p>{{ region.detail }}</p>
          </article>
          <article v-for="region in distant" :key="region.name">
            <strong>{{ region.name }}</strong
            ><small>本界远方 · 尚未开放</small>
            <p>{{ region.detail }}</p>
          </article>
        </div>
      </details>
    </div>
    <nav class="atlas-list" aria-label="窄屏地标列表">
      <template v-if="story">
        <button
          v-for="node in routes"
          :key="node.key"
          :aria-pressed="selectedStory === node.key"
          @click="emit('selectStory', node.key)"
        >
          {{ node.label || landmarkLabel(node.title)
          }}<small>{{
            node.current
              ? "你在此处"
              : node.visited
                ? "已探访"
                : node.intent
                  ? "可前往"
                  : "循线索开启"
          }}</small>
        </button>
      </template>
      <template v-else>
        <button
          v-for="(_, id) in points"
          :key="id"
          :aria-pressed="selected === id"
          @click="emit('select', id)"
        >
          {{ places[id].name
          }}<small>{{
            game.journey.maps[id] === 3
              ? "见闻已全"
              : explorationError(game, id) || "可探索"
          }}</small>
        </button>
      </template>
    </nav>
    <div
      class="atlas-scroll"
      tabindex="0"
      aria-label="山海地图，可横向滚动查看"
    >
      <div class="atlas-canvas" :class="{ 'story-atlas': story }">
        <img
          class="atlas-landscape"
          :src="worldMap.image"
          alt="青玄界山河示意：药路、雾岭与海岸，远方可见雪山、古墟和仙岛"
        />
        <svg class="atlas-path" viewBox="0 0 1000 562" aria-hidden="true">
          <template v-if="story">
            <path
              v-for="path in paths"
              :key="path.key"
              :d="path.d"
              :class="{ 'active-route': path.active }"
            />
          </template>
          <path
            v-else
            d="M 145 460 Q 210 440 300 405 T 490 281 Q 620 300 760 360"
          />
        </svg>
        <span v-if="!story" class="atlas-home" style="left: 14.5%; top: 82%"
          >听松山居<small>山门所在</small></span
        >
        <template v-if="!story">
          <button
            v-for="(point, id) in points"
            :key="id"
            class="atlas-pin"
            :class="{
              selected: selected === id,
              sealed: !!explorationError(game, id) && game.journey.maps[id] < 3,
              complete: game.journey.maps[id] === 3,
            }"
            :style="{ left: point.x + '%', top: point.y + '%' }"
            :aria-pressed="selected === id"
            :aria-label="
              places[id].name +
              '，' +
              (game.journey.maps[id] === 3
                ? '见闻已全'
                : explorationError(game, id) || '可探索')
            "
            @click="emit('select', id)"
          >
            <span class="atlas-pin-dot" aria-hidden="true">{{
              game.journey.maps[id] === 3 ? "✓" : "◇"
            }}</span>
            <strong>{{ places[id].name }}</strong>
            <small
              >{{
                game.journey.maps[id] === 3
                  ? "见闻已全"
                  : places[id].realm > game.realm
                    ? "筑基后探访"
                    : explorationError(game, id)
                      ? "待解锁"
                      : "可探索"
              }}
              · {{ game.journey.maps[id] }} / 3</small
            >
          </button>
        </template>
        <template v-else>
          <button
            v-for="node in routes"
            :key="node.key"
            class="atlas-pin"
            :class="{
              selected: selectedStory === node.key,
              sealed: !node.current && !node.intent,
              inactive: !node.active,
            }"
            :style="{ left: node.x + '%', top: node.y + '%' }"
            :aria-pressed="selectedStory === node.key"
            :aria-label="
              (node.label || landmarkLabel(node.title)) +
              '，' +
              (node.current
                ? '你在此处'
                : node.intent
                  ? '可前往'
                  : node.visited
                    ? '已探访'
                    : '循线索开启')
            "
            @click="emit('selectStory', node.key)"
          >
            <span class="atlas-pin-dot" aria-hidden="true">{{
              node.current ? "◉" : "◇"
            }}</span
            ><strong>{{ node.label || landmarkLabel(node.title) }}</strong
            ><small>{{
              node.current
                ? "你在此处"
                : node.visited
                  ? "已探访"
                  : node.intent
                    ? "可前往"
                    : "循线索开启"
            }}</small>
          </button>
        </template>
        <div
          v-for="place in distant"
          :key="place.name"
          class="atlas-pin distant"
          :style="{ left: place.x + '%', top: place.y + '%' }"
          role="img"
          :aria-label="place.name + '，青玄界远方，尚未开放'"
        >
          <span class="atlas-pin-dot" aria-hidden="true">◇</span
          ><strong>{{ place.name }}</strong
          ><small>本界远方 · 尚未开放</small>
        </div>
        <span class="atlas-inscription">山海未尽，仙途方始</span>
      </div>
    </div>
    <footer class="atlas-legend">
      <span>{{ story ? "◉ 你在此处 · ◆ 可前往" : "◆ 可探索" }}</span
      ><span>✓ 见闻已全</span><span class="unseen">◇ 待解锁 / 待探险</span
      ><small>点选地标查看条件 · 地标位置固定，亮线表示当前行程</small>
    </footer>
    <p class="atlas-boundary">
      界外的山河尚无图可循。待日后发现新的界域，再另展一卷地图。
    </p>
  </section>
</template>

<style>
.world-atlas {
  border: 1px solid #a38e64;
  border-radius: 10px;
  overflow: hidden;
  background: #142c27;
  margin-bottom: 20px;
}
.atlas-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  gap: 12px;
}
.atlas-heading span {
  font-size: 11px;
  letter-spacing: 0.24em;
  color: #bca579;
}
.modal[data-panel] .atlas-heading h3 {
  font-family: serif;
  font-size: 25px;
  letter-spacing: 0.15em;
  margin: 6px 0 0;
}
.modal[data-panel] .atlas-heading p {
  font-size: 12px;
  color: #c1b494;
}
.atlas-scroll {
  overflow-x: auto;
}
.atlas-canvas {
  position: relative;
  aspect-ratio: 16/9;
  min-width: 640px;
  isolation: isolate;
}
.atlas-landscape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.atlas-path {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: #916632;
  stroke-width: 2;
  stroke-dasharray: 5 6;
  opacity: 0.7;
}
.modal[data-panel] .atlas-pin,
.atlas-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: max-content;
  min-width: 110px;
  margin: 0;
  padding: 7px 12px;
  color: #fff0c6;
  background: #173d32ed;
  border: 1px solid #bba371;
  border-radius: 5px;
  box-shadow: 0 3px 12px #122e3040;
  font-family: inherit;
}
.atlas-pin strong {
  font-family: serif;
  font-size: 16px;
  letter-spacing: 0.1em;
}
.modal[data-panel] .atlas-pin small {
  font-size: 10px;
  color: #e0d3af;
  line-height: 1.5;
}
.atlas-pin-dot {
  line-height: 1;
  font-size: 17px;
  color: #eec97a;
}
.modal[data-panel] .atlas-pin.selected {
  outline: 2px solid #f9d786;
  outline-offset: 3px;
  background: #335446;
}
.modal[data-panel] .atlas-pin.sealed {
  background: #454e4ae8;
  border-color: #a4a99d;
  color: #e1e4d9;
}
.modal[data-panel] .atlas-pin.distant {
  background: #707876c9;
  color: #e2e5df;
  border-color: #afb5ac;
  box-shadow: none;
}
.modal[data-panel] .atlas-pin.distant small,
.atlas-pin.distant .atlas-pin-dot {
  color: #d9ded8;
}
.atlas-home {
  position: absolute;
  transform: translate(-50%, -50%);
  color: #293e33;
  font-weight: 700;
  font-family: serif;
  text-align: center;
  text-shadow: 0 0 6px #fff9dc;
}
.atlas-home small {
  display: block;
  font-size: 10px;
}
.atlas-inscription {
  position: absolute;
  bottom: 4%;
  right: 4%;
  font-family: serif;
  letter-spacing: 0.3em;
  color: #3a5448;
  font-size: 12px;
}
.atlas-legend {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 12px 18px;
  color: #ddc794;
  font-size: 12px;
}
.atlas-legend .unseen {
  color: #a6afa8;
}
.atlas-legend small {
  margin-left: auto;
}
.modal[data-panel="world"] {
  width: min(1140px, calc(100vw - 40px));
}
@media (max-width: 650px) {
  .atlas-heading {
    padding: 12px;
  }
  .atlas-heading p {
    display: none;
  }
  .atlas-legend {
    gap: 9px;
  }
  .atlas-legend small {
    width: 100%;
    margin: 0;
  }
  .modal[data-panel="world"] {
    padding: 16px;
    width: calc(100vw - 20px);
  }
}
</style>

<style>
@media (max-width: 650px) {
  .atlas-scroll {
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }
  .atlas-canvas {
    min-width: 760px;
  }
}
</style>

<style>
.atlas-list {
  display: none;
}
@media (max-width: 650px) {
  .atlas-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
  }
  .modal[data-panel] .atlas-list button {
    width: 100%;
    min-width: 0;
    padding: 8px 5px;
    font-size: 12px;
    background: #1b392e;
    color: #f3e4be;
    border: 1px solid #ad9869;
  }
  .atlas-list button[aria-pressed="true"] {
    outline: 2px solid #e2c57e;
  }
  .atlas-list small {
    display: block;
    font-size: 10px;
    margin-top: 4px;
  }
  .atlas-scroll {
    max-height: 200px;
  }
}
</style>

<style>
.atlas-scope,
.atlas-boundary {
  padding: 0 18px 14px;
  color: #eee2c5;
  font-size: 13px;
  line-height: 1.7;
}
.atlas-scope p {
  margin: 0 0 8px;
}
.atlas-scope .atlas-scope-note,
.atlas-region-grid small {
  color: #d0c4aa;
}
.atlas-regions summary {
  cursor: pointer;
  padding: 8px 0;
  color: #f2daa2;
}
.atlas-region-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.atlas-region-grid article {
  background: #1b392e;
  border: 1px solid #7d8b72;
  border-radius: 6px;
  padding: 10px;
}
.atlas-region-grid small {
  display: block;
  margin: 4px 0;
}
.atlas-boundary {
  margin: 0;
}
@media (max-width: 650px) {
  .atlas-region-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.story-atlas {
  min-width: 840px;
}
.story-atlas .atlas-path {
  stroke: #294a3d;
  opacity: 0.8;
}
.story-atlas .atlas-path .active-route {
  stroke: #f9db89;
  stroke-width: 3;
}
.world-atlas .atlas-pin.inactive {
  background: #243b32ed;
  border-style: dashed;
}
@media (max-width: 650px) {
  .story-atlas {
    min-width: 840px;
  }
}
</style>
