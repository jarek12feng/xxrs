import {createApp,h,ref,shallowRef} from 'vue';
import {dispatch,validState,type Intent} from '/src/core';
import StoryScenes from '/src/scene2d/StoryScenes.vue';
import GoldenStoryScene from '/src/golden-story/GoldenStoryScene.vue';
import WorldAtlas from '/src/WorldAtlas.vue';
import {finishGoldenCompletion,goldenLateCheckpoint,goldenCompletionPlayer} from '/tools/golden-completion-checkpoint';
import {outerSeaCheckpoint} from '/tools/outer-sea-checkpoint';
import {conclaveCheckpoint} from '/tools/conclave-checkpoint';
import {chooseLizhaoMove} from '/tools/lizhao-fixture';
import '/src/style.css';import '/src/scene.css';import '/src/immersive.css';import '/src/readability.css';
const run=finishGoldenCompletion(goldenLateCheckpoint('spring'),'self','marry');
const checkpoints=run.checkpoints;checkpoints.tide=outerSeaCheckpoint();
const q=goldenCompletionPlayer(conclaveCheckpoint('spring'));q.until(()=>q.state.outerSea.reminded,()=>q.send({type:'advance',activity:'cultivate',months:120}),'notice');q.act({kind:'visit'});q.act({kind:'meet'});checkpoints.question=q.state;
const p=goldenCompletionPlayer(checkpoints.late);p.rest();p.work(180);p.herbs(32);p.lizhao({kind:'visit'});p.lizhao({kind:'route',route:'cooperate'});p.lizhao({kind:'prepare',preparation:'purify'});p.lizhao({kind:'enter'});
for(let i=0;i<2;i++){p.lizhao({kind:'fight'});p.until(()=>!p.state.lizhao.duel,()=>p.lizhao({kind:'move',move:chooseLizhaoMove(p.state)}),'fight',18);if(!i)p.lizhao({kind:'deeper'});}
p.lizhao({kind:'chamber'});checkpoints['lizhao-chamber']=p.state;p.lizhao({kind:'verify'});p.lizhao({kind:'allocate',allocation:'seize'});p.lizhao({kind:'return'});p.lizhao({kind:'rumor'});p.lizhao({kind:'respond',response:'company'});checkpoints.bay=p.state;p.lizhao({kind:'fight'});checkpoints['bay-fight']=p.state;
const game=shallowRef(checkpoints.late),mode=ref('story'),name=ref('late');let id=0;
const act=(i:Intent)=>{const next=dispatch(game.value,{...i,id:`visual-review-${++id}`});if(!validState(next))throw Error('Invalid state');game.value=next;};
const pick=(n:string)=>{game.value=structuredClone(checkpoints[n]);name.value=n;mode.value=n==='question'?'question':n==='tide'?'tide':'story';};
(window as any).visualReview={pick,act,state:()=>JSON.parse(JSON.stringify(game.value)),names:Object.keys(checkpoints)};
createApp({setup:()=>()=>h('div',{style:'height:100vh;display:flex;flex-direction:column;background:#12251f;color:#eee;overflow:hidden'},[
 h('div',{style:'flex-shrink:0;display:flex;gap:4px;flex-wrap:wrap;font-size:12px'},[h('span','审查检查点 · 非新档试玩'),...Object.keys(checkpoints).map(n=>h('button',{onClick:()=>pick(n)},n)),h('button',{onClick:()=>mode.value='map'},'世界地图')]),
 h('div',{style:'flex:1;min-height:0;overflow:auto'},mode.value==='map'?h(WorldAtlas,{game:game.value,selected:'valley',story:true}):['question','tide'].includes(mode.value)?h(GoldenStoryScene,{game:game.value,busy:false,place:mode.value==='tide'?'sea':'conclave',onAct:act}):h(StoryScenes,{key:name.value,style:'height:100%',game:game.value,busy:false,showRoad:true,entryChapter:game.value.realm===3?'nascent':game.value.lizhao.location==='away'&&game.value.lizhao.cleared?'nascent':'lizhao',onAct:act}))
])}).mount('#app');
