<script setup lang="ts">
import { computed } from "vue";
export interface RouteSite {
  id: string;
  name: string;
  subtitle?: string;
  x: number;
  y: number;
}
const props = withDefaults(
  defineProps<{
    sites: RouteSite[];
    edges: readonly (readonly [string, string])[];
    path: string[];
    selected?: string;
    current?: string;
    disabled?: boolean;
    selectable?: boolean;
    theme?: "land" | "sea";
    title: string;
    flight?: boolean;
  }>(),
  { theme: "land", selectable: false },
);
const emit = defineEmits<{ select: [id: string] }>();
const lookup = computed(() => new Map(props.sites.map((p) => [p.id, p])));
const line = computed(() =>
  props.path
    .map((id) => lookup.value.get(id))
    .filter((p) => !!p)
    .map((p) => `${p.x},${p.y}`)
    .join(" "),
);
function select(id: string) {
  if (props.selectable && !props.disabled) emit("select", id);
}
</script>
<template>
  <svg
    class="route-canvas"
    viewBox="0 0 1000 540"
    role="group"
    :aria-label="title"
  >
    <rect
      width="1000"
      height="540"
      rx="12"
      :fill="theme === 'sea' ? '#12353e' : '#14342e'"
    />
    <path
      d="M0 220 Q140 100 220 240 T450 200 T690 75 T1000 180 M0 260 Q130 150 210 280 T480 250 T750 150 T1000 270"
      fill="none"
      :stroke="theme === 'sea' ? '#7ba3b0' : '#557568'"
      stroke-width="32"
      opacity=".22"
    />
    <path
      d="M260 0 Q260 200 370 360 T430 540"
      fill="none"
      stroke="#5f9292"
      stroke-width="16"
      opacity=".35"
    />
    <text x="40" y="62" class="region">{{ title }}</text>
    <path
      v-for="([a, b], i) in edges"
      :key="i"
      :d="`M${lookup.get(a)?.x} ${lookup.get(a)?.y} L${lookup.get(b)?.x} ${lookup.get(b)?.y}`"
      stroke="#a9976d"
      stroke-width="3"
      fill="none"
      opacity=".5"
    />
    <polyline
      :points="line"
      fill="none"
      :stroke="flight ? '#a6e8ef' : '#f4d48d'"
      stroke-width="5"
      :stroke-dasharray="flight ? '10 7' : undefined"
    />
    <g
      v-for="site in sites"
      :key="site.id"
      :transform="`translate(${site.x} ${site.y})`"
      class="map-site"
      :role="selectable ? 'button' : undefined"
      :tabindex="selectable && !disabled ? 0 : undefined"
      :aria-label="site.subtitle ? `${site.name} · ${site.subtitle}` : site.name"
      :aria-pressed="selectable ? selected === site.id : undefined"
      :aria-disabled="selectable ? disabled : undefined"
      @click="select(site.id)"
      @keydown.enter.prevent.stop="select(site.id)"
      @keydown.space.prevent.stop="select(site.id)"
    >
      <rect x="-74" y="-24" width="148" :height="site.subtitle ? 88 : 66" rx="8" class="site-hit" />
      <circle
        r="9"
        :fill="
          current === site.id
            ? '#fff4c9'
            : selected === site.id
              ? '#d6b669'
              : '#648578'
        "
        stroke="#e3ce97"
        stroke-width="2"
      />
      <text y="29" text-anchor="middle" class="site-name">{{ site.name }}</text>
      <text v-if="site.subtitle" y="50" text-anchor="middle" class="site-subtitle">{{ site.subtitle }}</text>
    </g>
    <slot />
    <text x="30" y="515" class="context">路线示意 · 距离按行程表计算</text>
  </svg>
</template>
<style scoped>
.route-canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1000/540;
  min-width: 0;
  align-self: center;
}
.site-name {
  fill: #fff0c9;
  font-size: 18px;
  paint-order: stroke;
  stroke: #132b24;
  stroke-width: 4px;
}
.site-subtitle { fill: #e1c791; font-size: 14px; paint-order: stroke; stroke: #132b24; stroke-width: 3px; }
.region {
  fill: #b1c5b1;
  font-size: 27px;
  letter-spacing: 4px;
}
.context {
  fill: #b0c4b7;
  font-size: 15px;
}
.map-site {
  outline: none;
}
.map-site[role="button"] {
  cursor: pointer;
}
.site-hit {
  fill: transparent;
  stroke: transparent;
  stroke-width: 2;
}
.map-site[role="button"]:hover .site-hit,
.map-site:focus-visible .site-hit {
  fill: #c9b37622;
  stroke: #f2d794;
}
.map-site[aria-pressed="true"] .site-hit {
  fill: #c9b37618;
  stroke: #bba56c;
}
.map-site[aria-disabled="true"] {
  cursor: default;
}
</style>
