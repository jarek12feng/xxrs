<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { actorAppearance, type CharacterId, type Pose } from "./art";
const props = withDefaults(
  defineProps<{ character: CharacterId; pose?: Pose; facing?: number; label: string }>(),
  { pose: "idle" },
);
const appearance = computed(() => actorAppearance(props.character, props.pose, props.facing));
const src = computed(() => appearance.value.src);
const failed = ref(false);
watch(src, () => {
  failed.value = false;
});
</script>
<template>
  <div class="character-sprite" :data-character="character" :data-pose="pose">
    <img
      v-if="!failed"
      :src="src"
      :style="{ transform: `scaleX(${appearance.flipX ? -1 : 1})` }"
      :alt="label"
      width="427"
      height="640"
      decoding="sync"
      @error="failed = true"
    />
    <span v-else class="sprite-fallback">{{ label }}</span>
  </div>
</template>
<style scoped>
.character-sprite {
  display: flex;
  align-items: end;
  justify-content: center;
  height: 100%;
  min-width: 0;
}
.character-sprite img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
}
.sprite-fallback {
  color: #f5e7bf;
  padding: 16px;
}
</style>
