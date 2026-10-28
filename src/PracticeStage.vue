<script setup lang="ts">
import { computed } from "vue";
import type { Activity } from "./core";
const props = defineProps<{ activity: Activity; playing: boolean }>();
const labels: Record<Activity, string> = {
  cultivate: "吐纳 · 周天行气",
  meditate: "凝神 · 守一观心",
  study: "研读 · 翻卷悟道",
  work: "劳作 · 松畦耕作",
  gather: "采药 · 辨草入篓",
  train: "历练 · 林间行剑",
  rest: "养伤 · 静坐调息",
};
const standing = computed(() =>
  ["work", "gather", "train"].includes(props.activity),
);
</script>
<template>
  <section
    class="practice-stage"
    :class="[activity, { playing }]"
    :data-activity="activity"
    :data-playing="playing"
    aria-label="洞府人物动作"
  >
    <div class="practice-caption">
      <span>听松山居 · 修行日常</span>
      <h3>{{ labels[activity] }}</h3>
      <small role="status">{{
        playing ? "一招一息，皆是修行" : "选择修行，行功一月"
      }}</small>
    </div>
    <svg
      viewBox="0 0 640 300"
      role="img"
      :aria-label="labels[activity] + '人物场景'"
    >
      <ellipse cx="370" cy="268" rx="153" ry="19" fill="#112622" opacity=".5" />
      <path
        d="M205 263 Q370 233 540 265 L529 280 H215Z"
        fill="#7d8c7d"
        stroke="#c3b99a"
      />
      <g v-if="activity === 'work' || activity === 'gather'" class="herb-bed">
        <path
          d="M458 263 Q485 250 531 261 M455 270 Q494 257 548 271"
          fill="none"
          stroke="#8f7851"
          stroke-width="5"
        />
        <g
          v-for="x in [465, 495, 522]"
          :key="x"
          :transform="`translate(${x},255)`"
        >
          <path
            d="M0 7 V-15 M0-6 Q-20-21-15-5 Q-9 1 0-6 M0-11 Q19-27 17-12 Q10-5 0-11"
            fill="#8daa69"
            stroke="#b4c18a"
            stroke-width="2"
          />
        </g>
      </g>
      <ellipse
        v-if="!standing"
        cx="369"
        cy="252"
        rx="78"
        ry="19"
        fill="#ad9670"
        stroke="#d6bd89"
        stroke-width="2"
      />
      <g
        class="qi-rings"
        v-if="activity === 'cultivate' || activity === 'meditate'"
      >
        <ellipse
          cx="367"
          cy="181"
          rx="102"
          ry="73"
          fill="none"
          stroke="#c5dbb4"
          stroke-width="1"
        />
        <ellipse
          cx="367"
          cy="181"
          rx="116"
          ry="87"
          fill="none"
          stroke="#d6c28e"
          stroke-width=".6"
        />
      </g>
      <g class="practitioner" :class="{ standing }">
        <g v-if="standing">
          <path
            d="M345 204 L335 260 L357 261 L369 216 L389 262 L409 260 L393 200"
            fill="#243b37"
          />
          <path
            d="M333 258 Q324 268 355 267 M390 261 Q408 269 418 263"
            stroke="#ddcfad"
            stroke-width="7"
            stroke-linecap="round"
          />
        </g>
        <g v-else>
          <path
            d="M352 202 Q313 214 298 243 Q304 258 366 250 Q422 263 439 246 Q430 221 391 203Z"
            fill="#385c55"
            stroke="#92aa93"
            stroke-width="2"
          />
          <path
            d="M311 243 Q354 221 390 244 M358 247 Q394 230 424 243"
            fill="none"
            stroke="#c3c6a4"
            stroke-width="2"
          />
        </g>
        <g class="upper-body">
          <path
            d="M349 129 Q367 119 391 132 L407 217 Q373 231 333 215Z"
            fill="#62847a"
            stroke="#b0c1a3"
            stroke-width="2"
          />
          <path
            d="M350 130 L369 165 L387 131 M368 165 L357 212"
            fill="none"
            stroke="#e4d4ab"
            stroke-width="6"
          />
          <path
            d="M337 203 Q370 213 404 203"
            stroke="#294c44"
            stroke-width="9"
          />
          <path
            d="M381 210 Q397 238 411 240"
            fill="none"
            stroke="#e0c18a"
            stroke-width="4"
          />
          <path d="M360 113 V132 Q370 141 379 131 V112" fill="#d9b99a" />
          <path
            d="M345 89 Q344 63 369 62 Q397 63 395 91 L390 133 L380 119 L353 131Z"
            fill="#263430"
          />
          <ellipse cx="370" cy="94" rx="20" ry="27" fill="#e5c7a6" />
          <path
            d="M349 89 Q361 84 368 72 Q379 87 391 88 L394 74 Q381 54 358 64Z"
            fill="#233831"
          />
          <path
            d="M360 96 L365 97 M376 97 L382 96 M369 111 Q373 114 378 110"
            fill="none"
            stroke="#775d4c"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path d="M359 64 Q349 45 369 43 Q387 47 379 64" fill="#263b34" />
          <path d="M355 58 L389 55" stroke="#d0ba82" stroke-width="4" />
          <g class="left-sleeve">
            <path
              d="M348 137 Q328 140 316 185 L336 202 L357 167"
              fill="#6b8d80"
              stroke="#a9bda1"
              stroke-width="2"
            />
            <path
              d="M327 188 L350 201"
              stroke="#e0c4a2"
              stroke-width="10"
              stroke-linecap="round"
            />
          </g>
          <g class="right-sleeve">
            <path
              d="M388 137 Q410 141 429 180 L408 200 L382 165"
              fill="#63857a"
              stroke="#a9bda1"
              stroke-width="2"
            />
            <path
              d="M419 185 L394 202"
              stroke="#e0c4a2"
              stroke-width="10"
              stroke-linecap="round"
            />
            <g v-if="activity === 'work'" class="hoe">
              <path d="M400 192 L484 249" stroke="#c7a979" stroke-width="6" />
              <path
                d="M473 241 L469 260 L488 262 L493 254"
                fill="#a5b6ae"
                stroke="#cad3bd"
              />
            </g>
            <g v-if="activity === 'train'">
              <path
                d="M414 180 L491 123 L504 104 L484 115 L408 174Z"
                fill="#d6e5dd"
              />
              <path d="M404 166 L421 187" stroke="#c2a66b" stroke-width="5" />
            </g>
            <path
              v-if="activity === 'gather'"
              d="M414 195 L435 180 M430 185 Q423 169 437 172 Q446 177 430 185"
              stroke="#9bbd75"
              fill="#a1b777"
              stroke-width="3"
            />
          </g>
          <g v-if="activity === 'study'" class="book">
            <path
              d="M332 192 Q354 187 370 198 Q388 188 414 191 L408 222 Q389 216 370 228 Q351 217 335 221Z"
              fill="#e7d9b5"
              stroke="#8f815e"
              stroke-width="2"
            />
            <path
              d="M370 198 V226 M340 200 L359 204 M340 207 L358 211 M382 203 L404 199 M381 211 L401 207"
              stroke="#887d60"
            />
            <path
              class="turning-page"
              d="M371 198 Q389 183 407 189 L400 216 Q382 216 371 227Z"
              fill="#f4e5c5"
              opacity=".8"
            />
          </g>
        </g>
      </g>
      <g v-if="activity === 'meditate'" class="mind-light">
        <circle cx="370" cy="92" r="38" fill="none" stroke="#e5cf8b" />
        <circle
          cx="370"
          cy="92"
          r="45"
          fill="none"
          stroke="#b4d1bb"
          stroke-dasharray="2 12"
        />
      </g>
      <g v-if="activity === 'gather'">
        <path
          d="M440 228 L472 228 L468 259 L446 259Z"
          fill="#9a8054"
          stroke="#d4ba82"
        />
        <path
          d="M445 229 Q454 204 467 229 M442 241 H470 M444 250 H469"
          fill="none"
          stroke="#d4ba82"
          stroke-width="2"
        />
      </g>
      <g v-if="activity === 'rest'">
        <path d="M436 240 Q451 244 465 240 L462 250 H440Z" fill="#d1dcbd" />
        <path
          class="tea-steam"
          d="M445 233 Q438 225 446 215 M455 232 Q449 223 456 212"
          fill="none"
          stroke="#e8e6cb"
        />
      </g>
      <g class="sparks" fill="#d9dfad">
        <circle cx="294" cy="175" r="2" />
        <circle cx="453" cy="132" r="2" />
        <circle cx="323" cy="111" r="1.5" />
      </g>
    </svg>
  </section>
