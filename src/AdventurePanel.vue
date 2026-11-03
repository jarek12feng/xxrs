<script setup lang="ts">
import OpeningScene from "./scene2d/OpeningScene.vue";
import type { State, Intent } from "./core";
import type { ActionReceipt } from "./action-feedback";
defineProps<{ game: State; busy: boolean; receipt?: ActionReceipt | null }>();
const emit = defineEmits<{ act: [intent: Intent]; cultivate: [] }>();
</script>
<template>
  <OpeningScene
    :game="game"
    :busy="busy"
    @act="emit('act', $event)"
    @cultivate="emit('cultivate')"
  />
</template>
