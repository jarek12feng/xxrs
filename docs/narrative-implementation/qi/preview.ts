// Isolated component QA. Checkpoint generated entirely by normal domain commands;
// this page does not read or overwrite the player's IndexedDB save.
import { createApp,h,shallowRef } from 'vue';
import { createGame,dispatch,migrateSave,type Intent } from '../../../src/core';
import { foundationStep } from '../../../tools/foundation-playthrough';
import { qiNarrativeNext } from '../../../src/qi-journey/narrative';
import { qiError } from '../../../src/qi-journey/rules';
import QiNarrativeScene from '../../../src/qi-journey/QiNarrativeScene.vue';
let checkpoint=createGame('石涧验收','wood',42,'insightful');
for(let i=0;i<550;i++){
 if(qiNarrativeNext(checkpoint)==='cave:depart'&&!qiError(checkpoint,'cave:depart'))break;
 checkpoint=dispatch(checkpoint,{...foundationStep(checkpoint),id:`preview-path-${i}`});
}
const previous=sessionStorage.getItem('qi-component-qa');
if(previous){try{checkpoint=migrateSave(JSON.parse(previous));}catch{sessionStorage.removeItem('qi-component-qa');}}
const game=shallowRef(checkpoint);let id=checkpoint.seen.length;
createApp({render:()=>[h('div',{id:'banner'},`隔离组件验收 · 正常命令生成检查点 · 第${game.value.month}月 · 不读写玩家存档`),h(QiNarrativeScene,{game:game.value,busy:false,onAct:(intent:Intent)=>{game.value=dispatch(game.value,{...intent,id:`preview-${id++}`});sessionStorage.setItem("qi-component-qa",JSON.stringify(game.value));}})]}).mount('#app');
