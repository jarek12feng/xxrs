<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { characterArt, type CharacterId, type Pose } from "./art";
const props = withDefaults(
  defineProps<{ character: CharacterId; pose?: Pose; label: string }>(),
  { pose: "idle" },
);
const src = computed(() => characterArt(props.character, props.pose));
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
      :alt="label"
      width="427"
      height="640"
      decoding="async"
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
