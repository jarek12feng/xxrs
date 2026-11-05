<script setup lang="ts">
import { knownFriendJourney, supplyQuote } from "../friend-journey";
import { computed } from "vue";
import type { Intent, State } from "../world";
import {
  personalContacts,
  personalTopics,
  pendingPersonal,
  type PersonalTopic,
} from "./personal";
import { correspondenceQuote } from "./rules";
const props = defineProps<{ game: State; busy: boolean }>();
const emit = defineEmits<{ act: [intent: Intent] }>();
const contacts = computed(() =>
  personalContacts(props.game).map((contact) => ({
    ...contact,
    pending: pendingPersonal(props.game, contact.id),
    choices: (Object.entries(personalTopics) as [PersonalTopic, string][]).map(
      ([topic, label]) => {
        const action = { kind: "write" as const, recipient: contact.id, topic };
        return {
          label,
          action,
          error: correspondenceQuote(props.game, action),
        };
      },
    ),
  })),
);
</script>
<template>
  <details v-if="contacts.length" class="personal-contacts">
    <summary>写信与联络</summary>
    <p>信随驿路送递，至少一月后才有回音。各自修行，不必反复寄信。</p>
    <article v-for="contact in contacts" :key="contact.id">
      <h3>{{ contact.name }}</h3>
      <template v-if="contact.id === 'su' && knownFriendJourney(game)">
        <p>{{ knownFriendJourney(game) }}</p>
        <button
          :disabled="
            busy || !!correspondenceQuote(game, { kind: 'supplyFriend' })
          "
          @click="
            emit('act', {
              type: 'correspondence',
              action: { kind: 'supplyFriend' },
            })
          "
        >
          寄灵草2，助她整备
        </button>
        <small>{{ supplyQuote(game) }}</small>
      </template>
      <p v-if="contact.pending" role="status">信已寄出，尚在候回音。</p>
      <div
        v-for="choice in contact.choices"
        :key="choice.action.topic"
        class="personal-choice"
      >
        <button
          :disabled="busy || !!choice.error"
          @click="
            emit('act', {
              type: 'correspondence',
              action: choice.action,
            })
          "
        >
          {{ choice.label }}
        </button>
        <small v-if="!contact.pending && choice.error">{{
          choice.error
        }}</small>
      </div>
    </article>
  </details>
</template>
<style scoped>
.personal-contacts {
  margin-block: 1rem;
  padding: 1rem;
  border: 1px solid #716247;
  border-radius: 8px;
}
summary {
  cursor: pointer;
}
article + article {
  margin-top: 1rem;
}
.personal-choice {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin: 0.5rem 0;
  flex-wrap: wrap;
}
small {
  color: var(--muted, #aca18c);
}
button {
  min-height: 36px;
}
</style>
