<script setup lang="ts">
defineProps<{
  image: string;
  title: string;
  eyebrow?: string;
  body?: string;
  portrait?: string | null;
  speaker?: string;
  quote?: string;
  headingId?: string;
  compact?: boolean;
}>();
</script>
<template>
  <div
    class="scene-backdrop"
    :class="{ 'scene-compact': compact }"
    role="region"
    :aria-label="title + '场景'"
  >
    <img class="scene-art" :src="image" :alt="title + '场景背景'" />
    <div class="scene-ink" aria-hidden="true"></div>
    <div class="scene-narrative">
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h2 :id="headingId" :tabindex="headingId ? -1 : undefined">
        {{ title }}
      </h2>
      <p v-if="body" class="scene-prose">{{ body }}</p>
      <div v-if="speaker" class="scene-speaker">
        <img v-if="portrait" :src="portrait" :alt="speaker + '肖像'" />
        <span v-else class="scene-seal" aria-hidden="true">{{
          speaker[0]
        }}</span>
        <div>
          <strong>{{ speaker }}</strong>
          <p v-if="quote">“{{ quote }}”</p>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>
