// Deliberately isolated scene fixture. Not a continuous playthrough or production save.
import { createApp, h, shallowRef } from 'vue';
import { createGame, dispatch, type Intent } from '/src/core';
import Scene from '/src/golden-story/GoldenStoryScene.vue';
const s = createGame('场景隔离验收','wood',42,'insightful');
s.realm=2;s.limit=6000;s.outerSea.location='ferry';s.outerSea.met=true;s.goldenCore.farShore=true;s.herbs=20;s.stones=100;
const game=shallowRef(s);let id=0;
createApp({render:()=>h(Scene,{game:game.value,busy:false,place:'sea',onAct:(a:Intent)=>{game.value=dispatch(game.value,{...a,id:`isolated-${++id}`});},onClose:()=>{}})}).mount('#app');
