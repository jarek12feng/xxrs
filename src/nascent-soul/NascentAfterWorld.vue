<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../world";
import { characterArt, heroArt } from "../presentation/art";
const props = defineProps<{ game: State }>();
const n = computed(() => props.game.nascentSoul);
const voyage = computed(() => n.value.ability !== "none");
// The saved attendance list is authoritative. An anonymous envoy never impersonates a named elder.
const guests = computed(() =>
  n.value.guests.map((name) => ({
    name,
    art:
      name === "苏婉宁"
        ? "/art/companionship/shentinglan-travel.webp"
        : name === "尹照川"
          ? "/art/companionship/yinzhaochuan-travel.webp"
          : "/art/review-fixes/duty-envoy.webp",
  })),
);
</script>
<template>
  <div
    class="after-world"
    :class="{
      voyage,
      formal: n.celebration === 'formal',
      sheltered: ['sheltered', 'done'].includes(n.ability),
      crossed: n.ability === 'done',
    }"
    :data-ability="n.ability"
    :data-celebration="n.celebration"
  >
    <img
      class="after-hero"
      :src="
        characterArt(
          heroArt(game.social.gender, game.realm),
          voyage ? 'guard' : 'idle',
        )
      "
      :alt="voyage ? '你在岸边护持潮隙' : '你出关立于礼庭'"
    />
    <template v-if="voyage">
      <div class="tidal-current" aria-hidden="true"><i></i><i></i><i></i></div>
      <div
        v-if="['sheltered', 'done'].includes(n.ability)"
        class="crossing-ward"
        role="img"
        aria-label="元婴护持横贯潮隙"
      ></div>
      <img
        class="survey-boat"
        src="/art/review-fixes/survey-boat.webp"
        alt="携测杆与航图的测绘队木舟"
      />
      <div
        v-if="n.ability === 'done'"
        class="shore-marker"
        aria-label="彼岸新路标"
      >
        ◆<span>新路标</span>
      </div>
      <div class="after-receipt" role="status">
        <strong>{{
          n.ability === "surveyed"
            ? "辨清乱流 · 测绘舟候行"
            : n.ability === "sheltered"
              ? "护持已展 · 两岸相接"
              : "测绘舟已抵彼岸"
        }}</strong
        ><span>{{
          n.ability === "surveyed"
            ? "退路标记已经立下，尚须稳住渡口。"
            : n.ability === "sheltered"
              ? "护持延至险段，测绘队等你引航。"
              : "测杆与航图收妥，彼岸亮起报安的灯。"
        }}</span>
      </div>
    </template>
    <template v-else>
      <div
        v-if="n.celebration === 'formal'"
        class="ceremony-runner"
        aria-hidden="true"
      ></div>
      <div
        v-if="['simple', 'formal'].includes(n.celebration)"
        class="ceremony-table"
        :aria-label="
          n.celebration === 'formal' ? '观礼案与往来书函' : '简礼茶案'
        "
      >
        <i></i><i></i><img src="/art/items/family-letter.webp" alt="观礼书函" />
      </div>
      <figure
        v-for="(guest, index) in guests"
        :key="guest.name"
        class="ceremony-guest"
        :style="{
          left: `${6 + index * 10}%`,
          bottom: `${24 + (index % 2) * 4}%`,
        }"
      >
        <img :src="guest.art" :alt="guest.name" />
        <figcaption>{{ guest.name }}</figcaption>
      </figure>
      <div class="after-receipt" role="status">
        <strong>{{
          n.celebration === "formal"
            ? "元婴观礼 · 旧识来贺"
            : n.celebration === "simple"
              ? "一盏清茶 · 与旧识行简礼"
              : n.celebration === "deferred"
                ? "观礼暂缓 · 平安信先行"
                : "出关庭前 · 待定礼仪"
        }}</strong
        ><span>{{
          n.guests.length ? "到场：" + n.guests.join("、") : "庭中暂未入席。"
        }}</span>
      </div>
    </template>
  </div>
