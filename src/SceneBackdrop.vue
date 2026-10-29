<script setup lang="ts">
import CharacterSprite from "./presentation/CharacterSprite.vue";
import { speakerArt } from "./presentation/art";
import { presences } from "./landmarks";
import LandmarkPresence from "./LandmarkPresence.vue";
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
    :data-atmosphere="
      presences[title]?.weather ||
      (image.includes('mist') || image.includes('cloud')
        ? 'mist'
        : image.includes('moon')
          ? 'moon'
          : 'still')
    "
    role="region"
    :aria-label="title + '场景'"
  >
    <img class="scene-art" :src="image" :alt="title + '场景背景'" />
    <div class="scene-air" aria-hidden="true"></div>
    <div class="scene-ink" aria-hidden="true"></div>
    <div class="scene-narrative">
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h2 :id="headingId" :tabindex="headingId ? -1 : undefined">
        {{ title }}
      </h2>
      <LandmarkPresence v-if="!compact" :key="title" :title="title" />
      <p v-if="body" class="scene-prose">{{ body }}</p>
      <div v-if="speaker && speakerArt[speaker] && !compact" class="scene-standing"><CharacterSprite :character="speakerArt[speaker]!" :label="speaker" /></div>
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

<style scoped>
.scene-standing { float: right; width: 110px; height: 160px; margin: 0 0 12px 12px; }
.scene-narrative { display: flow-root; }
</style>
