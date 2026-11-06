<script setup lang="ts">
import { computed } from "vue";
import type { State } from "../world";
import { ceremonyGuests } from "./guest-art";
import { crossingView } from "./crossing";
import { characterArt, heroArt } from "../presentation/art";
const props = defineProps<{ game: State }>();
const n = computed(() => props.game.nascentSoul);
const crossing = computed(() => crossingView(props.game));
const voyage = computed(() => n.value.ability !== "none");
// The saved attendance list is authoritative. An anonymous envoy never impersonates a named elder.
const guests = computed(() => ceremonyGuests(n.value.guests));
</script>
<template>
  <div
    class="after-world"
    :class="{
      voyage,
      formal: n.celebration === 'formal',
      'main-held': crossing.main,
      'shore-held': crossing.shore,
      'at-eddy': crossing.position === 'eddy',
      'seal-fixed': crossing.fixed,
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
      <div class="far-landing" aria-label="彼岸可登岸的石坪"></div>
      <div class="tidal-current main-current" aria-hidden="true">
        <i></i><i></i><i></i>
      </div>
      <div class="tidal-current shore-current" aria-hidden="true">
        <i></i><i></i>
      </div>
      <div
        v-if="crossing.main"
        class="crossing-ward main-ward"
        role="img"
        aria-label="主潮被压低，通往回水湾的水道敞开"
      ></div>
      <div
        v-if="crossing.shore"
        class="crossing-ward shore-ward"
        role="img"
        aria-label="侧岸回流分开，登岸水面平稳"
      ></div>
      <img
        v-if="crossing.fixed"
        class="fixed-seal"
        src="/art/outer-sea/seal.webp"
        alt="镇潮印悬于主潮，独立镇住浪墙"
      />
      <div class="eddy-refuge">回水湾 · 可安全停舟</div>
      <img
        class="survey-boat trailing-boat"
        src="/art/review-fixes/survey-boat.webp"
        alt="载着测杆的后舟"
      />
      <img
        class="survey-boat"
        src="/art/review-fixes/survey-boat.webp"
        :alt="crossing.boat"
      />
      <div
        v-if="n.ability === 'done'"
        class="shore-marker"
        aria-label="彼岸新路标与已展开的测绘航图"
      >
        ◆<span>测杆已立 · 航图展开</span><i class="survey-chart"></i>
      </div>
      <div
        v-if="n.ability === 'done'"
        class="survey-team"
        role="img"
        aria-label="两名测绘队员在岸上持杆测量"
      >
        <i></i><i></i>
      </div>
      <div class="after-receipt" role="status">
        <strong>{{ crossing.boat }}</strong>
        <span v-if="n.ability === 'done'"
          >护渡已成，彼岸留下测绘地与通行记录。</span
        >
        <span v-else
          >{{ crossing.main ? "主潮已稳" : "主潮横截航道" }} ·
          {{ crossing.shore ? "落脚处已稳" : "侧岸回流仍在"
          }}{{ crossing.fixed ? " · 镇潮印独立镇流" : "" }}</span
        >
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
          left: `${index < 2 ? 7 + index * 15 : 67 + (index - 2) * 15}%`,
          bottom: `24%`,
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
  left: 23%;
  bottom: 18%;
  width: 20%;
  height: 25%;
  object-fit: contain;
  transform-origin: center bottom;
  z-index: 2;
  transition:
    left 1.2s,
    bottom 1.2s,
    transform 1.2s;
}
.crossed .survey-boat {
  left: 45%;
  bottom: 49%;
  transform: scale(0.55);
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
.main-held .main-current,
.shore-held .shore-current {
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
  left: 55%;
  bottom: 49%;
  color: #f0d28c;
  text-shadow: 0 0 12px #ffdf9c;
  font-size: 32px;
}
.shore-marker span {
  display: block;
  font-size: 12px;
}
.at-eddy .survey-boat {
  left: 35%;
  bottom: 34%;
  transform: scale(0.87);
}
.survey-boat.trailing-boat {
  margin-left: -7%;
  margin-bottom: -5%;
  width: 17%;
}
.far-landing {
  position: absolute;
  left: 46%;
  bottom: 51%;
  width: 18%;
  height: 13%;
  background-image: linear-gradient(#53685633, #223d4688), url('/art/outer-sea/ferry.webp');
  background-size: 100% 100%, 500% 500%;
  background-position: center, left bottom;
  clip-path: polygon(
    15% 28%,
    38% 10%,
    69% 17%,
    89% 43%,
    100% 68%,
    82% 92%,
    39% 87%,
    0 59%
  );
  filter: drop-shadow(0 9px 5px #17393699);
}
.crossed .survey-boat.trailing-boat {
  margin-left: -3%;
  margin-bottom: -2%;
}
.survey-team {
  position: absolute;
  left: 51%;
  bottom: 58%;
  width: 5%;
  height: 6%;
  display: flex;
  gap: 12px;
  z-index: 3;
}
.survey-team i {
  display: block;
  width: 13px;
  height: 25px;
  background: linear-gradient(90deg, #5e6656, #a3aa8b);
  border-radius: 45% 45% 15% 15%;
  position: relative;
}
.survey-team i:before {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background: #c7b592;
  top: -6px;
  left: 2px;
  border-radius: 50%;
}
.survey-team i:after {
  content: "";
  position: absolute;
  width: 2px;
  height: 40px;
  background: #cbbb8b;
  top: -11px;
  left: 15px;
}
.main-current {
  left: 23%;
  bottom: 26%;
  width: 29%;
  height: 29%;
}
.shore-current {
  left: 43%;
  bottom: 46%;
  width: 22%;
  height: 24%;
  transform: rotate(22deg);
}
.crossed .tidal-current {
  opacity: 0.35;
}
.main-ward {
  left: 23%;
  bottom: 29%;
  width: 30%;
  height: 17%;
}
.shore-ward {
  left: 43%;
  bottom: 48%;
  width: 20%;
  height: 15%;
  transform: rotate(20deg);
}
.fixed-seal {
  position: absolute;
  left: 28%;
  bottom: 45%;
  width: 8%;
  height: 12%;
  object-fit: contain;
  filter: drop-shadow(0 0 18px #d4eab0);
  z-index: 3;
}
.eddy-refuge {
  position: absolute;
  left: 35%;
  bottom: 37%;
  color: #f6ebcd;
  background: #1c3b35b8;
  border-radius: 50%;
  border: 1px dashed #b6d5bb;
  padding: 24px 12px;
  font-size: 12px;
}
.survey-chart {
  display: block;
  width: 58px;
  height: 30px;
  background: repeating-linear-gradient(
    35deg,
    #dccaa0 0 8px,
    #748d7966 9px 11px
  );
  border: 2px solid #8c7751;
  transform: skewX(-15deg);
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
