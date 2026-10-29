<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { itemArt } from "./art";
const props = withDefaults(
  defineProps<{ id: string; tier?: number; size?: number }>(),
  { tier: 0, size: 64 },
);
const src = computed(() => itemArt(props.id, props.tier));
const failed = ref(false);
watch(src, () => {
  failed.value = false;
});
</script>
<template>
  <img
    v-if="src && !failed"
    class="item-art"
    :src="src"
    alt=""
    aria-hidden="true"
    :width="size"
    :height="size"
    loading="lazy"
    decoding="async"
    @error="failed = true"
  />
</template>
<style scoped>
.item-art {
  display: inline-block;
  flex: 0 0 auto;
  object-fit: contain;
  vertical-align: middle;
  max-width: 100%;
}
</style>