</template>
<style>
.practice-stage {
  position: relative;
  max-width: 900px;
  min-height: 280px;
  margin: 0 0 18px;
  border: 1px solid #a59b6855;
  border-radius: 10px;
  overflow: hidden;
  background:
    linear-gradient(90deg, #0d261ee8, #132d2870),
    url("/scenes/moon-terrace.png") center 62% / cover;
}
.practice-stage svg {
  display: block;
  width: 100%;
  max-height: 340px;
}
.practice-caption {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 1;
  max-width: 35%;
}
.practice-caption span {
  color: #c5b58b;
  font-size: 11px;
  letter-spacing: 0.15em;
}
.practice-caption h3 {
  font: 21px serif;
  color: #f2e1b8;
  line-height: 1.6;
  margin: 12px 0;
}
.practice-caption small {
  color: #c5d1c2;
  font-size: 11px;
}
.practice-stage .upper-body {
  transform-origin: 370px 213px;
}
.practice-stage .right-sleeve {
  transform-origin: 390px 140px;
}
.practice-stage .left-sleeve {
  transform-origin: 349px 139px;
}
.practice-stage .qi-rings {
  transform-origin: 367px 181px;
  opacity: 0.35;
}
.practice-stage .mind-light {
  transform-origin: 370px 92px;
  opacity: 0.45;
}
.practice-stage .turning-page {
  transform-origin: 370px 210px;
}
.practice-stage .sparks {
  opacity: 0;
}
.practice-stage.playing.cultivate .upper-body,
.practice-stage.playing.rest .upper-body {
  animation: practice-breath 2.4s ease-in-out infinite;
}
.practice-stage.playing .qi-rings {
  animation: practice-qi 2.4s ease-in-out infinite;
}
.practice-stage.playing.meditate .mind-light {
  animation: practice-focus 3s linear infinite;
}
.practice-stage.playing.study .turning-page {
  animation: practice-page 1.8s ease-in-out infinite;
}
.practice-stage.playing.study .upper-body {
  animation: practice-read 2s ease-in-out infinite;
}
.practice-stage.playing.work .right-sleeve {
  animation: practice-hoe 1.2s ease-in-out infinite;
}
.practice-stage.playing.work .upper-body,
.practice-stage.playing.gather .upper-body {
  animation: practice-bend 1.8s ease-in-out infinite;
}
.practice-stage.playing.gather .right-sleeve {
  animation: practice-pick 1.8s ease-in-out infinite;
}
.practice-stage.playing.train .right-sleeve {
  animation: practice-sword 1.3s ease-in-out infinite;
}
.practice-stage.playing.train .practitioner {
  animation: practice-step 1.3s ease-in-out infinite;
}
.practice-stage.playing .tea-steam {
  animation: practice-steam 2s ease-out infinite;
}
.practice-stage.playing .sparks {
  animation: practice-steam 2.5s ease-out infinite;
}
@keyframes practice-breath {
  50% {
    transform: translateY(-4px) scaleY(1.025);
  }
}
@keyframes practice-qi {
  50% {
    opacity: 0.85;
    transform: scale(1.08);
  }
}
@keyframes practice-focus {
  to {
    transform: rotate(360deg);
  }
}
@keyframes practice-page {
  50% {
    transform: scaleX(-0.7);
    opacity: 0.45;
  }
}
@keyframes practice-read {
  50% {
    transform: rotate(-2deg);
  }
}
@keyframes practice-hoe {
  50% {
    transform: rotate(-37deg);
  }
}
@keyframes practice-bend {
  50% {
    transform: rotate(12deg) translateX(7px);
  }
}
@keyframes practice-pick {
  50% {
    transform: rotate(24deg);
  }
}
@keyframes practice-sword {
  45% {
    transform: rotate(-65deg);
  }
  70% {
    transform: rotate(18deg);
  }
}
@keyframes practice-step {
  50% {
    transform: translateX(12px);
  }
}
@keyframes practice-steam {
  0% {
    opacity: 0;
  }
  30% {
    opacity: 0.7;
  }
  to {
    opacity: 0;
    transform: translateY(-22px);
  }
}
@media (max-width: 600px) {
  .practice-stage {
    min-height: 200px;
  }
  .practice-caption {
    top: 12px;
    left: 14px;
  }
  .practice-caption h3 {
    font-size: 16px;
  }
  .practice-stage svg {
    height: 240px;
    width: 150%;
    max-width: none;
    margin-left: -22%;
  }
  .practice-caption small {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .practice-stage.playing * {
    animation: none !important;
  }
  .practice-stage.playing .qi-rings {
    opacity: 0.7;
  }
}
</style>

<style>
.cultivation-room .practice-stage {
  position: sticky;
  top: 0;
  z-index: 2;
  flex: none;
}
.practice-stage:not(.playing) * {
  animation-play-state: paused;
}
</style>
