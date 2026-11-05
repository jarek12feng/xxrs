<script setup lang="ts">
import type { State } from "../world";
import { computed } from "vue";
import { auctionNotice, auctionVenues, venueIds, venueAuction } from "./index";
import { lotInfo } from "./catalog";
const props = defineProps<{ game: State }>();
const known = computed(() =>
  venueIds
    .filter((v) => venueAuction(props.game, v))
    .map((v) => ({
      venue: v,
      def: auctionVenues[v],
      notice: auctionNotice(props.game, v),
    })),
);
</script>
<template>
  <details v-if="known.length" aria-label="已知拍卖会讯">
    <summary>已收下的拍卖目录</summary>
    <article v-for="entry in known" :key="entry.venue">
      <h4>{{ entry.def.place }} · {{ entry.def.name }}</h4>
      <p>
        第 {{ entry.notice.opens }} 月开场，第
        {{ entry.notice.closes }} 月截止。参拍须前往当地拍卖行。
      </p>
      <p v-if="entry.notice.saved">
        已收目录：{{
          entry.notice.saved.lots.map((l) => lotInfo(l.item).name).join("、")
        }}{{
          game.month >= entry.notice.saved.closes
            ? "（旧届，已过期）"
            : entry.notice.saved.closed
              ? "（本届已散场）"
              : ""
        }}
      </p>
    </article>
  </details>
</template>
