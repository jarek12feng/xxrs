<script setup lang="ts">
export interface CombatOption {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}
const props = withDefaults(
  defineProps<{
    turn: number;
    player: number;
    playerMax: number;
    enemy: number;
    enemyMax: number;
    enemyName: string;
    tell: string;
    options: CombatOption[];
    busy?: boolean;
    retreatLabel?: string;
    retreatDisabled?: boolean;
  }>(),
  { busy: false, retreatDisabled: false, retreatLabel: "沿原路撤退" },
);
const emit = defineEmits<{ move: [id: string]; retreat: [] }>();
function choose(id: string) {
  const option = props.options.find((option) => option.id === id);
  if (!props.busy && option && !option.disabled) emit("move", id);
}
function retreat() {
  if (!props.busy && !props.retreatDisabled) emit("retreat");
}
// Holding a key must not spend successive turns after persistence unlocks the bar.
function keyboard(event: KeyboardEvent) {
  if (event.repeat && (event.key === "Enter" || event.key === " "))
    event.preventDefault();
}
</script>
<template>
  <section class="combat-bar" aria-label="战场招式与来势" @keydown="keyboard">
    <div class="combat-vitals">
      <span>你的气势 {{ player }} / {{ playerMax }}</span
      ><span>第 {{ turn + 1 }} 合</span
      ><span>{{ enemyName }} {{ enemy }} / {{ enemyMax }}</span>
    </div>
    <p class="combat-tell">来势 · {{ tell }}</p>
    <div class="combat-commands">
      <button
        v-for="option in options"
        :key="option.id"
        :disabled="busy || option.disabled"
        @click="choose(option.id)"
      >
        <strong>{{ option.label }}</strong
        ><small v-if="option.detail">{{ option.detail }}</small></button
      ><button
        class="combat-retreat"
        :disabled="busy || retreatDisabled"
        @click="retreat"
      >
        {{ retreatLabel }}
      </button>
    </div>
  </section>
</template>
<style scoped>
.combat-bar {
  position: absolute;
  left: 4%;
  right: 4%;
  bottom: 2%;
  z-index: 6;
  pointer-events: auto;
  padding: 12px 18px;
  color: #f4ead3;
  background: linear-gradient(100deg, #0b201af7, #18392df5);
  border: 1px solid #b49d6a99;
  box-shadow: 0 6px 24px #0006;
}
.combat-vitals {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #e0d2ab;
}
.combat-tell {
  font-size: 14px;
  line-height: 1.45;
  margin: 8px 0;
  color: #f7e9c9;
}
.combat-commands {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(120px, 0.65fr);
  gap: 10px;
}
.combat-commands button {
  display: grid;
  gap: 4px;
  align-content: center;
  min-height: 52px;
  padding: 8px 12px;
  cursor: pointer;
  border: 1px solid #ae9969;
  background: #294839;
  color: #f4e7cd;
  text-align: left;
}
.combat-commands button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.combat-commands small {
  font-size: 12px;
  color: #ddd7c2;
  line-height: 1.4;
}
.combat-commands strong {
  font-size: 15px;
}
.combat-commands .combat-retreat {
  background: #28342c;
  text-align: center;
}
.combat-commands button:focus-visible {
  outline: 2px solid #f4d899;
  outline-offset: 3px;
}
@media (max-width: 900px) {
  .combat-bar {
    left: 2%;
    right: 2%;
    padding: 10px;
  }
  .combat-commands {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .combat-commands .combat-retreat {
    grid-column: 1/-1;
    min-height: 34px;
  }
  .combat-vitals {
    font-size: 11px;
  }
  .combat-tell {
    font-size: 12px;
  }
}
</style>
