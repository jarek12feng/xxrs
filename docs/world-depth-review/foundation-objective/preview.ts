import { createApp, h, shallowRef } from 'vue';
import { dispatch, migrateSave, validState, type Intent } from '../../../src/core';
import { journeyCheckpoint } from '../../../tools/foundation-journey-checkpoint';
import CultivationOutlook from '../../../src/CultivationOutlook.vue';
import FoundationPanel from '../../../src/foundation-journey/FoundationPanel.vue';
import '../../../src/style.css';
import '../../../src/scene.css';
import '../../../src/immersive.css';
import '../../../src/readability.css';
const key = 'xxrs-foundation-objective-isolated';
const saved = sessionStorage.getItem(key);
const payload = saved ? JSON.parse(saved) : null;
const initial = journeyCheckpoint('male',true);
// Isolated near-milestone fixture; never reads a player's game saves.
initial.foundationJourney.condensation = false;
initial.foundationJourney.cultivation = 492;
const game = shallowRef(payload ? migrateSave(payload.state) : initial);
let serial = payload?.serial ?? 0;
function act(intent: Intent) {
  const next = dispatch(game.value,{...intent,id:`objective-preview-${++serial}`});
  if (!validState(next)) throw Error('Invalid objective preview state');
  game.value = next;
  sessionStorage.setItem(key,JSON.stringify({state:next,serial}));
}
createApp({render:()=>h('main',{style:'max-width:1100px;margin:auto;padding:16px'},[
  h('p',`隔离验收 · 第 ${game.value.month} 月 · 修行 ${game.value.foundationJourney.cultivation} · 不读写正式存档`),
  game.value.foundationJourney.duel ? h(FoundationPanel,{game:game.value,mode:'journey',busy:false,onAct:act}) : h(CultivationOutlook,{game:game.value,automatic:true,compact:true,onAct:act})
])}).mount('#app');
