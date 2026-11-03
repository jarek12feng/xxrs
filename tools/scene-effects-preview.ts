import { createApp,h,shallowRef } from 'vue';
import OpeningScene from '../src/scene2d/OpeningScene.vue';
import EventScene from '../src/scene2d/EventScene.vue';
import { createGame,dispatch,eventView,activeEventId,type Intent } from '../src/core';
import '../src/style.css';import '../src/scene.css';import '../src/immersive.css';import '../src/readability.css';
let serial=0;
const send=(s:ReturnType<typeof createGame>,intent:Intent)=>dispatch(s,{...intent,id:`effect-${++serial}`});
function prepared(){let s=createGame('现场检查','wood',42);for(const action of ['inspect','depart','medicine','prepare'] as const)s=send(s,{type:'adventure',action});return s;}
function beforePreparation(){let s=createGame('现场检查','wood',42);for(const action of ['inspect','depart','medicine'] as const)s=send(s,{type:'adventure',action});return s;}
function beforeRescue(){let s=prepared();for(const action of ['depart','trail'] as const)s=send(s,{type:'adventure',action});return s;}
function meeting(){let s=prepared();for(const action of ['depart','trail','challenge','return'] as const)s=send(s,{type:'adventure',action});return send(s,{type:'advance',activity:'work',months:3});}
const state=shallowRef(prepared());
createApp({render(){const e=eventView(state.value);return h('main',{style:{maxWidth:'none',padding:0,height:'100dvh',display:'flex',flexDirection:'column'}},[
 h('nav',{},[h('button',{onClick:()=>state.value=prepared()},'药炉准备'),h('button',{onClick:()=>state.value=beforePreparation()},'配药动作'),h('button',{onClick:()=>state.value=beforeRescue()},'营救动作'),h('button',{onClick:()=>state.value=meeting()},'剧情对话'),h('small','公开命令检查点 · 不读写存档')]),
 e?h(EventScene,{image:'/art/scene2d/ferry.png',title:e.title,body:e.body,speaker:'陆迟',portrait:'/art/characters/luchi.webp'},()=>e.options.map(o=>h('button',{class:'choice',disabled:!!o.disabled,onClick:()=>state.value=send(state.value,{type:'choose',instanceId:activeEventId(state.value),option:o.id})},[o.label,h('small',o.disabled||o.hint)]))):h(OpeningScene,{style:{flex:1,minHeight:0},game:state.value,busy:false,onAct:(i:Intent)=>state.value=send(state.value,i)})
]);}}).mount('#app');
