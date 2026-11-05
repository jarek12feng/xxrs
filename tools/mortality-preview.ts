/** Isolated developer review on a dedicated origin. Never used by the game entry. */
import { createApp, h } from 'vue';
import { finishGoldenCompletion, goldenLateCheckpoint } from './golden-completion-checkpoint';
import { dispatch } from '../src/core';
import { save } from '../src/save';
const stages=finishGoldenCompletion(goldenLateCheckpoint()).checkpoints;
createApp({render:()=>h('main',{style:'padding:32px;font:18px sans-serif'},[
 h('h1','陨落隔离验收'),h('p','仅用于独立测试端口：装入隔离检查点后进入游戏，普通按钮结算陨落。不是正常新档连续试玩。'),
 ...['寿尽前一月','离照内层濒危','正式天劫濒危','金丹寿尽结局'].map((label,index)=>h('button',{style:'display:block;margin:20px;padding:18px',onClick:async()=>{
 const s=structuredClone(stages[index===1?'lizhao-battle':index===2?'thunder-start':'late']!);
 s.name='终章验收';
 if(index===1){s.lizhao.duel!.hp=1;s.herbs=0;}
 else if(index===2){s.nascentSoul.thunder.battle!.hp=1;s.herbs=0;}
 else s.age=s.limit-1;
 const ready=index===3?dispatch(s,{type:'advance',activity:'work',months:1,id:'review-last-month'}):s;
 await save(ready);window.location.href='/';
 }},label))
])}).mount('#review');