</template>
<style scoped>
.after-world {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.after-hero {
  position: absolute;
  left: 43%;
  bottom: 19%;
  height: 50%;
  width: 20%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 12px 10px #0008);
  z-index: 2;
}
.ceremony-guest {
  position: absolute;
  margin: 0;
  width: 13%;
  height: 37%;
  z-index: 2;
  text-align: center;
}
.ceremony-guest img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 9px 8px #0008);
}
.ceremony-guest figcaption {
  position: absolute;
  top: -28px;
  left: 0;
  right: 0;
  font-size: 12px;
  white-space: nowrap;
  color: #f8e6bc;
  background: #182d25dc;
  padding: 4px;
}
.ceremony-runner {
  position: absolute;
  left: 42%;
  bottom: 12%;
  width: 19%;
  height: 36%;
  transform: perspective(300px) rotateX(55deg);
  background: #783e33b5;
  border: 3px double #ccb57d;
}
.ceremony-table {
  position: absolute;
  left: 20%;
  bottom: 16%;
  width: 18%;
  height: 8%;
  background: linear-gradient(#6d5036, #392b20);
  border: 3px solid #8a6a44;
  box-shadow: 0 10px 10px #0006;
  z-index: 3;
}
.ceremony-table:before,
.ceremony-table:after {
  content: "";
  position: absolute;
  top: 100%;
  width: 6px;
  height: 24px;
  background: #493723;
}
.ceremony-table:after {
  right: 0;
}
.ceremony-table img {
  position: absolute;
  width: 50%;
  height: 80px;
  object-fit: contain;
  bottom: 40%;
  left: 24%;
}
.ceremony-table i {
  position: absolute;
  left: 8%;
  bottom: 100%;
  width: 18px;
  height: 13px;
  background: #b4c6b7;
  border-radius: 3px 3px 8px 8px;
}
.ceremony-table i + i {
  left: 80%;
}
.formal .ceremony-table {
  border-color: #c0a06b;
}
.after-receipt {
  position: absolute;
  left: 5%;
  bottom: 4%;
  width: 48%;
  padding: 12px 16px;
  background: #10291eeb;
  border-left: 2px solid #d5bb7e;
  display: grid;
  gap: 5px;
  font-size: 14px;
  color: #f4e5c8;
  z-index: 4;
}
.after-receipt strong {
  font-size: 19px;
}
.voyage .after-hero {
  left: 10%;
  bottom: 22%;
  height: 44%;
  width: 21%;
}
.survey-boat {
  position: absolute;
  left: 30%;
  bottom: 23%;
  width: 26%;
  height: 31%;
  object-fit: contain;
  z-index: 2;
  transition:
    left 1.2s,
    bottom 1.2s,
    transform 1.2s;
}
.crossed .survey-boat {
  left: 36%;
  bottom: 42%;
  transform: scale(0.72);
}
.tidal-current {
  position: absolute;
  left: 29%;
  bottom: 18%;
  width: 45%;
  height: 38%;
  transform: rotate(-12deg);
}
.tidal-current i {
  position: absolute;
  inset: 15%;
  border-top: 6px double #8cb8b3a0;
  border-radius: 50%;
  transform: rotate(18deg);
}
.tidal-current i + i {
  inset: 35% 3%;
  transform: rotate(-15deg);
}
.tidal-current i + i + i {
  inset: 55% 15%;
  transform: rotate(12deg);
}
.sheltered .tidal-current {
  opacity: 0.35;
}
.crossing-ward {
  position: absolute;
  left: 24%;
  bottom: 27%;
  width: 43%;
  height: 22%;
  border: 3px double #c4edce;
  border-radius: 50%;
  box-shadow:
    0 0 28px #a5e8c788,
    inset 0 0 38px #a5e8c755;
  transform: rotate(-17deg);
}
.shore-marker {
  position: absolute;
  left: 59%;
  bottom: 48%;
  color: #f0d28c;
  text-shadow: 0 0 12px #ffdf9c;
  font-size: 32px;
}
.shore-marker span {
  display: block;
  font-size: 12px;
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
@media (max-width: 900px) {
  .after-hero {
    bottom: 46%;
    height: 35%;
  }
  .ceremony-guest {
    bottom: 52% !important;
    height: 25%;
  }
  .ceremony-table {
    bottom: 46%;
    height: 4%;
  }
  .ceremony-runner {
    bottom: 42%;
    height: 24%;
  }
  .after-receipt {
    bottom: 46%;
    left: 3%;
    width: 42%;
    font-size: 12px;
  }
  .after-receipt strong {
    font-size: 14px;
  }
  .voyage .after-hero {
    bottom: 49%;
    height: 30%;
  }
  .survey-boat {
    bottom: 48%;
    height: 23%;
  }
  .crossed .survey-boat {
    bottom: 58%;
  }
  .crossing-ward {
    bottom: 49%;
  }
  .tidal-current {
    bottom: 45%;
  }
  .shore-marker {
    bottom: 57%;
  }
}
</style>
