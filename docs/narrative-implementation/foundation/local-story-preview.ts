import { createApp, h, shallowRef, ref } from 'vue';
import FoundationPanel from '../../../src/foundation-journey/FoundationPanel.vue';
import { dispatch, validState, type Intent } from '../../../src/core';
import { localStoryCheckpoint } from './local-story-checkpoint';
import '../../../src/style.css';
import '../../../src/scene.css';
import '../../../src/immersive.css';
import '../../../src/readability.css';
const game=shallowRef(localStoryCheckpoint('home')),revision=ref(0);let serial=0;
createApp({setup:()=>()=>h('main',{style:{margin:0,padding:'12px',maxWidth:'none'}},[
  h('nav',{'aria-label':'独立检查点'},(['home','ferry','snow','ending'] as const).map((place,i)=>h('button',{onClick:()=>{game.value=localStoryCheckpoint(place);revision.value++;}},['师门检查点','沉井检查点','外宗检查点','归山检查点'][i]))),
  h('p','独立预览：进度由公共命令生成，仅驻内存，不读写玩家存档。'),
  h(FoundationPanel,{key:revision.value,game:game.value,busy:false,onAct:(intent:Intent)=>{
    const next=dispatch(game.value,{...intent,id:`local-story-preview-${++serial}`});
    if(!validState(next))throw Error('Invalid story checkpoint');game.value=next;
  }}),
])}).mount('#app');
