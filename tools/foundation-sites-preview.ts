import { createApp,h,shallowRef,ref } from 'vue';
import FoundationPanel from '../src/foundation-journey/FoundationPanel.vue';
import { foundationSiteCheckpoint as siteCheckpoint,foundationMapCheckpoint } from './foundation-sites-checkpoint';
import { dispatch,validState,type Intent } from '../src/core';
import '../src/style.css';import '../src/scene.css';import '../src/immersive.css';import '../src/readability.css';
const game=shallowRef(siteCheckpoint('estate',true)),revision=ref(0);let serial=0;
createApp({setup:()=>()=>h('main',{style:{margin:0,padding:'12px',maxWidth:'none'}},[
 h('nav',{'aria-label':'筑基现场检查'},(['estate','snow'] as const).flatMap(site=>[false,true].map(done=>h('button',{onClick:()=>{game.value=siteCheckpoint(site,done);revision.value++;}},`${site==='estate'?'药庄':'雪线'}${done?'完成现场':'试炼前'}`)))),
 h('button',{onClick:()=>{game.value=foundationMapCheckpoint();revision.value++;}},'苏婉宁修图交接'),
 h('small','开发检查点 · 全部通过公开命令生成 · 不读写玩家存档'),
 h(FoundationPanel,{key:revision.value,game:game.value,busy:false,onAct:(intent:Intent)=>{const next=dispatch(game.value,{...intent,id:`foundation-sites-${++serial}`});if(!validState(next))throw Error('Invalid checkpoint');game.value=next;}})
])}).mount('#app');
